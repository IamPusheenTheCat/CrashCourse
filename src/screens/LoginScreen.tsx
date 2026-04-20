import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithEmailPassword = useAuthStore((s) => s.loginWithEmailPassword);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/menu', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await loginWithEmailPassword(trimmed, password);
      navigate('/menu');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-44px)] pb-8">
      <div className="text-center mb-10">
        <div className="glass w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-car-crash text-4xl text-[#e94560]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">CrashCourse</h1>
        <p className="text-white/70 mt-2 text-sm">Learn the rules. Avoid the crash.</p>
      </div>

      <div className="glass w-full max-w-[320px] p-6 rounded-2xl">
        <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 mb-4"
        />
        <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 mb-4"
        />
        {error ? (
          <p
            className="text-amber-400 text-xs mb-4 leading-relaxed break-words whitespace-pre-wrap"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="w-full py-3.5 rounded-xl bg-[#e94560] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#e94560]/25 active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {loading ? <i className="fas fa-circle-notch fa-spin" /> : <i className="fas fa-sign-in-alt" />}
          Sign in
        </button>
        <p className="text-center text-white/55 text-xs mt-4 leading-relaxed px-1">
          If this email is not registered yet, your first sign-in will create your account automatically.
        </p>
      </div>

      <p className="text-white/50 text-xs mt-8 text-center max-w-[280px]">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
