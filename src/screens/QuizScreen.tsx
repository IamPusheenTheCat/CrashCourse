import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from '../components/SwipeCard';
import VideoOverlay from '../components/VideoOverlay';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHideTab } from '../components/AppShell';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { FEEDBACK_DURATION_MS } from '../components/VideoOverlay';
import type { SubmitAnswerResult } from '../types/quiz';
import { MISTAKE_LIST_RULE } from '../constants/reviewCopy';
import {
  PRACTICE_COMPLETE_HEADLINE,
  PRACTICE_COMPLETE_SUBLINE,
  PRACTICE_MODE_SUBTITLE,
} from '../constants/practiceModeCopy';
import PrimaryButton from '../components/ui/PrimaryButton';
import QuizSessionHeader from '../components/ui/QuizSessionHeader';
import ProductTourOverlay, { type ProductTourStep } from '../components/ProductTourOverlay';
import {
  markQuizProductTourDone,
  markQuizWrongVideoTourDone,
  readQuizProductTourDone,
  readQuizWrongVideoTourDone,
} from '../constants/productTourStorage';
import * as api from '../api/services';

/** Pool empty / nothing to serve next — show “practice complete”, not a load failure */
function isPracticeFinishedNoMore(message: string): boolean {
  const m = message.trim().toLowerCase();
  return m.includes('no question available') || m.includes('no more questions');
}

const QUIZ_TOUR_STEPS: ProductTourStep[] = [
  {
    selector: '[data-product-tour="quiz-back"]',
    title: 'Go back',
    body: 'Need a breather? Tap here anytime to go back.',
    inflate: 6,
  },
  {
    selector: '[data-product-tour="quiz-progress"]',
    title: 'Session progress',
    body: 'Watch this bar grow as you go.',
    inflate: 8,
  },
  {
    selector: '[data-product-tour="quiz-streak"]',
    title: 'Session progress',
    body: 'Your streak sits beside the flame — it goes up by one each time you nail another correct answer in a row.',
    inflate: 8,
  },
  {
    selector: '[data-product-tour="quiz-card"]',
    title: 'Tap and swipe',
    body: 'Tap a choice on the card to select your answer. Swipe left or right to submit; swipe up to toggle favorite.',
    inflate: 12,
  },
  {
    selector: '[data-product-tour="shell-tabs"]',
    title: 'Bottom navigation',
    body: 'Hop between the quiz you are in and Profile.',
    inflate: 0,
  },
];

const WRONG_VIDEO_TOUR_STEPS: ProductTourStep[] = [
  {
    selector: '[data-product-tour="quiz-wrong-continue"]',
    title: 'Wrong answer',
    body: 'Wrong answers open a short full-screen video. Tap Continue when you are ready for the next question.',
    inflate: 6,
  },
];

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
  const getPracticeProgress = useQuizStore((s) => s.getPracticeProgress);
  const practiceSessionTotal = useQuizStore((s) => s.practiceSessionTotal);
  const practiceProgressIndex = useQuizStore((s) => s.practiceProgressIndex);
  const startPractice = useQuizStore((s) => s.startPractice);
  const clearQuiz = useQuizStore((s) => s.clearQuiz);
  const videoAutoplayOnWrong = useSettingsStore((s) => s.videoAutoplayOnWrong);

  const hideTab = useHideTab();
  const userId = useAuthStore((s) => s.userId);

  const [wrongVideo, setWrongVideo] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const [shaking, setShaking] = useState(false);
  const [showCorrectOverlay, setShowCorrectOverlay] = useState(false);
  const [favToast, setFavToast] = useState<string | null>(null);
  const favToastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [quizTourOpen, setQuizTourOpen] = useState(false);
  const [wrongVideoTourOpen, setWrongVideoTourOpen] = useState(false);
  /** 错题全屏视频播放期间预取下一题，Continue 时直接换题、不闪 loading */
  const practiceNextPrefetchRef = useRef<Promise<api.QuestionDetail> | null>(null);

  const isReview = source === 'review_favorite' || source === 'review_mistake';

  const exitReviewToReviewScreen = useCallback(() => {
    clearQuiz();
    navigate('/review');
  }, [clearQuiz, navigate]);
  const reviewDone = isReview && !loading && !error && !current && reviewIds.length > 0;
  const needsPracticeKickoff = !source && !current && !loading && !error;

  useLayoutEffect(() => {
    if (!source && !current && !loading && !error) void startPractice();
  }, [source, current, loading, error, startPractice]);

  useEffect(() => {
    hideTab(wrongVideo !== null);
  }, [wrongVideo, hideTab]);

  const quizTourEligible =
    userId != null &&
    source === 'practice' &&
    current != null &&
    !loading &&
    wrongVideo == null &&
    !readQuizProductTourDone(userId);

  useEffect(() => {
    if (!quizTourEligible) {
      setQuizTourOpen(false);
      return;
    }
    const tid = window.setTimeout(() => setQuizTourOpen(true), 450);
    return () => window.clearTimeout(tid);
  }, [quizTourEligible, userId, source, current?.question_id, wrongVideo, loading]);

  const wrongVideoTourEligible =
    userId != null && wrongVideo != null && !readQuizWrongVideoTourDone(userId);

  useEffect(() => {
    if (!wrongVideoTourEligible) {
      setWrongVideoTourOpen(false);
      return;
    }
    const tid = window.setTimeout(() => setWrongVideoTourOpen(true), 500);
    return () => window.clearTimeout(tid);
  }, [wrongVideoTourEligible, userId, wrongVideo?.src]);

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
          practiceNextPrefetchRef.current = api.getNextQuestion();
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

  const handleVideoContinue = useCallback(async () => {
    const prefetch = practiceNextPrefetchRef.current;
    practiceNextPrefetchRef.current = null;
    let prefetched: api.QuestionDetail | undefined;
    if (prefetch) {
      try {
        prefetched = await prefetch;
      } catch {
        /* 预取失败则退回常规拉题 */
      }
    }
    try {
      if (prefetched) {
        await advanceAfterAnswer({ practiceNextPrefetched: prefetched });
      } else {
        await advanceAfterAnswer();
      }
    } finally {
      setWrongVideo(null);
    }
  }, [advanceAfterAnswer]);

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
          <i className="fas fa-circle-notch fa-spin text-2xl text-cc-accent mb-3" />
          <p className="text-cc-muted text-sm">Starting practice…</p>
        </div>
      </div>
    );
  }

  if (loading && !current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)]">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <i className="fas fa-circle-notch fa-spin text-2xl text-cc-accent mb-3" />
          <p className="text-cc-muted text-sm">Loading…</p>
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
              <h2 className="text-xl font-bold text-white leading-snug">{PRACTICE_COMPLETE_HEADLINE}</h2>
              <p className="text-cc-muted text-sm mt-2 leading-relaxed">{PRACTICE_COMPLETE_SUBLINE}</p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/25 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-circle text-2xl text-amber-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Could not load practice</h2>
              <p className="text-cc-muted text-sm mt-2 leading-relaxed">{error}</p>
            </>
          )}
          <PrimaryButton
            variant={finished ? 'accent' : 'outline'}
            className="mt-6"
            onClick={() => navigate('/menu')}
          >
            Back to menu
          </PrimaryButton>
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
          <PrimaryButton variant="accent" className="mt-6" onClick={exitReviewToReviewScreen}>
            Back to review
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (!current && isReview && error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)] px-4">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <p className="text-cc-fg text-sm">{error}</p>
          <PrimaryButton variant="accent" className="mt-6" onClick={exitReviewToReviewScreen}>
            Back to review
          </PrimaryButton>
        </div>
      </div>
    );
  }

  const progressLabel = isReview ? getReviewProgress() : source === 'practice' ? getPracticeProgress() : null;

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
            className="fixed left-1/2 top-[18vh] z-[150] w-max max-w-[min(100%,calc(100vw-2.5rem))] pointer-events-none -translate-x-1/2"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <span className="inline-flex items-center gap-3 rounded-2xl border border-emerald-300/40 bg-emerald-500/22 px-6 py-3.5 text-lg font-bold text-white shadow-lg backdrop-blur-xl">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm">
                <i className="fas fa-check text-xl text-emerald-100" aria-hidden />
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
            className="fixed left-1/2 bottom-[14vh] z-[150] w-max max-w-[min(100%,calc(100vw-2.5rem))] pointer-events-none -translate-x-1/2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <span className="inline-flex max-w-full items-center justify-center gap-2 rounded-2xl border border-white/35 bg-cc-accent/45 px-5 py-2.5 text-center text-sm font-semibold text-white shadow-lg backdrop-blur-xl">
              <i className="fas fa-heart shrink-0 text-white" aria-hidden />
              <span className="min-w-0 whitespace-normal break-words">{favToast}</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-2 pb-4">
        <QuizSessionHeader
          title={
            source === 'practice' ? 'Quiz' : source === 'review_mistake' ? 'Wrong answers' : 'Favorites'
          }
          {...(source === 'practice' ? { streakDataTour: 'quiz-streak' } : {})}
          subtitle={
            source === 'practice' ? (
              <p className="line-clamp-2">{PRACTICE_MODE_SUBTITLE}</p>
            ) : source === 'review_mistake' ? (
              <p className="line-clamp-3">{MISTAKE_LIST_RULE}</p>
            ) : isReview ? (
              <p className="line-clamp-2">Saved favorites · fixed order</p>
            ) : undefined
          }
          streak={streak}
          onBack={() => (source === 'practice' ? navigate('/menu') : exitReviewToReviewScreen())}
          backAriaLabel="Go back"
          {...(source === 'practice' ? { backDataTour: 'quiz-back' } : {})}
        />

        <div className="flex items-center gap-2 mb-6" data-product-tour="quiz-progress">
          <div
            className={`flex-1 h-1.5 rounded-full bg-cc-track overflow-hidden ${source === 'practice' && practiceSessionTotal == null ? 'motion-safe:animate-pulse' : ''}`}
          >
            {isReview && reviewIds.length > 0 ? (
              <motion.div
                key={`review-${reviewIds.length}-${reviewIds[0] ?? 0}`}
                className="h-full rounded-full bg-cc-accent"
                initial={{ width: '0%' }}
                animate={{
                  width: `${Math.min(
                    100,
                    Math.round(((reviewIndex + 1) / reviewIds.length) * 100),
                  )}%`,
                }}
                transition={{ type: 'tween', duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            ) : source === 'practice' ? (
              <motion.div
                key={
                  practiceSessionTotal != null && practiceSessionTotal > 0
                    ? `practice-${practiceSessionTotal}`
                    : 'practice-pending'
                }
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    practiceSessionTotal != null && practiceSessionTotal > 0
                      ? `${Math.min(
                          100,
                          Math.round(((practiceProgressIndex + 1) / practiceSessionTotal) * 100),
                        )}%`
                      : '0%',
                }}
                transition={{
                  type: 'tween',
                  duration: practiceSessionTotal != null && practiceSessionTotal > 0 ? 0.5 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ) : (
              <div className="h-full w-full rounded-full bg-cc-fill" />
            )}
          </div>
          <span className="text-xs text-cc-muted whitespace-nowrap shrink-0">
            {progressLabel || (source === 'practice' ? null : '—')}
          </span>
        </div>

        <div className="min-h-[420px] flex items-center justify-center relative">
          {current && (
            <motion.div
              key={current.question_id}
              className="w-full max-w-[340px]"
              initial={false}
              animate={{ scale: 1, opacity: 1 }}
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
          )}
        </div>
      </div>

      <ProductTourOverlay
        open={quizTourOpen && wrongVideo == null && current != null && source === 'practice'}
        steps={QUIZ_TOUR_STEPS}
        bottomInsetPx={112}
        onClose={() => setQuizTourOpen(false)}
        onComplete={() => {
          if (userId != null) markQuizProductTourDone(userId);
          setQuizTourOpen(false);
        }}
      />

      <ProductTourOverlay
        open={wrongVideoTourOpen && wrongVideo != null}
        steps={WRONG_VIDEO_TOUR_STEPS}
        bottomInsetPx={140}
        onClose={() => setWrongVideoTourOpen(false)}
        onComplete={() => {
          if (userId != null) markQuizWrongVideoTourDone(userId);
          setWrongVideoTourOpen(false);
        }}
      />
    </>
  );
}
