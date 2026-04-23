import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  FIRST_SIGN_IN_ACCOUNT_HINT,
  LOGIN_EMAIL_PLACEHOLDER,
  LOGIN_PASSWORD_PLACEHOLDER,
} from '../constants/authCopy';
import GlassCard from '../components/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { ccInputClass, ccLabelClass } from '../components/ui/formClasses';

export default function LoginScreen() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithEmailPassword = useAuthStore((s) => s.loginWithEmailPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
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
        <form onSubmit={(ev) => void handleSubmit(ev)} noValidate>
          <label className={ccLabelClass} htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder={LOGIN_EMAIL_PLACEHOLDER}
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
            placeholder={LOGIN_PASSWORD_PLACEHOLDER}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            autoComplete="current-password"
            className={ccInputClass}
          />
          {error ? (
            <p
              className="mb-4 rounded-xl border border-amber-400/35 bg-amber-500/[0.12] px-3.5 py-3 text-sm font-medium leading-snug text-amber-100/95 break-words whitespace-pre-wrap shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
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
