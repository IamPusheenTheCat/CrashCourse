import { Capacitor } from '@capacitor/core';
import { getRefreshTokenSync, persistRefreshToken } from '../auth/refreshTokenStorage';

const TOKEN_KEY = 'crashcourse-token';

let refreshInFlight: Promise<boolean> | null = null;

/** access 在过期前多久（毫秒）尝试用 refresh 续期 */
const ACCESS_REFRESH_LEEWAY_MS = 120_000;
/** 未过期时两次主动续期间隔，避免短时间重复打 /auth/refresh */
const PROACTIVE_REFRESH_COOLDOWN_MS = 60_000;
let lastProactiveRefreshAt = 0;

/**
 * 登录相关字段用 localStorage，关标签 / App 冷启动后仍可续期。
 * 若曾在 sessionStorage 存过同名键，首次读取时迁移并删掉旧键。
 */
export function readPersistedAuthField(key: string): string | null {
  try {
    const v = localStorage.getItem(key);
    if (v != null) return v;
    const legacy = sessionStorage.getItem(key);
    if (legacy != null) {
      localStorage.setItem(key, legacy);
      sessionStorage.removeItem(key);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export function writePersistedAuthField(key: string, value: string | null): void {
  try {
    if (value != null && value.length > 0) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  } catch {
    /* private mode / quota */
  }
}

/**
 * API 基址优先级：
 * 1. VITE_API_BASE_URL（推荐：真机、上架、任意自定义后端）
 * 2. 浏览器 dev：同源 /api/v1 → Vite 代理到本机 8000
 * 3. Capacitor 原生且未配 env：模拟器连本机后端（Android 10.0.2.2；iOS 模拟器 127.0.0.1）
 * 4. 其它生产构建：占位域名（应配 env）
 */
export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return '/api/v1';

  if (Capacitor.isNativePlatform()) {
    const p = Capacitor.getPlatform();
    if (p === 'android') return 'http://10.0.2.2:8000/api/v1';
    if (p === 'ios') return 'http://127.0.0.1:8000/api/v1';
  }

  return 'https://api.yourdomain.com/api/v1';
}

export function apiBaseHintForErrors(): string {
  if (import.meta.env.VITE_API_BASE_URL) return '';
  if (import.meta.env.DEV) {
    return ' Start the backend on port 8000 (Vite proxies /api/v1).';
  }
  if (Capacitor.isNativePlatform()) {
    if (Capacitor.getPlatform() === 'android') {
      return ' Android: start backend with uvicorn --host 0.0.0.0 --port 8000. Emulator uses 10.0.2.2; on a real phone set VITE_API_BASE_URL to http://YOUR_PC_LAN_IP:8000/api/v1 and rebuild.';
    }
    return ' iOS: set VITE_API_BASE_URL to your Mac’s LAN URL before npm run build (simulator can use 127.0.0.1).';
  }
  return ' Set VITE_API_BASE_URL or run npm run dev with the backend on port 8000.';
}

export function getStoredToken(): string | null {
  return readPersistedAuthField(TOKEN_KEY);
}

export function setStoredToken(token: string | null | undefined): void {
  writePersistedAuthField(TOKEN_KEY, token != null && token.length > 0 ? token : null);
}

export function getStoredRefreshToken(): string | null {
  return getRefreshTokenSync();
}

export async function setStoredRefreshToken(token: string | null | undefined): Promise<void> {
  await persistRefreshToken(token);
}

/** 清除 access + refresh（登出或 refresh 失败时） */
export async function clearStoredAuthTokens(): Promise<void> {
  setStoredToken(null);
  await persistRefreshToken(null);
}

function normalizeApiPath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function isAuthPublicPath(path: string): boolean {
  const p = normalizeApiPath(path);
  return p === '/auth/login_or_register' || p === '/auth/refresh';
}

function decodeJwtExpMs(accessToken: string): number | null {
  const parts = accessToken.split('.');
  if (parts.length < 2) return null;
  let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (b64.length % 4)) % 4;
  if (pad) b64 += '='.repeat(pad);
  try {
    const json = JSON.parse(atob(b64)) as { exp?: unknown };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** 在 access 将过期或已过期时，用 refresh 静默续期（不依赖本次请求已 401） */
async function ensureAccessTokenFresh(pathNorm: string): Promise<void> {
  if (isAuthPublicPath(pathNorm)) return;
  const token = getStoredToken();
  if (!token) return;
  const expMs = decodeJwtExpMs(token);
  if (expMs == null) return;
  const now = Date.now();
  if (now < expMs - ACCESS_REFRESH_LEEWAY_MS) return;
  if (getRefreshTokenSync() == null) return;
  const expired = now >= expMs;
  if (!expired && now - lastProactiveRefreshAt < PROACTIVE_REFRESH_COOLDOWN_MS) return;
  const ok = await tryRefreshAccessToken();
  if (ok || !expired) lastProactiveRefreshAt = Date.now();
}

async function tryRefreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const rt = getRefreshTokenSync();
  if (!rt) return false;
  refreshInFlight = (async (): Promise<boolean> => {
    try {
      const url = `${getApiBase()}/auth/refresh`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      const raw = await parseJson(res);
      if (!res.ok) return false;
      const env = raw as ApiEnvelope<{ access_token?: string; token?: string }>;
      if (typeof env !== 'object' || env === null || env.code !== 200 || !env.data) return false;
      const access = env.data.access_token ?? env.data.token;
      if (!access) return false;
      setStoredToken(access);
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().rehydrateToken();
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function clearSessionAfterRefreshFailure(): Promise<void> {
  const { useAuthStore } = await import('../stores/authStore');
  await useAuthStore.getState().clearLocalSession({ notifyReauth: true });
}

export interface ApiEnvelope<T> {
  code: number;
  msg?: string;
  data?: T;
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly body?: unknown;

  constructor(message: string, statusCode: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const normPath = normalizeApiPath(path);

  for (let attempt = 0; attempt < 2; attempt++) {
    await ensureAccessTokenFresh(normPath);
    const headers = new Headers(init.headers);
    if (init.json !== undefined) {
      headers.set('Content-Type', 'application/json');
    }
    const token = getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    let res: Response;
    try {
      res = await fetch(url, {
        ...init,
        headers,
        body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
      });
    } catch (err) {
      const hint = apiBaseHintForErrors() || ' Check that the API URL is correct and the server is running.';
      if (import.meta.env.DEV || Capacitor.isNativePlatform()) {
        console.warn('[CrashCourse] fetch failed:', url, err);
      }
      const message =
        err instanceof TypeError && (err.message === 'Failed to fetch' || err.message.includes('fetch'))
          ? `Could not reach the API (${url}).${hint}`
          : err instanceof Error
            ? err.message
            : 'Network error';
      throw new ApiError(message, 0, err);
    }

    const raw = await parseJson(res);

    if (
      res.status === 401 &&
      attempt === 0 &&
      !isAuthPublicPath(normPath) &&
      getRefreshTokenSync() != null
    ) {
      const renewed = await tryRefreshAccessToken();
      if (renewed) continue;
      await clearSessionAfterRefreshFailure();
    }

    if (!res.ok) {
      if (
        res.status === 401 &&
        !isAuthPublicPath(normPath) &&
        (getStoredToken() != null || getRefreshTokenSync() != null)
      ) {
        const { useAuthStore } = await import('../stores/authStore');
        await useAuthStore.getState().clearLocalSession({ notifyReauth: true });
      }
      const msg =
        typeof raw === 'object' && raw !== null && 'msg' in raw && typeof (raw as { msg: unknown }).msg === 'string'
          ? (raw as { msg: string }).msg
          : res.statusText;
      throw new ApiError(msg || 'Request failed', res.status, raw);
    }

    return raw as T;
  }

  throw new ApiError('Request failed after retry', 401);
}
