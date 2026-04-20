import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';
import * as api from '../api/services';

export default function ReviewScreen() {
  const navigate = useNavigate();
  const startReview = useQuizStore((s) => s.startReview);
  const [wrongCount, setWrongCount] = useState<number | null>(null);
  const [favCount, setFavCount] = useState<number | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [launching, setLaunching] = useState<'wrong' | 'favorite' | null>(null);

  const loadCounts = useCallback(async () => {
    setListError(null);
    try {
      const [mistakes, favorites] = await Promise.all([
        api.getMistakeList(1, 200),
        api.getFavoriteList(1, 200),
      ]);
      setWrongCount(mistakes.total);
      setFavCount(favorites.total);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Failed to load lists');
    }
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  const launch = async (mode: 'wrong' | 'favorite') => {
    setLaunching(mode);
    try {
      await startReview(mode === 'wrong' ? 'mistake' : 'favorite');
      const err = useQuizStore.getState().error;
      if (err) {
        setListError(err);
        return;
      }
      navigate('/quiz');
    } finally {
      setLaunching(null);
    }
  };

  return (
    <div className="pt-4 pb-10">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={() => navigate('/menu')}
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
            aria-label="Back to menu"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Review</h1>
            <p className="text-white/70 text-sm mt-0.5">Wrong answers & saved for later</p>
          </div>
        </div>
      </header>

      {listError ? (
        <p className="text-amber-400 text-xs mb-3" role="alert">
          {listError}
        </p>
      ) : null}

      <GlassCard className="p-4 mb-4">
        <p className="text-white/80 text-sm">
          Lists come from the server. Open a session to walk questions in order; each card loads full detail from the API.
        </p>
      </GlassCard>

      <div className="flex flex-col gap-3 mb-6">
        <GlassCard
          className="p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => void launch('wrong')}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            {launching === 'wrong' ? (
              <i className="fas fa-circle-notch fa-spin text-amber-400" />
            ) : (
              <i className="fas fa-exclamation-circle text-amber-400" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              Wrong answers ({wrongCount === null ? '…' : wrongCount})
            </p>
            <p className="text-white/60 text-xs">Practice these again</p>
          </div>
          <i className="fas fa-chevron-right text-white/50" />
        </GlassCard>

        <GlassCard
          className="p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => void launch('favorite')}
        >
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/20 flex items-center justify-center">
            {launching === 'favorite' ? (
              <i className="fas fa-circle-notch fa-spin text-[#e94560]" />
            ) : (
              <i className="fas fa-heart text-[#e94560]" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              Favorites ({favCount === null ? '…' : favCount})
            </p>
            <p className="text-white/60 text-xs">Saved for later</p>
          </div>
          <i className="fas fa-chevron-right text-white/50" />
        </GlassCard>
      </div>

      <button
        type="button"
        onClick={() => void launch('wrong')}
        disabled={launching !== null}
        className="w-full py-4 rounded-xl bg-[#e94560] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#e94560]/25 active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {launching === 'wrong' ? <i className="fas fa-circle-notch fa-spin" /> : <i className="fas fa-play" />}
        Start review session
      </button>
    </div>
  );
}
