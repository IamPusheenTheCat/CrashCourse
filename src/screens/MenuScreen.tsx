import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../stores/quizStore';
import GlassCard from '../components/GlassCard';

const items = [
  {
    key: 'practice',
    icon: 'fa-book-open',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    title: 'Practice mode',
    sub: 'Powered by Ebbinghaus Forgetting Curve · smart question order',
  },
  {
    key: 'review',
    icon: 'fa-redo',
    iconBg: 'bg-[#e94560]/20',
    iconColor: 'text-[#e94560]',
    title: 'Start review',
    sub: 'Wrong answers & favorites · in order',
  },
  {
    key: 'settings',
    icon: 'fa-cog',
    iconBg: 'bg-white/10',
    iconColor: 'text-white/80',
    title: 'Settings',
    sub: 'Sound, notifications',
  },
] as const;

export default function MenuScreen() {
  const navigate = useNavigate();
  const startPractice = useQuizStore((s) => s.startPractice);
  const [practiceError, setPracticeError] = useState<string | null>(null);
  const [practiceLoading, setPracticeLoading] = useState(false);

  const handleTap = async (key: string) => {
    if (key === 'practice') {
      setPracticeError(null);
      const { source, current } = useQuizStore.getState();
      /** 回菜单未清 store：有进行中的练习则直接进入，避免 startPractice 换题 */
      if (source === 'practice' && current != null) {
        navigate('/quiz');
        return;
      }
      setPracticeLoading(true);
      try {
        await startPractice();
        const err = useQuizStore.getState().error;
        if (err) {
          setPracticeError(err);
          return;
        }
        navigate('/quiz');
      } finally {
        setPracticeLoading(false);
      }
    } else if (key === 'review') {
      navigate('/review');
    } else if (key === 'settings') {
      navigate('/settings');
    }
  };

  return (
    <div className="pt-8 pb-10">
      <div className="text-center mb-8">
        <div className="glass w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <i className="fas fa-car-crash text-2xl text-[#e94560]" />
        </div>
        <h1 className="text-2xl font-bold">CrashCourse</h1>
        <p className="text-white/70 text-sm mt-1">Choose a mode</p>
      </div>

      {practiceError ? (
        <p className="text-amber-400 text-xs text-center mb-3 px-2" role="alert">
          {practiceError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <GlassCard
            key={item.key}
            className="p-4 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-transform"
            onClick={() => void handleTap(item.key)}
          >
            <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center`}>
              {item.key === 'practice' && practiceLoading ? (
                <i className="fas fa-circle-notch fa-spin text-emerald-400" />
              ) : (
                <i className={`fas ${item.icon} ${item.iconColor}`} />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-white/60 text-xs">{item.sub}</p>
            </div>
            <i className="fas fa-chevron-right text-white/50" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
