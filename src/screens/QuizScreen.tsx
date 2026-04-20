import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { goBackOrMenu } from '../navigation/goBackOrMenu';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from '../components/SwipeCard';
import VideoOverlay from '../components/VideoOverlay';
import { useQuizStore } from '../stores/quizStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHideTab } from '../components/AppShell';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { FEEDBACK_DURATION_MS } from '../components/VideoOverlay';
import type { SubmitAnswerResult } from '../types/quiz';

/** Pool empty / nothing to serve next — show “practice complete”, not a load failure */
function isPracticeFinishedNoMore(message: string): boolean {
  const m = message.trim().toLowerCase();
  return m.includes('no question available') || m.includes('no more questions');
}

export default function QuizScreen() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();

  const current = useQuizStore((s) => s.current);
  const loading = useQuizStore((s) => s.loading);
  const error = useQuizStore((s) => s.error);
  const source = useQuizStore((s) => s.source);
  const streak = useQuizStore((s) => s.streak);
  const reviewIds = useQuizStore((s) => s.reviewIds);
  const reviewIndex = useQuizStore((s) => s.reviewIndex);
  const submitCurrent = useQuizStore((s) => s.submitCurrent);
  const advanceAfterAnswer = useQuizStore((s) => s.advanceAfterAnswer);
  const toggleFavorite = useQuizStore((s) => s.toggleFavorite);
  const getReviewProgress = useQuizStore((s) => s.getReviewProgress);
  const startPractice = useQuizStore((s) => s.startPractice);
  const videoAutoplayOnWrong = useSettingsStore((s) => s.videoAutoplayOnWrong);

  const hideTab = useHideTab();

  const [wrongVideo, setWrongVideo] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [shaking, setShaking] = useState(false);
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [favToast, setFavToast] = useState<string | null>(null);
  const favToastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isReview = source === 'review_favorite' || source === 'review_mistake';
  const reviewDone = isReview && !loading && !error && !current && reviewIds.length > 0;
  const needsPracticeKickoff = !source && !current && !loading && !error;

  useLayoutEffect(() => {
    if (!source && !current && !loading && !error) void startPractice();
  }, [source, current, loading, error, startPractice]);

  useEffect(() => {
    hideTab(wrongVideo !== null);
  }, [wrongVideo, hideTab]);

  useEffect(() => {
    const src = current ? (wrongVideo?.src ?? null) : null;
    if (!src) return;
    const el = document.createElement('video');
    el.preload = 'auto';
    el.muted = true;
    el.playsInline = true;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    el.src = src;
    document.body.appendChild(el);
    return () => {
      try {
        document.body.removeChild(el);
      } catch (_) {}
    };
  }, [current?.question_id, wrongVideo?.src]);

  const handleSubmitAnswer = useCallback(
    async (optionId: string) => {
      return submitCurrent(optionId);
    },
    [submitCurrent],
  );

  const runAdvance = useCallback(async () => {
    await advanceAfterAnswer();
    setCardKey((k) => k + 1);
  }, [advanceAfterAnswer]);

  const handleAfterCorrect = useCallback(() => {
    setShowCorrectOverlay(true);
    setTimeout(() => {
      setShowCorrectOverlay(false);
      void runAdvance();
    }, FEEDBACK_DURATION_MS);
  }, [runAdvance]);

  const handleIncorrect = useCallback(
    (result: SubmitAnswerResult) => {
      setShaking(true);
      if (isNative) {
        Haptics.notification({ type: NotificationType.Error }).catch(() => {});
        setTimeout(() => {
          Haptics.vibrate({ duration: 80 }).catch(() => {});
        }, 50);
      }
      const videoUrl = result.warning_video_url?.trim() || '';
      const openVideoAfterShake = () => {
        setShaking(false);
        if (videoUrl && videoAutoplayOnWrong) {
          setWrongVideo({
            src: videoUrl,
            label: result.explanation?.trim() || `Correct answer: ${result.correct_option}`,
          });
        } else {
          void runAdvance();
        }
      };
      setTimeout(openVideoAfterShake, FEEDBACK_DURATION_MS);
    },
    [isNative, runAdvance, videoAutoplayOnWrong],
  );

  const handleVideoContinue = useCallback(() => {
    setWrongVideo(null);
    void runAdvance();
  }, [runAdvance]);

  const handleFavorite = useCallback(async () => {
    if (!current) return;
    const wasFav = current.status.is_favorited;
    try {
      await toggleFavorite();
      if (isNative) {
        Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
      }
      clearTimeout(favToastTimer.current);
      setFavToast(!wasFav ? 'Added to favorites' : 'Removed from favorites');
      favToastTimer.current = setTimeout(() => setFavToast(null), 1500);
    } catch {
      clearTimeout(favToastTimer.current);
      setFavToast('Could not update favorites');
      favToastTimer.current = setTimeout(() => setFavToast(null), 1500);
    }
  }, [current, toggleFavorite, isNative]);

  if (needsPracticeKickoff) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)] px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <i className="fas fa-circle-notch fa-spin text-2xl text-[#e94560] mb-3" />
          <p className="text-white/80 text-sm">Starting practice…</p>
        </div>
      </div>
    );
  }

  if (loading && !current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)]">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <i className="fas fa-circle-notch fa-spin text-2xl text-[#e94560] mb-3" />
          <p className="text-white/80 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (error && !current && source === 'practice') {
    const finished = isPracticeFinishedNoMore(error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)] px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          {finished ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-circle-check text-3xl text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Practice complete</h2>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/25 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-circle text-2xl text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Could not load practice</h2>
              <p className="text-white/75 text-sm mt-2 leading-relaxed">{error}</p>
            </>
          )}
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className={`w-full mt-6 py-3.5 rounded-xl font-semibold active:scale-[0.98] transition-transform ${
              finished
                ? 'bg-[#e94560] text-white shadow-lg shadow-[#e94560]/25'
                : 'border border-white/25 text-white'
            }`}
          >
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  if (reviewDone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)] px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-circle-check text-3xl text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">Review complete</h2>
          <p className="text-white/80 text-sm mt-2">You have finished this review list.</p>
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full mt-6 py-3.5 rounded-xl bg-[#e94560] text-white font-semibold"
          >
            Back to menu
          </button>
        </div>
      </div>
    );
  }

  if (!current && isReview && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)] px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <p className="text-white/90 text-sm">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/review')}
            className="w-full mt-6 py-3.5 rounded-xl bg-[#e94560] text-white font-semibold"
          >
            Back to review
          </button>
        </div>
      </div>
    );
  }

  const progressLabel = isReview ? getReviewProgress() : null;

  return (
    <>
      {wrongVideo && (
        <VideoOverlay
          videoSrc={wrongVideo.src}
          label={wrongVideo.label}
          onContinue={handleVideoContinue}
        />
      )}

      <AnimatePresence>
        {showCorrectOverlay && (
          <motion.div
            className="fixed left-1/2 top-[18vh] z-[150] pointer-events-none -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="inline-flex items-center gap-3 rounded-2xl bg-emerald-500 px-6 py-3.5 text-white text-lg font-bold shadow-lg">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/25">
                <i className="fas fa-check text-xl text-white" />
              </span>
              Correct!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {favToast && (
          <motion.div
            key={favToast}
            className="fixed left-1/2 bottom-[14vh] z-[150] pointer-events-none -translate-x-1/2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/90 px-5 py-2.5 text-white text-sm font-semibold shadow-lg">
              <i className="fas fa-heart" />
              {favToast}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 pb-4">
        <header className="flex items-center justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() =>
                source === 'practice' ? navigate('/menu') : goBackOrMenu(navigate)
              }
              className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
              aria-label={source === 'practice' ? 'Back to menu' : 'Go back'}
            >
              <i className="fas fa-arrow-left" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold truncate">
                {source === 'practice' ? 'Quiz' : source === 'review_mistake' ? 'Wrong book' : 'Favorites'}
              </h1>
              {source === 'practice' ? (
                <p className="text-[10px] text-white/45 leading-snug mt-0.5 line-clamp-2">
                  Smart order · Powered by Ebbinghaus Forgetting Curve
                </p>
              ) : isReview ? (
                <p className="text-[11px] text-white/45 leading-snug mt-0.5 line-clamp-2">
                  Wrong answers & favorites
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm shrink-0">
            <i className="fas fa-fire-alt" />
            <span>{streak} streak</span>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
            {isReview && reviewIds.length > 0 ? (
              <motion.div
                className="h-full rounded-full bg-[#e94560]"
                animate={{
                  width: `${Math.round(((reviewIndex + 1) / reviewIds.length) * 100)}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            ) : source === 'practice' ? (
              <motion.div
                className="h-full w-full rounded-full bg-white/35"
                animate={{ opacity: [0.25, 0.55, 0.25] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            ) : (
              <div className="h-full w-full rounded-full bg-white/10" />
            )}
          </div>
          <span className="text-xs text-white/70 whitespace-nowrap shrink-0">
            {progressLabel ?? (source === 'practice' ? null : '—')}
          </span>
        </div>

        <div className="min-h-[420px] flex items-center justify-center relative">
          {current && (
            <AnimatePresence mode="wait">
              <motion.div
                key={cardKey}
                className="w-full max-w-[340px]"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              >
                <SwipeCard
                  question={current}
                  onSubmitAnswer={handleSubmitAnswer}
                  onAfterCorrect={handleAfterCorrect}
                  onIncorrect={handleIncorrect}
                  onFavorite={handleFavorite}
                  isFavorited={current.status.is_favorited}
                  shaking={shaking}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
