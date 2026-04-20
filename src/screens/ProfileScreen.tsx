import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';
import { useNavigate } from 'react-router-dom';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const answers = useQuizStore((s) => s.answers);
  const wrongCount = useQuizStore((s) => s.wrongIds.size);
  const favCount = useQuizStore((s) => s.favoriteIds.size);

  const totalAnswered = answers.length;
  const totalCorrect = answers.filter((a) => a.correct).length;
  const totalWrong = answers.filter((a) => !a.correct).length;
  const pct = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

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

      {/* Stats */}
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

      {/* Progress */}
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
              style={{ width: `${pct}%` }}
            />
          </div>
        </GlassCard>
      </section>

      {/* Wrong answers */}
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
              <p className="text-white/60 text-xs">{wrongCount} questions to review</p>
            </div>
          </div>
          <i className="fas fa-chevron-right text-white/50" />
        </GlassCard>
      </section>

      {/* Favorites */}
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
    </div>
  );
}
