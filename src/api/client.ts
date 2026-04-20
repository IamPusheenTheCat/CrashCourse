import { Capacitor } from '@capacitor/core';

const TOKEN_KEY = 'crashcourse-token';

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
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null | undefined): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
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
  if (!res.ok) {
    const msg =
      typeof raw === 'object' && raw !== null && 'msg' in raw && typeof (raw as { msg: unknown }).msg === 'string'
        ? (raw as { msg: string }).msg
        : res.statusText;
    throw new ApiError(msg || 'Request failed', res.status, raw);
  }

  return raw as T;
}
