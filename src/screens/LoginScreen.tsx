import { useEffect, useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { takeReauthFlashMessage } from '../auth/sessionInvalid';
import { useAuthStore } from '../stores/authStore';
import { FIRST_SIGN_IN_ACCOUNT_HINT } from '../constants/authCopy';
import { markUserTutorialDone } from '../constants/storageKeys';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { ccInputClass, ccLabelClass } from '../components/ui/formClasses';

export default function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithEmailPassword = useAuthStore((s) => s.loginWithEmailPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reauthBanner, setReauthBanner] = useState<string | null>(null);

  useEffect(() => {
    const flash = takeReauthFlashMessage();
    const fromState = (location.state as { reauthMessage?: string } | null)?.reauthMessage;
    const msg = flash ?? fromState ?? null;
    if (msg) setReauthBanner(msg);
  }, [location.key, location.state]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const uid = useAuthStore.getState().userId;
    if (uid != null) markUserTutorialDone(uid);
    navigate('/menu', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmailPassword(trimmed, password);
      const uid = useAuthStore.getState().userId;
      if (uid != null) markUserTutorialDone(uid);
      navigate('/menu', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-44px)] pb-8">
      <div className="text-center mb-10">
        <div className="glass w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-car-crash text-4xl text-cc-accent" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">CrashCourse</h1>
        <p className="text-cc-muted mt-2 text-sm">Learn the rules. Avoid the crash</p>
      </div>

      <GlassCard className="w-full max-w-[320px] p-6">
        {reauthBanner ? (
          <p
            className="text-sky-200/95 text-xs mb-4 leading-relaxed rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2.5"
            role="status"
          >
            {reauthBanner}
          </p>
        ) : null}
        <form onSubmit={(ev) => void handleSubmit(ev)} noValidate>
          <label className={ccLabelClass} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            autoComplete="email"
            className={ccInputClass}
          />
          <label className={ccLabelClass} htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="current-password"
            className={ccInputClass}
          />
          {error ? (
            <p
              className="text-amber-400 text-xs mb-4 leading-relaxed break-words whitespace-pre-wrap"
              role="alert"
            >
              {error}
            </p>
          ) : null}
          <PrimaryButton
            type="submit"
            variant="accent"
            loading={loading}
            icon={<i className="fas fa-sign-in-alt" aria-hidden />}
          >
            Sign in
          </PrimaryButton>
          <p className="text-center text-cc-muted text-xs mt-4 leading-relaxed px-1">
            {FIRST_SIGN_IN_ACCOUNT_HINT}
          </p>
        </form>
      </GlassCard>
    </div>
  );
}
