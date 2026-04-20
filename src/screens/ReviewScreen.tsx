import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { goBackOrMenu } from '../navigation/goBackOrMenu';
import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';
import ReviewModeRow from '../components/ReviewModeRow';
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
        api.getMistakeList(1, 1),
        api.getFavoriteList(1, 1),
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
    if (mode === 'wrong' && wrongCount === 0) return;
    if (mode === 'favorite' && favCount === 0) return;
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
            onClick={() => goBackOrMenu(navigate)}
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Review</h1>
            <p className="text-white/70 text-sm mt-0.5">Wrong answers & favorites</p>
          </div>
        </div>
      </header>

      {listError ? (
        <p className="text-amber-400 text-xs mb-3" role="alert">
          {listError}
        </p>
      ) : null}

      <GlassCard className="p-4 mb-4">
        <p className="text-white/80 text-sm leading-relaxed">
          Tap wrong answers or favorites below to start a session.
        </p>
      </GlassCard>

      <div className="flex flex-col gap-3 mb-6">
        <ReviewModeRow
          mode="wrong"
          count={wrongCount}
          busy={launching === 'wrong'}
          onClick={() => void launch('wrong')}
        />
        <ReviewModeRow
          mode="favorite"
          count={favCount}
          busy={launching === 'favorite'}
          onClick={() => void launch('favorite')}
        />
      </div>
    </div>
  );
}
