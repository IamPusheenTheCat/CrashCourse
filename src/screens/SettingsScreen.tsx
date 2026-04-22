import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { goBackOrMenu } from '../navigation/goBackOrMenu';
import GlassCard from '../components/GlassCard';
import ScreenHeader from '../components/ui/ScreenHeader';
import PrimaryButton from '../components/ui/PrimaryButton';
import SettingsSwitch from '../components/ui/SettingsSwitch';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';

export default function SettingsScreen() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const userEmail = useAuthStore((s) => s.userEmail);
  const soundEffects = useSettingsStore((s) => s.soundEffects);
  const setSoundEffects = useSettingsStore((s) => s.setSoundEffects);
  const videoAutoplayOnWrong = useSettingsStore((s) => s.videoAutoplayOnWrong);
  const setVideoAutoplayOnWrong = useSettingsStore((s) => s.setVideoAutoplayOnWrong);
  const dailyReminder = useSettingsStore((s) => s.dailyReminder);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-cc-fg text-[15px] leading-snug pr-2" id="settings-sound-label">
            Sound effects
          </span>
          <SettingsSwitch
            checked={soundEffects}
            onCheckedChange={setSoundEffects}
            aria-labelledby="settings-sound-label"
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-cc-fg text-[15px] leading-snug pr-2" id="settings-video-label">
            Warning video after wrong answer
          </span>
          <SettingsSwitch
            checked={videoAutoplayOnWrong}
            onCheckedChange={setVideoAutoplayOnWrong}
            aria-labelledby="settings-video-label"
          />
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3.5">
          <span className="text-cc-fg text-[15px] leading-snug pr-2" id="settings-reminder-label">
            Daily reminder
          </span>
          <SettingsSwitch
            checked={dailyReminder}
            onCheckedChange={setDailyReminder}
            aria-labelledby="settings-reminder-label"
          />
        </div>
      </GlassCard>

      <div className="mt-6 flex flex-col gap-3">
        <PrimaryButton
          variant="outline"
          className="py-4"
          icon={<i className="fas fa-sign-out-alt" aria-hidden />}
          onClick={() => {
            void (async () => {
              await logout();
              navigate('/login', { replace: true });
            })();
          }}
        >
          Log out
        </PrimaryButton>

        {!deleteConfirmOpen ? (
          <PrimaryButton
            variant="outline"
            className="py-4 !border-red-500/45 text-red-300 hover:bg-red-500/10"
            icon={<i className="fas fa-user-slash" aria-hidden />}
            onClick={() => {
              setDeleteError(null);
              setDeleteConfirmOpen(true);
            }}
          >
            Delete account…
          </PrimaryButton>
        ) : (
          <GlassCard className="rounded-2xl p-4">
            <p className="text-sm text-cc-muted leading-relaxed text-center">
              This permanently deletes your account and associated data — you will need to sign up again to use the app
            </p>
            {deleteError ? (
              <p className="mt-3 text-xs text-amber-400" role="alert">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-3">
              <PrimaryButton
                variant="outline"
                className="py-4"
                disabled={deleteBusy}
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteError(null);
                }}
              >
                Cancel
              </PrimaryButton>
              <PrimaryButton
                variant="outline"
                className="py-4 !border-red-500/45 text-red-300 hover:bg-red-500/10"
                disabled={deleteBusy}
                loading={deleteBusy}
                icon={<i className="fas fa-user-slash" aria-hidden />}
                onClick={() => {
                  void (async () => {
                    setDeleteBusy(true);
                    setDeleteError(null);
                    try {
                      await deleteAccount();
                      navigate('/login', { replace: true });
                    } catch (e) {
                      setDeleteError(e instanceof Error ? e.message : 'Could not delete account');
                    } finally {
                      setDeleteBusy(false);
                    }
                  })();
                }}
              >
                Delete permanently
              </PrimaryButton>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
