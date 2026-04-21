import { useNavigate } from 'react-router-dom';
import { goBackOrMenu } from '../navigation/goBackOrMenu';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const userEmail = useAuthStore((s) => s.userEmail);
  const soundEffects = useSettingsStore((s) => s.soundEffects);
  const setSoundEffects = useSettingsStore((s) => s.setSoundEffects);
  const videoAutoplayOnWrong = useSettingsStore((s) => s.videoAutoplayOnWrong);
  const setVideoAutoplayOnWrong = useSettingsStore((s) => s.setVideoAutoplayOnWrong);
  const dailyReminder = useSettingsStore((s) => s.dailyReminder);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);

  return (
    <div className="cc-page-inner">
      <ScreenHeader
        title="Settings"
        subtitle="Sounds, videos & reminders"
        userEmail={userEmail}
        onBack={() => goBackOrMenu(navigate)}
        backAriaLabel="Go back"
      />

      <GlassCard className="rounded-2xl overflow-hidden divide-y divide-cc-border">
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-cc-fg">Sound effects</span>
          <input
            type="checkbox"
            checked={soundEffects}
            onChange={(e) => setSoundEffects(e.target.checked)}
            className="rounded bg-cc-fill border-cc-border text-cc-accent focus:outline-none focus:ring-2 focus:ring-cc-accent/60"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-cc-fg">Warning video after wrong answer</span>
          <input
            type="checkbox"
            checked={videoAutoplayOnWrong}
            onChange={(e) => setVideoAutoplayOnWrong(e.target.checked)}
            className="rounded bg-cc-fill border-cc-border text-cc-accent focus:outline-none focus:ring-2 focus:ring-cc-accent/60"
          />
        </label>
        <label className="flex items-center justify-between p-4 cursor-pointer">
          <span className="text-cc-fg">Daily reminder</span>
          <input
            type="checkbox"
            checked={dailyReminder}
            onChange={(e) => setDailyReminder(e.target.checked)}
            className="rounded bg-cc-fill border-cc-border text-cc-accent focus:outline-none focus:ring-2 focus:ring-cc-accent/60"
          />
        </label>
      </GlassCard>

      <div className="mt-6">
        <PrimaryButton
          variant="outline"
          className="py-4"
          icon={<i className="fas fa-sign-out-alt" aria-hidden />}
          onClick={() => {
            void (async () => {
              await logout();
              navigate('/tutorial', { replace: true });
            })();
          }}
        >
          Log out
        </PrimaryButton>
      </div>
    </div>
  );
}
