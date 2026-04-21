import { useCallback, useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import ForgettingCurveIllustration from '../components/ForgettingCurveIllustration';
import ReviewModeRow from '../components/ReviewModeRow';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/services';
import { useQuizStore } from '../stores/quizStore';
import { useAuthStore } from '../stores/authStore';

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
        <div className="flex justify-center py-12">
          <i className="fas fa-circle-notch fa-spin text-2xl text-cc-accent" />
        </div>
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
