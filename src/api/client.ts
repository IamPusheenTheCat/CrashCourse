import { Capacitor } from '@capacitor/core';
import { getRefreshTokenSync, persistRefreshToken } from '../auth/refreshTokenStorage';

const TOKEN_KEY = 'crashcourse-token';

/** refresh 结果：成功 / 服务端拒绝 / 网络或暂态错误（不应据此清本地会话） */
type RefreshAttempt = 'ok' | 'rejected' | 'transient';

let refreshInFlight: Promise<RefreshAttempt> | null = null;

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
  const r = await tryRefreshAccessTokenDeduped();
  if (r === 'ok' || !expired) lastProactiveRefreshAt = Date.now();
}

async function tryRefreshAccessTokenDeduped(): Promise<RefreshAttempt> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async (): Promise<RefreshAttempt> => {
    try {
      const rt = getRefreshTokenSync();
      if (!rt) return 'rejected';

      const url = `${getApiBase()}/auth/refresh`;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        });
      } catch {
        return 'transient';
      }

      const raw = await parseJson(res);
      if (!res.ok) {
        if (res.status >= 500) return 'transient';
        return 'rejected';
      }

      const env = raw as ApiEnvelope<{ access_token?: string; token?: string }>;
      if (typeof env !== 'object' || env === null || env.code !== 200 || !env.data) return 'rejected';
      const access = env.data.access_token ?? env.data.token;
      if (!access) return 'rejected';
      setStoredToken(access);
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().rehydrateToken();
      return 'ok';
    } catch {
      return 'transient';
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function clearSessionAfterRefreshFailure(): Promise<void> {
  const { useAuthStore } = await import('../stores/authStore');
  await useAuthStore.getState().clearLocalSession();
}

/** 冷启动同步清会话：本地曾有登录态但 refresh 被拒或 access 已死且无救 */
async function clearSessionAfterStartupSyncFailure(): Promise<void> {
  const { useAuthStore } = await import('../stores/authStore');
  await useAuthStore.getState().clearLocalSession();
}

/**
 * 在 React 首帧之前调用（见 main.tsx）。
 * 避免：本地仍有 access JWT → 路由进菜单 → 首包 401/续期失败 → 清会话跳登录，造成「先闪菜单再登录」。
 */
export async function runStartupAuthSync(): Promise<void> {
  const token = getStoredToken();
  /** 仅有 refresh、access 丢失时（异常存储）仍尝试续期，避免误判未登录 */
  if (!token && getRefreshTokenSync() != null) {
    const r = await tryRefreshAccessTokenDeduped();
    if (r === 'rejected') await clearSessionAfterStartupSyncFailure();
    return;
  }
  if (!token) return;

  const expMs = decodeJwtExpMs(token);
  const now = Date.now();
  const inRefreshWindow = expMs != null && now >= expMs - ACCESS_REFRESH_LEEWAY_MS;
  if (!inRefreshWindow) return;

  const rt = getRefreshTokenSync();
  if (rt == null) {
    if (expMs != null && now >= expMs) {
      await clearSessionAfterStartupSyncFailure();
    }
    return;
  }

  const expired = expMs != null && now >= expMs;
  if (!expired && now - lastProactiveRefreshAt < PROACTIVE_REFRESH_COOLDOWN_MS) return;

  const r = await tryRefreshAccessTokenDeduped();
  if (r === 'ok' || !expired) lastProactiveRefreshAt = Date.now();
  /** 仅服务端明确拒绝 refresh 时才清会话；网络/5xx 保留令牌，进菜单后再续期 */
  if (r === 'rejected' && expired) await clearSessionAfterStartupSyncFailure();
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

/** 后端保留中文 detail 时，登录等界面仍显示英文提示 */
const DETAIL_TO_USER_MESSAGE: Record<string, string> = {
  密码错误: 'Incorrect password',
};

function mapDetailForDisplay(detail: string): string {
  const t = detail.trim();
  return DETAIL_TO_USER_MESSAGE[t] ?? t;
}

/** 业务信封用 `msg`；FastAPI HTTPException 用 `detail`（常为字符串）。fetch 的 statusText 可能为空，不能依赖。 */
function messageFromErrorBody(raw: unknown, res: Response): string {
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t) return t;
  }
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.msg === 'string') {
      const t = o.msg.trim();
      if (t) return t;
    }
    const d = o.detail;
    if (typeof d === 'string') {
      const t = d.trim();
      if (t) return mapDetailForDisplay(t);
    }
    if (Array.isArray(d)) {
      const parts = d
        .map((item) => {
          if (typeof item === 'object' && item !== null && 'msg' in item) {
            const m = (item as { msg: unknown }).msg;
            return typeof m === 'string' ? m.trim() : '';
          }
          if (typeof item === 'string') return item.trim();
          return '';
        })
        .filter(Boolean);
      if (parts.length > 0) return parts.join(' ');
    }
  }
  const st = res.statusText?.trim();
  if (st) return st;
  if (res.status === 400) return 'Invalid request';
  if (res.status === 401) return 'Unauthorized';
  if (res.status === 403) return 'Forbidden';
  if (res.status === 404) return 'Not found';
  if (res.status >= 500) return 'Server error';
  return 'Request failed';
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
      const rr = await tryRefreshAccessTokenDeduped();
      if (rr === 'ok') continue;
      if (rr === 'transient') {
        throw new ApiError(
          `Could not reach the server to refresh your session.${apiBaseHintForErrors()}`,
          0,
        );
      }
      await clearSessionAfterRefreshFailure();
    }

    if (!res.ok) {
      if (
        res.status === 401 &&
        !isAuthPublicPath(normPath) &&
        (getStoredToken() != null || getRefreshTokenSync() != null)
      ) {
        const { useAuthStore } = await import('../stores/authStore');
        await useAuthStore.getState().clearLocalSession();
      }
      throw new ApiError(messageFromErrorBody(raw, res), res.status, raw);
    }

    return raw as T;
  }

  throw new ApiError('Request failed after retry', 401);
}
