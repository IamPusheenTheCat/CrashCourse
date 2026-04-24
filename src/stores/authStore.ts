import { create } from 'zustand';
import {
  clearStoredAuthTokens,
  getStoredToken,
  readPersistedAuthField,
  setStoredRefreshToken,
  setStoredToken,
  writePersistedAuthField,
} from '../api/client';
import * as api from '../api/services';
import { clearAllReviewAllProgress } from '../lib/reviewAllProgressStorage';
import { useQuizStore } from './quizStore';
import { useProfileStore } from './profileStore';

const USER_ID_KEY = 'crashcourse-user-id';
const USER_EMAIL_KEY = 'crashcourse-user-email';

function readUserId(): number | null {
  const v = readPersistedAuthField(USER_ID_KEY);
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function writeUserId(id: number | null): void {
  writePersistedAuthField(USER_ID_KEY, id != null ? String(id) : null);
}

function readUserEmail(): string | null {
  const v = readPersistedAuthField(USER_EMAIL_KEY);
  return v && v.length > 0 ? v : null;
}

function writeUserEmail(email: string | null): void {
  writePersistedAuthField(USER_EMAIL_KEY, email != null && email.length > 0 ? email : null);
}

interface AuthState {
  token: string | null;
  userId: number | null;
  /** 登录邮箱，用于界面展示当前账号 */
  userEmail: string | null;
  isAuthenticated: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** 调用 DELETE /auth/me 后清除本地会话（不调用 logout） */
  deleteAccount: () => Promise<void>;
  /** access 续期后从 localStorage 同步到 store（由 api/client 调用） */
  rehydrateToken: () => void;
  /** 仅清本地态，不调后端（refresh 失败或令牌作废时由 client 调用） */
  clearLocalSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: getStoredToken(),
  userId: readUserId(),
  userEmail: readUserEmail(),
  isAuthenticated: Boolean(getStoredToken()),

  loginWithEmailPassword: async (email, password) => {
    const trimmed = email.trim();
    const data = await api.loginOrRegister(trimmed, password);
    setStoredToken(data.token);
    await setStoredRefreshToken(data.refresh_token);
    writeUserId(data.user_id);
    writeUserEmail(trimmed);
    set({ token: data.token, userId: data.user_id, userEmail: trimmed, isAuthenticated: true });
  },

  rehydrateToken: () => {
    const t = getStoredToken();
    set({ token: t, isAuthenticated: Boolean(t) });
  },

  clearLocalSession: async () => {
    await clearStoredAuthTokens();
    writeUserId(null);
    writeUserEmail(null);
    useQuizStore.getState().clearQuiz();
    useProfileStore.getState().clear();
    clearAllReviewAllProgress();
    set({ token: null, userId: null, userEmail: null, isAuthenticated: false });
  },

  logout: async () => {
    try {
      if (get().token) await api.logout();
    } catch {
      /* 仍清除本地态 */
    }
    await get().clearLocalSession();
  },

  deleteAccount: async () => {
    await api.deleteMyAccount();
    await get().clearLocalSession();
  },
}));
