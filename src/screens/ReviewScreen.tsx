import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';

export default function ReviewScreen() {
  const navigate = useNavigate();
  const wrongCount = useQuizStore((s) => s.wrongIds.size);
  const favCount = useQuizStore((s) => s.favoriteIds.size);
  const startReview = useQuizStore((s) => s.startReview);

  const launch = (mode: 'wrong' | 'favorite') => {
    startReview(mode);
    navigate('/quiz');
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

      <GlassCard className="p-4 mb-4">
        <p className="text-white/80 text-sm">
          Review mode uses your saved "unsure" cards and past wrong answers so
          you see them more often.
        </p>
      </GlassCard>

      <div className="flex flex-col gap-3 mb-6">
        <GlassCard
          className="p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => launch('wrong')}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <i className="fas fa-exclamation-circle text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Wrong answers ({wrongCount})</p>
            <p className="text-white/60 text-xs">Practice these again</p>
          </div>
          <i className="fas fa-chevron-right text-white/50" />
        </GlassCard>

        <GlassCard
          className="p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() => launch('favorite')}
        >
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/20 flex items-center justify-center">
            <i className="fas fa-heart text-[#e94560]" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Favorites ({favCount})</p>
            <p className="text-white/60 text-xs">Saved for later</p>
          </div>
          <i className="fas fa-chevron-right text-white/50" />
        </GlassCard>
      </div>

      <button
        onClick={() => launch('wrong')}
        className="w-full py-4 rounded-xl bg-[#e94560] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-[#e94560]/25 active:scale-[0.98] transition-transform"
      >
        <i className="fas fa-play" /> Start review session
      </button>

    </div>
  );
}
