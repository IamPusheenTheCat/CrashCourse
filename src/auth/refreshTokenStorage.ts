import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const REFRESH_STORAGE_KEY = 'crashcourse-refresh-token';

/** 原生侧内存镜像；必须在 main 里 await hydrate 后再发需鉴权请求 */
let nativeMem: string | null = null;

/**
 * iOS/Android：从 Preferences 读 refresh；若为空则从 WebView localStorage 迁移一次。
 * 浏览器：不操作（仍用 localStorage）。
 */
export async function hydrateRefreshTokenFromNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const { value } = await Preferences.get({ key: REFRESH_STORAGE_KEY });
  if (value) {
    nativeMem = value;
    return;
  }
  try {
    const ls = localStorage.getItem(REFRESH_STORAGE_KEY);
    const ss = sessionStorage.getItem(REFRESH_STORAGE_KEY);
    const legacy = ls ?? ss ?? null;
    if (legacy) {
      await Preferences.set({ key: REFRESH_STORAGE_KEY, value: legacy });
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
      nativeMem = legacy;
    }
  } catch {
    /* ignore */
  }
}

export function getRefreshTokenSync(): string | null {
  if (Capacitor.isNativePlatform()) {
    return nativeMem;
  }
  try {
    const v = localStorage.getItem(REFRESH_STORAGE_KEY);
    if (v != null) return v;
    const legacy = sessionStorage.getItem(REFRESH_STORAGE_KEY);
    if (legacy != null) {
      localStorage.setItem(REFRESH_STORAGE_KEY, legacy);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
      return legacy;
    }
    return null;
  } catch {
    return null;
  }
}

export async function persistRefreshToken(token: string | null | undefined): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    if (token != null && token.length > 0) {
      nativeMem = token;
      await Preferences.set({ key: REFRESH_STORAGE_KEY, value: token });
    } else {
      nativeMem = null;
      await Preferences.remove({ key: REFRESH_STORAGE_KEY });
    }
    try {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    if (token != null && token.length > 0) {
      localStorage.setItem(REFRESH_STORAGE_KEY, token);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    } else {
      localStorage.removeItem(REFRESH_STORAGE_KEY);
      sessionStorage.removeItem(REFRESH_STORAGE_KEY);
    }
  } catch {
    /* private mode */
  }
}
