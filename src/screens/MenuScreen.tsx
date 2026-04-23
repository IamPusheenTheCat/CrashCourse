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
import { FULL_BANK_MENU_SUBTITLE, FULL_BANK_MODE_TITLE } from '../constants/reviewCopy';
import EbbinghausCurveBadge from '../components/EbbinghausCurveBadge';
import PracticeDueStat, {
  MENU_ROW_STAT_MENU_TILE_CLASS,
  MENU_STAT_TILE_SECOND_LINE_CLASS,
} from '../components/PracticeDueStat';
import ProductTourOverlay, { type ProductTourStep } from '../components/ProductTourOverlay';
import { markMenuProductTourDone, readMenuProductTourDone } from '../constants/productTourStorage';
import { PROFILE_SCREEN_SUBTITLE } from '../constants/profileCopy';

const FULLBANK_RANDOM_ORDER_KEY = 'crashcourse-fullbank-random-order';

const items = [
  {
    key: 'practice',
    icon: 'fa-wave-square',
    iconBg: 'border border-emerald-400/25 bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'Spaced practice',
    sub: PRACTICE_MODE_SUBTITLE,
  },
  {
    key: 'review',
    icon: 'fa-database',
    iconBg: 'border border-indigo-400/25 bg-indigo-500/30',
    iconColor: 'text-indigo-200',
    title: FULL_BANK_MODE_TITLE,
    sub: FULL_BANK_MENU_SUBTITLE,
  },
  {
    key: 'profile',
    icon: 'fa-user-circle',
    iconBg: 'border border-sky-400/25 bg-sky-500/20',
    iconColor: 'text-sky-300',
    title: 'Profile',
    sub: PROFILE_SCREEN_SUBTITLE,
  },
  {
    key: 'settings',
    icon: 'fa-cog',
    iconBg: 'border border-white/20 bg-white/12',
    iconColor: 'text-white/70',
    title: 'Settings',
    sub: 'Sound, video & reminders',
  },
] as const;

const MENU_TOUR_STEPS: ProductTourStep[] = [
  {
    selector: '[data-product-tour="menu-practice"]',
    title: 'Spaced practice',
    body: 'Questions come back when it is time to review—that sticks better than cramming. On the right: how many are ready now. When that reads zero, you may see a countdown until the next question is ready',
    inflate: 10,
  },
  {
    selector: '[data-product-tour="menu-review"]',
    title: FULL_BANK_MODE_TITLE,
    body: 'One full pass through the bank in this session—each question shows once. Tap the order control on the far right of this row to flip between fixed list order and shuffled order before you start',
    inflate: 10,
  },
  {
    selector: '[data-product-tour="menu-profile"]',
    title: 'Profile',
    body: 'Your dashboard: how much you have practiced, right and wrong counts, learning progress, wrong-answer review, and saved questions',
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
  const startReviewAllQuestions = useQuizStore((s) => s.startReviewAllQuestions);
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [reviewMenuLoading, setReviewMenuLoading] = useState(false);
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [availableCountLoading, setAvailableCountLoading] = useState(true);
  const [nextReviewAt, setNextReviewAt] = useState<string | null>(null);
  const [menuTourOpen, setMenuTourOpen] = useState(false);
  const [fullBankRandomOrder, setFullBankRandomOrder] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(FULLBANK_RANDOM_ORDER_KEY) === '1') {
        setFullBankRandomOrder(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

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
      setPracticeFeedback(null);
      const { source, current } = useQuizStore.getState();
      if (source === 'review_all' && current != null) {
        navigate('/quiz');
        return;
      }
      setReviewMenuLoading(true);
      try {
        await startReviewAllQuestions({ randomOrder: fullBankRandomOrder });
        const err = useQuizStore.getState().error;
        if (err) {
          setPracticeFeedback({ variant: 'error', message: err });
          return;
        }
        navigate('/quiz');
      } finally {
        setReviewMenuLoading(false);
      }
    } else if (key === 'profile') {
      navigate('/profile', { state: { profileFromMenu: true } });
    } else if (key === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <div className="cc-page-home">
      <div className="text-center mb-8">
        <div className="glass w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-car-crash text-4xl text-cc-accent" aria-hidden />
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
            <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0`}>
              {item.key === 'practice' && practiceLoading ? (
                <i className="fas fa-circle-notch fa-spin text-emerald-400" />
              ) : item.key === 'review' && reviewMenuLoading ? (
                <i className="fas fa-circle-notch fa-spin text-indigo-200" />
              ) : (
                <i className={`fas ${item.icon} ${item.iconColor}`} />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {item.key === 'practice' ? (
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <p className="text-[15px] font-semibold leading-snug text-white">{item.title}</p>
                  <EbbinghausCurveBadge compact className="shrink-0" />
                </div>
              ) : (
                <p className="text-[15px] font-semibold leading-snug text-white">{item.title}</p>
              )}
              <p className="text-xs leading-snug text-cc-muted">{item.sub}</p>
            </div>
            {item.key === 'practice' && (availableCountLoading || availableCount !== null) ? (
              <PracticeDueStat
                count={availableCount ?? 0}
                loading={availableCountLoading}
                nextReviewIso={availableCount === 0 ? nextReviewAt : null}
                onCooldownElapsed={handleCooldownElapsed}
              />
            ) : item.key === 'review' ? (
              <button
                type="button"
                aria-pressed={fullBankRandomOrder}
                aria-label={
                  fullBankRandomOrder
                    ? 'Shuffled order, tap for list order'
                    : 'List order, tap for shuffled order'
                }
                title={
                  fullBankRandomOrder
                    ? 'Questions in random order this time (tap for list order)'
                    : 'Questions in list order (tap for shuffled order)'
                }
                className={[
                  MENU_ROW_STAT_MENU_TILE_CLASS,
                  'touch-manipulation gap-px transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cc-surface',
                  fullBankRandomOrder
                    ? 'border-indigo-300/45 bg-gradient-to-b from-indigo-400/35 to-indigo-600/25'
                    : 'border-cc-border bg-cc-fill',
                ].join(' ')}
                onClick={(e) => {
                  e.stopPropagation();
                  const next = !fullBankRandomOrder;
                  setFullBankRandomOrder(next);
                  try {
                    sessionStorage.setItem(FULLBANK_RANDOM_ORDER_KEY, next ? '1' : '0');
                  } catch {
                    /* ignore */
                  }
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <i
                  className={`fas text-[15px] leading-none ${
                    fullBankRandomOrder ? 'text-white' : 'text-white/45'
                  } ${fullBankRandomOrder ? 'fa-random' : 'fa-list-ol'}`}
                  aria-hidden
                />
                <span
                  className={`${MENU_STAT_TILE_SECOND_LINE_CLASS} ${
                    fullBankRandomOrder ? 'text-white/80' : 'text-cc-muted'
                  }`}
                >
                  {fullBankRandomOrder ? 'rnd' : 'list'}
                </span>
              </button>
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
