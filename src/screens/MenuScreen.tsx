import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';
import { getAvailableQuestionsCount, getNextQuestionPayload } from '../api/services';
import GlassCard from '../components/GlassCard';
import {
  PRACTICE_MENU_NOTHING_TO_PRACTICE,
  PRACTICE_MODE_SUBTITLE,
  isPracticePoolExhaustedMessage,
} from '../constants/practiceModeCopy';
import EbbinghausCurveBadge from '../components/EbbinghausCurveBadge';
import PracticeDueStat from '../components/PracticeDueStat';
import ProductTourOverlay, { type ProductTourStep } from '../components/ProductTourOverlay';
import { markMenuProductTourDone, readMenuProductTourDone } from '../constants/productTourStorage';

const items = [
  {
    key: 'practice',
    icon: 'fa-book-open',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'Practice mode',
    sub: PRACTICE_MODE_SUBTITLE,
  },
  {
    key: 'review',
    icon: 'fa-redo',
    iconBg: 'bg-cc-accent/20',
    iconColor: 'text-cc-accent',
    title: 'Start review',
    sub: 'Wrong answers & favorites · in order',
  },
  {
    key: 'profile',
    icon: 'fa-user-circle',
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-300',
    title: 'Profile',
    sub: 'Stats, progress & Ebbinghaus curve',
  },
  {
    key: 'settings',
    icon: 'fa-cog',
    iconBg: 'bg-white/10',
    iconColor: 'text-cc-muted',
    title: 'Settings',
    sub: 'Sounds, videos & reminders',
  },
] as const;

const MENU_TOUR_STEPS: ProductTourStep[] = [
  {
    selector: '[data-product-tour="menu-practice"]',
    title: 'Practice mode',
    body: 'Jump in here for the next good questions, served in a smart order inspired by the forgetting curve. The ring tells you how many are ready now — or gently counts down when you are caught up.',
    inflate: 10,
  },
  {
    selector: '[data-product-tour="menu-review"]',
    title: 'Start review',
    body: 'Review what you saved or missed: mistakes and favorites stay in the same list order every time.',
    inflate: 10,
  },
  {
    selector: '[data-product-tour="menu-profile"]',
    title: 'Profile',
    body: 'Your home for the big picture: practice volume, right vs wrong, and how far you have moved the needle. You can also hop into mistake or favorite review from here.',
    inflate: 10,
  },
];

type PracticeFeedback = { variant: 'neutral' | 'error'; message: string };

export default function MenuScreen() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.userId);
  const userEmail = useAuthStore((s) => s.userEmail);
  const startPractice = useQuizStore((s) => s.startPractice);
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [availableCountLoading, setAvailableCountLoading] = useState(true);
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(null);
  const [menuTourOpen, setMenuTourOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || userId == null) return;
    if (readMenuProductTourDone(userId)) return;
    const tid = window.setTimeout(() => setMenuTourOpen(true), 380);
    return () => window.clearTimeout(tid);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    if (practiceFeedback != null) setMenuTourOpen(false);
  }, [practiceFeedback]);

  useEffect(() => {
    if (!isAuthenticated) {
      setAvailableCount(null);
      setAvailableCountLoading(false);
      setNextReviewAt(null);
      return;
    }
    let cancelled = false;
    setAvailableCountLoading(true);
    void (async () => {
      try {
        const n = await getAvailableQuestionsCount();
        if (cancelled) return;
        if (n !== 0) {
          setAvailableCount(n);
          setNextReviewAt(null);
          setAvailableCountLoading(false);
          return;
        }
        /** 0 due：在 peek 完 next_review_time 前保持 loading，避免出现「0 DUE」再变计时环的闪一下 */
        setAvailableCount(0);
        const d = await getNextQuestionPayload();
        if (cancelled) return;
        if (d.has_question) {
          setNextReviewAt(null);
          const n2 = await getAvailableQuestionsCount();
          if (!cancelled) setAvailableCount(n2);
        } else {
          const t = d.next_review_time;
          if (typeof t === 'string' && t.length > 0) {
            setNextReviewAt(t);
          } else {
            setNextReviewAt(null);
          }
        }
      } catch {
        if (!cancelled) {
          setAvailableCount(null);
          setNextReviewAt(null);
        }
      } finally {
        if (!cancelled) setAvailableCountLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleCooldownElapsed = useCallback(() => {
    void (async () => {
      try {
        const n = await getAvailableQuestionsCount();
        if (n !== 0) {
          setAvailableCount(n);
          setNextReviewAt(null);
          return;
        }
        setAvailableCountLoading(true);
        setAvailableCount(0);
        const d = await getNextQuestionPayload();
        if (d.has_question) {
          setNextReviewAt(null);
          setAvailableCount(await getAvailableQuestionsCount());
          return;
        }
        const t = d.next_review_time;
        if (typeof t === 'string' && t.length > 0) {
          setNextReviewAt(t);
        } else {
          setNextReviewAt(null);
        }
      } catch {
        setAvailableCount(null);
        setNextReviewAt(null);
      } finally {
        setAvailableCountLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!practiceFeedback) return;
    const ms = practiceFeedback.variant === 'neutral' ? 2400 : 4000;
    const id = window.setTimeout(() => setPracticeFeedback(null), ms);
    return () => window.clearTimeout(id);
  }, [practiceFeedback]);

  const handleTap = async (key: string) => {
    if (key === 'practice') {
      setPracticeFeedback(null);
      const { source, current } = useQuizStore.getState();
      /** 回菜单未清 store：有进行中的练习则直接进入，避免 startPractice 换题 */
      if (source === 'practice' && current != null) {
        navigate('/quiz');
        return;
      }
      if (!availableCountLoading && availableCount === 0) {
        setPracticeFeedback({ variant: 'neutral', message: PRACTICE_MENU_NOTHING_TO_PRACTICE });
        return;
      }
      setPracticeLoading(true);
      try {
        await startPractice();
        const err = useQuizStore.getState().error;
        if (err) {
          if (isPracticePoolExhaustedMessage(err)) {
            setPracticeFeedback({ variant: 'neutral', message: PRACTICE_MENU_NOTHING_TO_PRACTICE });
          } else {
            setPracticeFeedback({ variant: 'error', message: err });
          }
          return;
        }
        navigate('/quiz');
      } finally {
        setPracticeLoading(false);
      }
    } else if (key === 'review') {
      navigate('/review');
    } else if (key === 'profile') {
      navigate('/profile', { state: { profileFromMenu: true } });
    } else if (key === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <div className="cc-page-home">
      <div className="text-center mb-8">
        <div className="glass w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-car-crash text-2xl text-cc-accent" />
        </div>
        <h1 className="text-2xl font-bold">CrashCourse</h1>
        {userEmail ? (
          <div className="mt-3 flex justify-center px-2">
            <span
              className="inline-flex max-w-full items-center gap-1.5 truncate rounded-full border border-cc-border bg-cc-fill px-3 py-1 text-[11px] font-medium text-cc-muted"
              title={userEmail}
            >
              <i className="fas fa-user text-[10px] text-cc-muted shrink-0" aria-hidden />
              <span className="truncate">{userEmail}</span>
            </span>
          </div>
        ) : null}
      </div>

      {practiceFeedback ? (
        <div
          role={practiceFeedback.variant === 'error' ? 'alert' : 'status'}
          className={`mx-auto mb-3 max-w-md rounded-xl border px-3 py-2.5 text-center text-xs leading-relaxed ${
            practiceFeedback.variant === 'error'
              ? 'border-amber-400/30 bg-amber-500/10 text-amber-100/95'
              : 'border-cc-border bg-cc-fill text-cc-muted'
          }`}
        >
          {practiceFeedback.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <GlassCard
            key={item.key}
            className="py-3 px-4 flex items-center gap-2.5 sm:gap-4 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => void handleTap(item.key)}
            {...(item.key === 'practice'
              ? { 'data-product-tour': 'menu-practice' }
              : item.key === 'review'
                ? { 'data-product-tour': 'menu-review' }
                : item.key === 'profile'
                  ? { 'data-product-tour': 'menu-profile' }
                  : {})}
          >
            <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center`}>
              {item.key === 'practice' && practiceLoading ? (
                <i className="fas fa-circle-notch fa-spin text-emerald-400" />
              ) : (
                <i className={`fas ${item.icon} ${item.iconColor}`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {item.key === 'practice' ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <p className="font-semibold text-white leading-tight">{item.title}</p>
                    <EbbinghausCurveBadge compact />
                  </div>
                  <p className="text-cc-muted text-xs leading-tight">{item.sub}</p>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="text-cc-muted text-xs mt-0.5 leading-tight">{item.sub}</p>
                </>
              )}
            </div>
            {item.key === 'practice' && (availableCountLoading || availableCount !== null) ? (
              <PracticeDueStat
                count={availableCount ?? 0}
                loading={availableCountLoading}
                nextReviewIso={availableCount === 0 ? nextReviewAt : null}
                onCooldownElapsed={handleCooldownElapsed}
              />
            ) : null}
          </GlassCard>
        ))}
      </div>

      <ProductTourOverlay
        open={menuTourOpen && practiceFeedback == null}
        steps={MENU_TOUR_STEPS}
        bottomInsetPx={24}
        onClose={() => setMenuTourOpen(false)}
        onComplete={() => {
          if (userId != null) markMenuProductTourDone(userId);
          setMenuTourOpen(false);
        }}
      />
    </div>
  );
}
