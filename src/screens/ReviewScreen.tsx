import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ui/ScreenHeader';
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
    <div className="cc-page-inner">
      <ScreenHeader
        title="Review"
        subtitle="Wrong answers & favorites"
        onBack={() => navigate('/menu')}
        backAriaLabel="Go back"
      />

      {listError ? (
        <p className="text-amber-400 text-xs mb-3" role="alert">
          {listError}
        </p>
      ) : null}

      <GlassCard className="p-4 mb-4">
        <p className="text-cc-muted text-sm leading-relaxed">
          Tap wrong answers or favorites below to start a session
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
