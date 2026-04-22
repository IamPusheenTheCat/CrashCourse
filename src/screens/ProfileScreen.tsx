import { useCallback, useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import ForgettingCurveIllustration from '../components/ForgettingCurveIllustration';
import ReviewModeRow from '../components/ReviewModeRow';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/services';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';

const skBar = 'rounded-md bg-cc-fill motion-safe:animate-pulse';

/** 与加载完成后的版式对齐，避免整页从「单转圈」切成大块内容时的跳动 */
function ProfileLoadingSkeleton() {
  return (
    <div aria-busy aria-label="Loading profile">
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <GlassCard key={i} className="p-4 text-center">
            <div className={`mx-auto h-8 w-14 ${skBar}`} />
            <div className={`mx-auto mt-3 h-3 w-20 max-w-full ${skBar}`} />
          </GlassCard>
        ))}
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
          <i className="fas fa-chart-line text-cc-muted" aria-hidden />
          Learning progress
        </h2>
        <GlassCard className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className={`inline-block h-4 w-16 ${skBar}`} />
            <span className={`inline-block h-4 w-10 ${skBar}`} />
          </div>
          <div className={`h-2 w-full rounded-full ${skBar}`} />
        </GlassCard>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
          <i className="fas fa-list-ul text-cc-muted" aria-hidden />
          Your lists
        </h2>
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-cc-border bg-cc-fill/35 p-4 motion-safe:animate-pulse"
            >
              <div className="h-11 w-11 shrink-0 rounded-xl bg-white/12" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-40 max-w-full rounded-md bg-white/14" />
                <div className="h-3 w-full max-w-[14rem] rounded-md bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
          <i className="fas fa-chart-area text-emerald-400/90" aria-hidden />
          Ebbinghaus Forgetting Curve
        </h2>
        <GlassCard className="p-4">
          <div className={`h-44 w-full rounded-xl ${skBar}`} />
        </GlassCard>
      </section>
    </div>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const userEmail = useAuthStore((s) => s.userEmail);
  const startReview = useQuizStore((s) => s.startReview);
  const [summary, setSummary] = useState<api.StatsSummary | null>(null);
  const [mistakeBookTotal, setMistakeBookTotal] = useState<number | null>(null);
  const [favoriteListTotal, setFavoriteListTotal] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLaunching, setReviewLaunching] = useState<'mistake' | 'favorite' | null>(null);
  const [reviewLaunchError, setReviewLaunchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [stats, mistakes, favorites] = await Promise.all([
        api.getStatsSummary(),
        api.getMistakeList(1, 1),
        api.getFavoriteList(1, 1),
      ]);
      setSummary(stats);
      setMistakeBookTotal(mistakes.total);
      setFavoriteListTotal(favorites.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const startReviewFromProfile = async (mode: 'mistake' | 'favorite') => {
    if (reviewLaunching) return;
    if (mode === 'mistake' && mistakeBookTotal === 0) return;
    if (mode === 'favorite' && favoriteListTotal === 0) return;
    setReviewLaunchError(null);
    setReviewLaunching(mode);
    try {
      await startReview(mode);
      const err = useQuizStore.getState().error;
      if (err) {
        setReviewLaunchError(err);
        return;
      }
      navigate('/quiz');
    } finally {
      setReviewLaunching(null);
    }
  };

  const totalAnswered = summary?.total_answered ?? 0;
  const totalCorrect = summary?.correct_count ?? 0;
  const totalWrong = summary?.incorrect_count ?? 0;
  const progressFrac = summary?.learning_progress ?? 0;
  const pct =
    progressFrac <= 1 && progressFrac >= 0
      ? Math.round(progressFrac * 100)
      : Math.round(progressFrac);

  return (
    <div className="cc-page-inner">
      <ScreenHeader
        title="Profile"
        subtitle="Stats, progress & Ebbinghaus curve"
        userEmail={userEmail}
        onBack={() => navigate('/menu')}
        backAriaLabel="Back to menu"
      />

      {error ? (
        <p className="text-amber-400 text-xs mb-3" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <ProfileLoadingSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-cc-accent">{totalAnswered}</div>
              <div className="text-cc-muted text-xs mt-1">Answered</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{totalCorrect}</div>
              <div className="text-cc-muted text-xs mt-1">Correct</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{totalWrong}</div>
              <div className="text-cc-muted text-xs mt-1">Incorrect</div>
            </GlassCard>
          </div>

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
              <i className="fas fa-chart-line" aria-hidden /> Learning progress
            </h2>
            <GlassCard className="p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-cc-muted">Overall</span>
                <span className="font-medium text-cc-fg">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-cc-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-cc-accent transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>
            </GlassCard>
          </section>

          {reviewLaunchError ? (
            <p className="text-amber-400 text-xs mb-3" role="alert">
              {reviewLaunchError}
            </p>
          ) : null}

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
              <i className="fas fa-list-ul text-cc-muted" aria-hidden />
              Your lists
            </h2>
            <div
              className={`flex flex-col gap-3 ${reviewLaunching ? 'pointer-events-none opacity-70' : ''}`}
            >
              <ReviewModeRow
                mode="wrong"
                count={mistakeBookTotal}
                busy={reviewLaunching === 'mistake'}
                onClick={() => void startReviewFromProfile('mistake')}
              />
              <ReviewModeRow
                mode="favorite"
                count={favoriteListTotal}
                busy={reviewLaunching === 'favorite'}
                onClick={() => void startReviewFromProfile('favorite')}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-cc-fg mb-3 flex items-center gap-2">
              <i className="fas fa-chart-area text-emerald-400/90" aria-hidden />
              Ebbinghaus Forgetting Curve
            </h2>
            <GlassCard className="p-4">
              <ForgettingCurveIllustration />
            </GlassCard>
          </section>
        </>
      )}
    </div>
  );
}
