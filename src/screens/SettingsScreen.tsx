import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import { useAuthStore } from '../stores/authStore';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="pt-4 pb-10">
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
            defaultChecked
            className="rounded bg-white/20 border-white/30 text-[#e94560] focus:ring-[#e94560]"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-white/90">Video autoplay on wrong</span>
          <input
            type="checkbox"
            defaultChecked
            className="rounded bg-white/20 border-white/30 text-[#e94560] focus:ring-[#e94560]"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-white/90">Daily reminder</span>
          <input
            type="checkbox"
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
