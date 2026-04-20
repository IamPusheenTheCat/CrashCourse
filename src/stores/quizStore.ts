import { create } from 'zustand';
import type { QuizQuestion, SubmitAnswerResult } from '../types/quiz';
import * as api from '../api/services';

export type QuizSource = 'practice' | 'review_favorite' | 'review_mistake';

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
  reviewIndex: number;
  streak: number;

  startPractice: () => Promise<void>;
  startReview: (mode: 'favorite' | 'mistake') => Promise<void>;
  submitCurrent: (selectedOption: string) => Promise<SubmitAnswerResult>;
  toggleFavorite: () => Promise<void>;
  advanceAfterAnswer: () => Promise<void>;
  clearQuiz: () => void;

  getReviewProgress: () => string;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  source: null,
  current: null,
  loading: false,
  error: null,
  reviewIds: [],
  reviewIndex: 0,
  streak: 0,

  clearQuiz: () =>
    set({
      source: null,
      current: null,
      loading: false,
      error: null,
      reviewIds: [],
      reviewIndex: 0,
      streak: 0,
    }),

  startPractice: async () => {
    set({ loading: true, error: null, source: 'practice', reviewIds: [], reviewIndex: 0 });
    try {
      const detail = await api.getNextQuestion();
      set({ current: mapDetail(detail), loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load question';
      set({ current: null, loading: false, error: msg });
    }
  },

  startReview: async (mode) => {
    const source = mode === 'favorite' ? 'review_favorite' : 'review_mistake';
    set({ loading: true, error: null, source, streak: 0 });
    try {
      const page = await (mode === 'favorite' ? api.getFavoriteList(1, 200) : api.getMistakeList(1, 200));
      const ids = page.list.map((x) => x.question_id);
      if (ids.length === 0) {
        set({ current: null, reviewIds: [], reviewIndex: 0, loading: false, error: 'Nothing to review yet.' });
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

  advanceAfterAnswer: async () => {
    const { source, reviewIds, reviewIndex } = get();
    if (!source) return;

    if (source === 'practice') {
      set({ loading: true, error: null });
      try {
        const detail = await api.getNextQuestion();
        set({ current: mapDetail(detail), loading: false });
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
}));
