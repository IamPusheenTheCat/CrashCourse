import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function SignUpScreen() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/menu', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSignUp = () => {
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    login();
    navigate('/menu');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-44px)] pb-8">
      <div className="text-center mb-10">
        <div className="glass w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-user-plus text-4xl text-[#e94560]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Create account</h1>
        <p className="text-white/70 mt-2 text-sm">Join CrashCourse and start learning.</p>
      </div>

      <div className="glass w-full max-w-[320px] p-6 rounded-2xl">
        <label className="block text-sm font-medium text-white/90 mb-2">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 mb-4"
        />
        <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 mb-4"
        />
        <label className="block text-sm font-medium text-white/90 mb-2">Confirm password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#e94560]/50 mb-4"
        />
        {error ? (
          <p className="text-amber-400 text-xs -mt-2 mb-4" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleSignUp}
          className="w-full py-3.5 rounded-xl bg-[#e94560] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#e94560]/25 active:scale-[0.98] transition-transform"
        >
          <i className="fas fa-user-plus" /> Sign up
        </button>
        <p className="text-center text-white/60 text-xs mt-4">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#e94560] font-medium cursor-pointer bg-transparent border-0 p-0"
          >
            Sign in
          </button>
        </p>
      </div>

      <p className="text-white/50 text-xs mt-8 text-center max-w-[280px]">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
    </div>
  );
}
