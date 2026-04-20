import { useCallback, useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ReviewModeRow from '../components/ReviewModeRow';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/services';
import { useQuizStore } from '../stores/quizStore';

export default function ProfileScreen() {
  const navigate = useNavigate();
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
    <div className="pt-4 pb-4">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
            aria-label="Back to menu"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Profile</h1>
            <p className="text-white/70 text-sm mt-0.5">Your progress & favorites</p>
          </div>
        </div>
      </header>

      {error ? (
        <p className="text-amber-400 text-xs mb-3" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <i className="fas fa-circle-notch fa-spin text-2xl text-[#e94560]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-[#e94560]">{totalAnswered}</div>
              <div className="text-white/70 text-xs mt-1">Answered</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{totalCorrect}</div>
              <div className="text-white/70 text-xs mt-1">Correct</div>
            </GlassCard>
            <GlassCard className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{totalWrong}</div>
              <div className="text-white/70 text-xs mt-1">Incorrect</div>
            </GlassCard>
          </div>

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <i className="fas fa-chart-line" /> Learning progress
            </h2>
            <GlassCard className="p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/80">Overall</span>
                <span className="font-medium">{pct}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#e94560] transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>
            </GlassCard>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <i className="fas fa-redo text-white/80" /> Review
            </h2>
            {reviewLaunchError ? (
              <p className="text-amber-400 text-xs mb-2" role="alert">
                {reviewLaunchError}
              </p>
            ) : null}
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
        </>
      )}
    </div>
  );
}
