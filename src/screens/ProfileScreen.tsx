import { useCallback, useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import { useNavigate } from 'react-router-dom';
import * as api from '../api/services';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<api.StatsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await api.getStatsSummary();
      setSummary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalAnswered = summary?.total_answered ?? 0;
  const totalCorrect = summary?.correct_count ?? 0;
  const totalWrong = summary?.incorrect_count ?? 0;
  const favCount = summary?.favorite_count ?? 0;
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
            <p className="text-white/70 text-sm mt-0.5">Your progress & saved items</p>
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
              <div className="text-white/70 text-xs mt-1">Wrong</div>
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

          <section className="mb-6">
            <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <i className="fas fa-exclamation-circle text-amber-400" /> Wrong answers
            </h2>
            <GlassCard
              className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate('/review')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <i className="fas fa-list text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Review mistaken questions</p>
                  <p className="text-white/60 text-xs">Open the review list from the server</p>
                </div>
              </div>
              <i className="fas fa-chevron-right text-white/50" />
            </GlassCard>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <i className="fas fa-heart text-[#e94560]" /> Favorites
            </h2>
            <GlassCard
              className="p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => navigate('/review')}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#e94560]/20 flex items-center justify-center">
                  <i className="fas fa-bookmark text-[#e94560]" />
                </div>
                <div>
                  <p className="font-medium text-sm">Saved questions</p>
                  <p className="text-white/60 text-xs">{favCount} saved</p>
                </div>
              </div>
              <i className="fas fa-chevron-right text-white/50" />
            </GlassCard>
          </section>
        </>
      )}
    </div>
  );
}
