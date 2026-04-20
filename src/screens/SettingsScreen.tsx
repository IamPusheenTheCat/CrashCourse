import { useNavigate } from 'react-router-dom';
import { goBackOrMenu } from '../navigation/goBackOrMenu';
import GlassCard from '../components/GlassCard';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const soundEffects = useSettingsStore((s) => s.soundEffects);
  const setSoundEffects = useSettingsStore((s) => s.setSoundEffects);
  const videoAutoplayOnWrong = useSettingsStore((s) => s.videoAutoplayOnWrong);
  const setVideoAutoplayOnWrong = useSettingsStore((s) => s.setVideoAutoplayOnWrong);
  const dailyReminder = useSettingsStore((s) => s.dailyReminder);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);

  return (
    <div className="pt-4 pb-10">
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => goBackOrMenu(navigate)}
            className="shrink-0 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/90 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <i className="fas fa-arrow-left" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Settings</h1>
            <p className="text-white/70 text-sm mt-0.5">App preferences</p>
          </div>
        </div>
      </header>

      <GlassCard className="rounded-2xl overflow-hidden divide-y divide-white/10">
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-white/90">Sound effects</span>
          <input
            type="checkbox"
            checked={soundEffects}
            onChange={(e) => setSoundEffects(e.target.checked)}
            className="rounded bg-white/20 border-white/30 text-[#e94560] focus:ring-[#e94560]"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-white/90">Warning video after wrong answer</span>
          <input
            type="checkbox"
            checked={videoAutoplayOnWrong}
            onChange={(e) => setVideoAutoplayOnWrong(e.target.checked)}
            className="rounded bg-white/20 border-white/30 text-[#e94560] focus:ring-[#e94560]"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-white/90">Daily reminder</span>
          <input
            type="checkbox"
            checked={dailyReminder}
            onChange={(e) => setDailyReminder(e.target.checked)}
            className="rounded bg-white/20 border-white/30 text-[#e94560] focus:ring-[#e94560]"
          />
        </label>
      </GlassCard>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => {
            void (async () => {
              await logout();
              navigate('/login', { replace: true });
            })();
          }}
          className="w-full py-4 rounded-xl border border-white/20 text-white/90 font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <i className="fas fa-sign-out-alt" /> Log out
        </button>
      </div>
    </div>
  );
}
