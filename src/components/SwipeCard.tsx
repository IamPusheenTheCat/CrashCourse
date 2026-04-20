import { useState, useRef, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import type { QuizQuestion, SubmitAnswerResult } from '../types/quiz';

const COMMIT_DISTANCE = 80;
const FLICK_VELOCITY = 300;
const EXIT_X = 420;
const FAV_THRESHOLD = 60;

const CORRECT_FLY_DURATION_MS = 280;

function typeLabel(type: string): string {
  if (type === 'single_choice') return 'Choose one';
  if (type === 'true_false') return 'True or False';
  return type.replace(/_/g, ' ');
}

interface Props {
  question: QuizQuestion;
  onSubmitAnswer: (optionId: string) => Promise<SubmitAnswerResult>;
  onAfterCorrect: () => void;
  onIncorrect: (result: SubmitAnswerResult) => void;
  onFavorite: () => void;
  isFavorited?: boolean;
  shaking?: boolean;
}

export default function SwipeCard({
  question,
  onSubmitAnswer,
  onAfterCorrect,
  onIncorrect,
  onFavorite,
  isFavorited = false,
  shaking = false,
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

  const canSubmit = selectedOptionId !== null && question.options.length > 0;

  const handleDragEnd = useCallback(
    async (_: unknown, info: PanInfo) => {
      if (committed.current || submitting) return;

      const dx = info.offset.x;
      const vx = info.velocity.x;
      const dy = info.offset.y;

      if (dy < -FAV_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
        onFavorite();
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
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
      if (!canSubmit) {
        animate(x, 0, { type: 'spring', stiffness: 500, damping: 30 });
        animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
        return;
      }

      committed.current = true;
      setSubmitting(true);
      const target = direction === 'right' ? EXIT_X : -EXIT_X;

      try {
        const result = await onSubmitAnswer(selectedOptionId!);
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
      animate(y, 0, { type: 'spring', stiffness: 500, damping: 30 });
    },
    [canSubmit, onSubmitAnswer, onAfterCorrect, onIncorrect, onFavorite, selectedOptionId, submitting, x, y],
  );

  return (
    <div className="relative">
      <motion.div
        className="absolute -top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/90 shadow-lg"
        style={{ opacity: favIndicatorOpacity, scale: favIndicatorScale }}
      >
        <i className="fas fa-heart text-white text-sm" />
        <span className="text-white text-sm font-semibold">
          {isFavorited ? 'Remove' : 'Favorite'}
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
          <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-amber-500/90 flex items-center justify-center shadow-md">
            <i className="fas fa-heart text-white text-xs" />
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
          <i className="fas fa-traffic-light text-3xl text-white/80 relative z-10 drop-shadow-lg" />
        </div>

        <div className="p-5">
          <p className="text-white/60 text-xs uppercase tracking-wider mb-2">{typeLabel(question.type)}</p>
          <p className="text-lg font-medium leading-snug text-white">{question.content}</p>

          {question.options.length === 0 ? (
            <p className="text-white/60 text-sm mt-6">No options for this question.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-6">
              {question.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={submitting}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedOptionId(opt.id);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors text-white/90
                    ${
                      selectedOptionId === opt.id
                        ? 'bg-white/15 ring-2 ring-[#e94560]'
                        : 'bg-white/10 border border-white/20 hover:bg-white/15'
                    }`}
                >
                  <span className="text-white/50 font-mono text-xs mr-2">{opt.id}.</span>
                  {opt.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <div className="flex items-center justify-center gap-8 mt-6 text-white/60 text-sm">
        <span>
          <i className="fas fa-arrows-alt-h mr-1" />
          Submit
        </span>
        <span>
          <i className="fas fa-arrow-up mr-1" /> Favorite
        </span>
      </div>
    </div>
  );
}
