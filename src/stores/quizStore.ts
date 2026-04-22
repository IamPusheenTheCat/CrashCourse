import { create } from 'zustand';
import type { QuizQuestion, SubmitAnswerResult } from '../types/quiz';
import * as api from '../api/services';

type QuestionDetail = api.QuestionDetail;

export type QuizSource = 'practice' | 'review_favorite' | 'review_mistake';

/** 防止 React Strict Mode 或快速重复点击导致并发 get_next */
let practiceStartInFlight = false;

function mapDetail(d: api.QuestionDetail): QuizQuestion {
  return {
    question_id: d.question_id,
    content: d.content,
    type: d.type,
    options: d.options ?? [],
    status: d.status ?? { is_favorited: false, is_mistake: false },
  };
}

interface QuizState {
  source: QuizSource | null;
  current: QuizQuestion | null;
  loading: boolean;
  error: string | null;
  reviewIds: number[];
  /** 当前题在固定列表中的 0-based 下标；展示为「第几题」用 index + 1 */
  reviewIndex: number;
  streak: number;
  /** 进入练习时 get_available_count，用于进度条；拉取失败则为 null（仍用脉冲条） */
  practiceSessionTotal: number | null;
  /** 练习会话当前题 0-based 下标（打开本题即算入进度，展示为 index + 1） */
  practiceProgressIndex: number;

  startPractice: () => Promise<void>;
  startReview: (mode: 'favorite' | 'mistake') => Promise<void>;
  submitCurrent: (selectedOption: string) => Promise<SubmitAnswerResult>;
  toggleFavorite: () => Promise<void>;
  /** 练习模式下可传入已预取的下一题，避免 Continue 后再打 get_next 并闪 loading */
  advanceAfterAnswer: (opts?: { practiceNextPrefetched?: QuestionDetail }) => Promise<void>;
  clearQuiz: () => void;

  getReviewProgress: () => string;
  getPracticeProgress: () => string;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  source: null,
  current: null,
  loading: false,
  error: null,
  reviewIds: [],
  reviewIndex: 0,
  streak: 0,
  practiceSessionTotal: null,
  practiceProgressIndex: 0,

  clearQuiz: () =>
    set({
      source: null,
      current: null,
      loading: false,
      error: null,
      reviewIds: [],
      reviewIndex: 0,
      streak: 0,
      practiceSessionTotal: null,
      practiceProgressIndex: 0,
    }),

  startPractice: async () => {
    if (practiceStartInFlight) return;
    practiceStartInFlight = true;
    set({
      loading: true,
      error: null,
      source: 'practice',
      reviewIds: [],
      reviewIndex: 0,
      practiceProgressIndex: 0,
      practiceSessionTotal: null,
    });
    try {
      let sessionTotal: number | null = null;
      try {
        const n = await api.getAvailableQuestionsCount();
        sessionTotal = n > 0 ? n : null;
      } catch {
        sessionTotal = null;
      }
      try {
        const detail = await api.getNextQuestion();
        set({
          current: mapDetail(detail),
          loading: false,
          practiceSessionTotal: sessionTotal,
          practiceProgressIndex: 0,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load question';
        set({
          current: null,
          loading: false,
          error: msg,
          practiceSessionTotal: null,
          practiceProgressIndex: 0,
        });
      }
    } finally {
      practiceStartInFlight = false;
    }
  },

  startReview: async (mode) => {
    const source = mode === 'favorite' ? 'review_favorite' : 'review_mistake';
    set({
      loading: true,
      error: null,
      source,
      streak: 0,
      practiceSessionTotal: null,
      practiceProgressIndex: 0,
    });
    try {
      const ids =
        mode === 'favorite'
          ? await api.fetchAllFavoriteQuestionIds()
          : await api.fetchAllMistakeQuestionIds();
      if (ids.length === 0) {
        set({
          current: null,
          reviewIds: [],
          reviewIndex: 0,
          loading: false,
          error:
            mode === 'favorite'
              ? 'No favorites to review'
              : 'No mistakes to review',
        });
        return;
      }
      const first = await api.getQuestionDetail(ids[0]);
      set({
        reviewIds: ids,
        reviewIndex: 0,
        current: mapDetail(first),
        loading: false,
        error: null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to start review';
      set({ current: null, reviewIds: [], loading: false, error: msg });
    }
  },

  submitCurrent: async (selectedOption) => {
    const q = get().current;
    if (!q) throw new Error('No question loaded');
    const data = await api.submitAnswer(q.question_id, selectedOption);
    set((s) => ({
      streak: data.is_correct ? s.streak + 1 : 0,
    }));
    return {
      is_correct: data.is_correct,
      correct_option: data.correct_option,
      warning_video_url: data.warning_video_url ?? null,
      explanation: data.explanation ?? '',
    };
  },

  toggleFavorite: async () => {
    const q = get().current;
    if (!q) return;
    const nextFav = !q.status.is_favorited;
    if (nextFav) await api.addFavorite(q.question_id);
    else await api.delFavorite(q.question_id);
    set({
      current: {
        ...q,
        status: { ...q.status, is_favorited: nextFav },
      },
    });
  },

  advanceAfterAnswer: async (opts?: { practiceNextPrefetched?: QuestionDetail }) => {
    const { source, reviewIds, reviewIndex } = get();
    if (!source) return;

    if (source === 'practice') {
      const prefetched = opts?.practiceNextPrefetched;
      if (prefetched) {
        set({ error: null });
      } else {
        set({ loading: true, error: null });
      }
      try {
        const detail = prefetched ?? (await api.getNextQuestion());
        /** 途中会有新题变 due：每次进下一题后重拉可做数量，分母用 max(新总数, 当前题序) 避免进度倒错 / 超 100% */
        let freshCount = 0;
        let countOk = false;
        try {
          freshCount = await api.getAvailableQuestionsCount();
          countOk = true;
        } catch {
          /* 保留进入本段前的 practiceSessionTotal */
        }
        set((s) => {
          const nextIdx = s.practiceProgressIndex + 1;
          const prevTotal = s.practiceSessionTotal;
          /** 可做数量会因答题/调度变少；分母不得小于本会话曾出现过的值，避免出现 2/6 这种比 1/7 还小的分母 */
          const nextTotal = countOk
            ? Math.max(freshCount, nextIdx + 1, prevTotal ?? 0)
            : prevTotal != null && prevTotal > 0
              ? Math.max(prevTotal, nextIdx + 1)
              : prevTotal;
          return {
            current: mapDetail(detail),
            loading: false,
            practiceProgressIndex: nextIdx,
            practiceSessionTotal: nextTotal,
          };
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'No more questions';
        set({ current: null, loading: false, error: msg });
      }
      return;
    }

    const nextIdx = reviewIndex + 1;
    if (nextIdx >= reviewIds.length) {
      set({ current: null, error: null });
      return;
    }
    set({ loading: true, error: null });
    try {
      const detail = await api.getQuestionDetail(reviewIds[nextIdx]);
      set({
        current: mapDetail(detail),
        reviewIndex: nextIdx,
        loading: false,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load question';
      set({ loading: false, error: msg });
    }
  },

  getReviewProgress: () => {
    const s = get();
    if (s.source !== 'review_favorite' && s.source !== 'review_mistake') return '';
    if (s.reviewIds.length === 0) return '';
    return `${s.reviewIndex + 1} / ${s.reviewIds.length}`;
  },

  getPracticeProgress: () => {
    const s = get();
    if (s.source !== 'practice') return '';
    const t = s.practiceSessionTotal;
    if (t == null || t <= 0) return '';
    return `${s.practiceProgressIndex + 1} / ${t}`;
  },
}));
