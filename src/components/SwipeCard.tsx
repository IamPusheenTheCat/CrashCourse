import { useState, useRef, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import type { QuizQuestion, SubmitAnswerResult } from '../types/quiz';
import QuestionContentText from './QuestionContentText';

const COMMIT_DISTANCE = 80;
const FLICK_VELOCITY = 300;
const EXIT_X = 420;
const FAV_THRESHOLD = 60;

const CORRECT_FLY_DURATION_MS = 280;
/** 键盘提交前模拟「拉够距离再松手」的横向位移 */
const KEYBOARD_SUBMIT_WINDUP_X = COMMIT_DISTANCE + 28;
/** 键盘收藏前模拟上滑，略超过 FAV_THRESHOLD 以带出爱心提示 */
const KEYBOARD_FAVOR_WINDUP_Y = FAV_THRESHOLD + 22;

/** 右滑 / → → True，左滑 / ← → False（与后端选项 id 对应） */
function optionIdForTrueFalseSwipe(direction: 'left' | 'right'): 'A' | 'B' {
  return direction === 'right' ? 'A' : 'B';
}

/**
 * 后端 type 可能不是严格的 `true_false`；凡明确为 A/B 双选项的题按 T/F 交互处理（与当前题库一致）。
 */
function isTrueFalseQuestion(q: QuizQuestion): boolean {
  const raw = (q.type || '').trim().toLowerCase();
  const norm = raw.replace(/[-\s]+/g, '_');
  if (norm === 'true_false' || norm === 'truefalse' || raw === 'tf') return true;
  if (q.options.length === 2) {
    const ids = new Set(q.options.map((o) => String(o.id).trim().toUpperCase()));
    return ids.has('A') && ids.has('B');
  }
  return false;
}

interface Props {
  question: QuizQuestion;
  onSubmitAnswer: (optionId: string) => Promise<SubmitAnswerResult>;
  onAfterCorrect: () => void;
  onIncorrect: (result: SubmitAnswerResult) => void;
  onFavorite: () => void;
  isFavorited?: boolean;
  shaking?: boolean;
  /** 全屏遮罩 / tour 等：禁用键盘快捷方式 */
  shortcutsDisabled?: boolean;
}

function isFinePointerDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: fine)').matches;
}

export default function SwipeCard({
  question,
  onSubmitAnswer,
  onAfterCorrect,
  onIncorrect,
  onFavorite,
  isFavorited = false,
  shaking = false,
  shortcutsDisabled = false,
}: Props) {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(
    x,
    [-EXIT_X, -150, 0, 150, EXIT_X],
    [0, 1, 1, 1, 0],
  );

  const favIndicatorOpacity = useTransform(y, [0, -FAV_THRESHOLD], [0, 1]);
  const favIndicatorScale = useTransform(y, [0, -FAV_THRESHOLD], [0.5, 1]);

  const committed = useRef(false);
  /** 键盘触发的位移动画进行中，避免连击与拖拽抢状态 */
  const keyboardMotionLocked = useRef(false);

  const isTrueFalse = isTrueFalseQuestion(question);
  const canSubmit =
    question.options.length > 0 && (isTrueFalse || selectedOptionId !== null);

  useEffect(() => {
    setSelectedOptionId(null);
  }, [question.question_id]);

  const resetCardPosition = useCallback(async () => {
    await Promise.all([
      animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 }),
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 }),
    ]);
  }, [x, y]);

  const performFavorite = useCallback(() => {
    if (keyboardMotionLocked.current || committed.current || submitting) return;
    onFavorite();
    void resetCardPosition();
  }, [onFavorite, submitting, resetCardPosition]);

  const performFavoriteWithKeyboardMotion = useCallback(async () => {
    if (keyboardMotionLocked.current || committed.current || submitting) return;
    keyboardMotionLocked.current = true;
    try {
      await animate(y, -KEYBOARD_FAVOR_WINDUP_Y, {
        type: 'spring',
        stiffness: 420,
        damping: 30,
      });
      onFavorite();
      await resetCardPosition();
    } finally {
      keyboardMotionLocked.current = false;
    }
  }, [onFavorite, submitting, resetCardPosition, y]);

  const performSubmit = useCallback(
    async (direction: 'left' | 'right') => {
      if (committed.current || submitting) return;
      if (!canSubmit) {
        void animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        void animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }

      committed.current = true;
      setSubmitting(true);
      const target = direction === 'right' ? EXIT_X : -EXIT_X;
      const optionId = isTrueFalse ? optionIdForTrueFalseSwipe(direction) : selectedOptionId;
      if (!optionId) {
        committed.current = false;
        setSubmitting(false);
        void animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        void animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }

      try {
        const result = await onSubmitAnswer(optionId);
        if (result.is_correct) {
          await animate(x, target, {
            duration: CORRECT_FLY_DURATION_MS / 1000,
            ease: [0.25, 0.46, 0.45, 0.94],
          });
          onAfterCorrect();
        } else {
          await animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
          onIncorrect(result);
          committed.current = false;
        }
      } catch {
        await animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        committed.current = false;
      } finally {
        setSubmitting(false);
      }
      void animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    },
    [
      canSubmit,
      isTrueFalse,
      onSubmitAnswer,
      onAfterCorrect,
      onIncorrect,
      selectedOptionId,
      submitting,
      x,
      y,
    ],
  );

  const performSubmitWithKeyboardMotion = useCallback(
    async (direction: 'left' | 'right') => {
      if (keyboardMotionLocked.current || committed.current || submitting) return;
      keyboardMotionLocked.current = true;
      try {
        if (!canSubmit) {
          const bump = direction === 'right' ? 46 : -46;
          await animate(x, bump, { duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] });
          await animate(x, 0, { type: 'spring', stiffness: 500, damping: 28 });
          await animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
          return;
        }
        const pull = direction === 'right' ? KEYBOARD_SUBMIT_WINDUP_X : -KEYBOARD_SUBMIT_WINDUP_X;
        await animate(x, pull, { type: 'spring', stiffness: 400, damping: 30 });
        keyboardMotionLocked.current = false;
        await performSubmit(direction);
      } finally {
        keyboardMotionLocked.current = false;
      }
    },
    [canSubmit, performSubmit, submitting, x, y],
  );

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (keyboardMotionLocked.current || committed.current || submitting) return;

      const dx = info.offset.x;
      const vx = info.velocity.x;
      const dy = info.offset.y;

      if (dy < -FAV_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        performFavorite();
        return;
      }

      const isFlick = Math.abs(vx) > FLICK_VELOCITY && Math.abs(dx) > 18;
      const isDistance = Math.abs(dx) > COMMIT_DISTANCE;

      if (!isFlick && !isDistance) {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }

      const direction = dx > 0 ? 'right' : 'left';
      await performSubmit(direction);
    },
    [performFavorite, performSubmit, submitting, x, y],
  );

  useEffect(() => {
    if (shortcutsDisabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      /** T/F 题：任意设备都可用方向键；其它题型仅在精细指针下避免误抢键 */
      if (!isTrueFalse && !isFinePointerDesktop()) return;
      if (e.repeat) return;
      if (committed.current || submitting) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        void performFavoriteWithKeyboardMotion();
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const direction = e.key === 'ArrowRight' ? 'right' : 'left';
        void performSubmitWithKeyboardMotion(direction);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    shortcutsDisabled,
    submitting,
    isTrueFalse,
    performFavoriteWithKeyboardMotion,
    performSubmitWithKeyboardMotion,
  ]);

  return (
    <div className="relative" data-product-tour="quiz-card">
      <motion.div
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 rounded-full border border-white/35 bg-cc-accent/45 px-4 py-2 shadow-lg backdrop-blur-xl"
        style={{ opacity: favIndicatorOpacity, scale: favIndicatorScale }}
      >
        <i className="fas fa-bookmark text-white text-sm" aria-hidden />
        <span className="text-sm font-semibold text-white">
          {isFavorited ? 'Remove' : 'Save'}
        </span>
      </motion.div>

      <motion.div
        className={`glass overflow-hidden rounded-[20px] shadow-2xl cursor-grab active:cursor-grabbing select-none ${shaking ? 'card-shake' : ''}`}
        style={{ x, y, rotate, opacity, touchAction: 'none' }}
        drag={!submitting}
        dragConstraints={{ left: -220, right: 220, top: -120, bottom: 0 }}
        dragElastic={{ left: 0.9, right: 0.9, top: 0.5, bottom: 0 }}
        onDragEnd={handleDragEnd}
      >
        {isFavorited && (
          <div
            className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/35 bg-cc-accent/45 shadow-md backdrop-blur-xl"
            title="Saved"
          >
            <i className="fas fa-bookmark text-white text-xs" aria-hidden />
          </div>
        )}

        <div className="h-28 relative bg-gradient-to-br from-[#0f3460]/90 to-[#e94560]/50 flex items-center justify-center overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=680&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <i className="fas fa-traffic-light text-3xl text-cc-muted relative z-10 drop-shadow-lg" />
        </div>

        <div className="px-5 pb-5 pt-3.5">
          {/* 与 glass 同语汇：cc-border 分割线 + 低对比圆点（不用高亮 accent），避免和头图/题干抢视觉 */}
          <div className="mb-2 flex items-center gap-2.5" aria-hidden>
            <div className="h-px min-w-0 flex-1 bg-cc-border" />
            <div className="size-1.5 shrink-0 rounded-full border border-white/18 bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
            <div className="h-px min-w-0 flex-1 bg-cc-border" />
          </div>
          <QuestionContentText
            content={question.content}
            className="text-lg font-medium leading-relaxed tracking-tight text-white text-pretty"
          />

          {question.options.length === 0 ? (
              <p className="text-cc-muted text-sm mt-6">No options for this question</p>
            ) : isTrueFalse ? (
              <div className="mt-6" data-product-tour="quiz-tf-hints">
                <div
                  className={`grid grid-cols-2 gap-2 ${submitting ? 'pointer-events-none' : ''}`}
                  aria-busy={submitting}
                >
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (submitting) return;
                      void performSubmitWithKeyboardMotion('left');
                    }}
                    className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-rose-400/30 bg-rose-950/30 px-3 py-3 text-center transition-transform active:scale-[0.97]"
                    aria-label="Answer false"
                    aria-disabled={submitting}
                  >
                    <i className="fas fa-arrow-left text-rose-200/90 text-base" aria-hidden />
                    <span className="text-base font-semibold text-rose-50">False</span>
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (submitting) return;
                      void performSubmitWithKeyboardMotion('right');
                    }}
                    className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-950/25 px-3 py-3 text-center transition-transform active:scale-[0.97]"
                    aria-label="Answer true"
                    aria-disabled={submitting}
                  >
                    <i className="fas fa-arrow-right text-emerald-200/90 text-base" aria-hidden />
                    <span className="text-base font-semibold text-emerald-50">True</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className={`flex flex-col gap-2 mt-6 ${submitting ? 'pointer-events-none' : ''}`}>
                {question.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (submitting) return;
                      setSelectedOptionId(opt.id);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors text-cc-fg
                    ${
                      selectedOptionId === opt.id
                        ? 'bg-white/15 ring-2 ring-cc-accent'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                    aria-disabled={submitting}
                  >
                  <span className="text-cc-muted font-mono text-xs mr-2">{opt.id}.</span>
                  {opt.text}
                </button>
              ))}
            </div>
            )}
        </div>
      </motion.div>

      {isTrueFalse ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[11px] text-cc-muted/70">
          <span className="inline-flex items-center gap-2">
            <i className="fas fa-arrows-alt-h text-[13px] opacity-80" />
            <span>Drag sideways to answer</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="fas fa-arrow-up text-[13px] opacity-80" />
            <span>Swipe up to save</span>
          </span>
        </div>
      ) : (
        <div className="mt-6 text-center text-cc-muted text-sm">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
            <span>
              <i className="fas fa-arrows-alt-h mr-1" />
              Submit choice
            </span>
            <span>
              <i className="fas fa-arrow-up mr-1" /> Save
            </span>
          </div>
          <p className="mt-1.5 text-[11px] text-cc-muted/80">
            Keyboard (desktop): ← → submit choice · ↑ save
          </p>
        </div>
      )}
    </div>
  );
}
