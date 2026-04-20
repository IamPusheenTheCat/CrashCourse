import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

/** 仅内存：关闭或刷新应用后需重新登录。不再写入 localStorage。 */
try {
  localStorage.removeItem('crashcourse-auth');
} catch {
  /* private mode / denied */
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  login: () => set({ isAuthenticated: true }),
  logout: () => set({ isAuthenticated: false }),
}));
