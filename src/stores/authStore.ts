import { create } from 'zustand';
import { getStoredToken, setStoredToken } from '../api/client';
import * as api from '../api/services';
import { useQuizStore } from './quizStore';

const USER_ID_KEY = 'crashcourse-user-id';

function readUserId(): number | null {
  try {
    const v = sessionStorage.getItem(USER_ID_KEY);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeUserId(id: number | null): void {
  try {
    if (id != null) sessionStorage.setItem(USER_ID_KEY, String(id));
    else sessionStorage.removeItem(USER_ID_KEY);
  } catch {
    /* private mode */
  }
}

interface AuthState {
  token: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  userId: readUserId(),
  isAuthenticated: Boolean(getStoredToken()),

  loginWithEmailPassword: async (email, password) => {
    const data = await api.loginOrRegister(email, password);
    setStoredToken(data.token);
    writeUserId(data.user_id);
    set({ token: data.token, userId: data.user_id, isAuthenticated: true });
  },

  logout: async () => {
    try {
      if (get().token) await api.logout();
    } catch {
      /* 仍清除本地态 */
    }
    setStoredToken(null);
    writeUserId(null);
    useQuizStore.getState().clearQuiz();
    set({ token: null, userId: null, isAuthenticated: false });
  },
}));
