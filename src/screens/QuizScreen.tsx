import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import SwipeCard from '../components/SwipeCard';
import VideoOverlay from '../components/VideoOverlay';
import { useQuizStore } from '../stores/quizStore';
import { useHideTab } from '../components/AppShell';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { FEEDBACK_DURATION_MS } from '../components/VideoOverlay';

export default function QuizScreen() {
  const isNative = Capacitor.isNativePlatform();
  const navigate = useNavigate();
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const streak = useQuizStore((s) => s.streak);
  const submitAnswer = useQuizStore((s) => s.submitAnswer);
  const nextQuestion = useQuizStore((s) => s.nextQuestion);
  const toggleFavorite = useQuizStore((s) => s.toggleFavorite);
  const favoriteIds = useQuizStore((s) => s.favoriteIds);
  const resetSession = useQuizStore((s) => s.resetSession);
  const answers = useQuizStore((s) => s.answers);

  const question = questions[currentIndex] ?? null;
  const isFavorited = question ? favoriteIds.has(question.id) : false;
  const isDone = currentIndex >= questions.length;
  const progress =
    questions.length > 0 ? Math.round((currentIndex / questions.length) * 100) : 0;

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

  useEffect(() => {
    hideTab(wrongVideo !== null);
  }, [wrongVideo, hideTab]);

  // 题目一出现就开始预加载当前题的错误反馈视频，打开 VideoOverlay 时可从缓存直接播放
  useEffect(() => {
    const src = question?.videoSrc;
    if (!src || isDone) return;
    const el = document.createElement('video');
    el.preload = 'auto';
    el.muted = true;
    el.playsInline = true;
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;';
    el.src = src;
    document.body.appendChild(el);
    return () => {
      try { document.body.removeChild(el); } catch (_) {}
    };
  }, [question?.id, question?.videoSrc, isDone]);

  const handleResult = useCallback(
    (correct: boolean) => {
      if (!question) return;
      submitAnswer(question.id, correct);

      if (correct) {
        setShowCorrectOverlay(true);
        setTimeout(() => {
          setShowCorrectOverlay(false);
          nextQuestion();
          setCardKey((k) => k + 1);
        }, FEEDBACK_DURATION_MS);
      } else {
        setShaking(true);
        if (isNative) {
          // 错误反馈：用 notification Error 型 + 短振动，比 impact 更明显
          Haptics.notification({ type: NotificationType.Error }).catch(() => {});
          setTimeout(() => {
            Haptics.vibrate({ duration: 80 }).catch(() => {});
          }, 50);
        }
        const openVideoAfterShake = () => {
          setShaking(false);
          setWrongVideo({
            src: question.videoSrc,
            label: question.videoLabel,
          });
        };
        setTimeout(openVideoAfterShake, FEEDBACK_DURATION_MS);
      }
    },
    [question, submitAnswer, nextQuestion, isNative],
  );

  const handleVideoContinue = useCallback(() => {
    setWrongVideo(null);
    nextQuestion();
    setCardKey((k) => k + 1);
  }, [nextQuestion]);

  const handleFavorite = useCallback(() => {
    if (!question) return;
    const willBeFav = !favoriteIds.has(question.id);
    toggleFavorite(question.id);
    if (isNative) {
      Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
    }
    clearTimeout(favToastTimer.current);
    setFavToast(willBeFav ? 'Saved to favorites' : 'Removed from favorites');
    favToastTimer.current = setTimeout(() => setFavToast(null), 1500);
  }, [question, favoriteIds, toggleFavorite, isNative]);

  useEffect(() => {
    setCardKey(0);
  }, [questions]);

  if (isDone) {
    const totalCorrect = answers.filter((a) => a.correct).length;
    const totalWrong = answers.filter((a) => !a.correct).length;
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-160px)]">
        <div className="glass p-8 rounded-2xl text-center max-w-[320px]">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-check-double text-3xl text-emerald-400" />
          </div>
          <h2 className="text-xl font-bold">You're done!</h2>
          <p className="text-white/80 text-sm mt-2">
            {totalCorrect} correct, {totalWrong} wrong out of{' '}
            {questions.length} questions.
          </p>
          <button
            onClick={() => {
              resetSession();
              setCardKey((k) => k + 1);
            }}
            className="w-full py-3.5 rounded-xl bg-[#e94560] text-white font-semibold flex items-center justify-center gap-2 mt-6 shadow-lg shadow-[#e94560]/25 active:scale-[0.98] transition-transform"
          >
            <i className="fas fa-redo" /> Play again
          </button>
        </div>
        <div className="flex flex-col gap-3 mt-6 w-full max-w-[320px]">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="w-full py-3 rounded-xl border border-white/25 text-white font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <i className="fas fa-arrow-left" /> Back to menu
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="text-white/70 text-sm"
          >
            View profile
          </button>
        </div>
      </div>
    );
  }

  // ─── Active quiz ───
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
              <i className="fas fa-bookmark" />
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
              onClick={() => navigate('/menu')}
              className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
              aria-label="Back to home"
            >
              <i className="fas fa-arrow-left" />
            </button>
            <h1 className="text-lg font-semibold truncate">Quiz</h1>
          </div>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <i className="fas fa-fire-alt" />
            <span>{streak} streak</span>
          </div>
        </header>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#e94560]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-white/70">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>

        <div className="min-h-[420px] flex items-center justify-center relative">
          <AnimatePresence mode="wait">
            {question && (
              <motion.div
                key={cardKey}
                className="w-full max-w-[340px]"
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              >
                <SwipeCard
                  question={question}
                  onResult={handleResult}
                  onFavorite={handleFavorite}
                  isFavorited={isFavorited}
                  shaking={shaking}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
