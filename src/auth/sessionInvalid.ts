/** 登录页挂载时读取并清除，避免与 ProtectedRoute 跳转竞态导致丢文案 */
export const REAUTH_FLASH_KEY = 'crashcourse-reauth-flash';

export const DEFAULT_REAUTH_MESSAGE = 'Your session expired, please sign in again';

export function setReauthFlashMessage(message?: string): void {
  try {
    sessionStorage.setItem(REAUTH_FLASH_KEY, message ?? DEFAULT_REAUTH_MESSAGE);
  } catch {
    /* private mode */
  }
}

export function takeReauthFlashMessage(): string | null {
  try {
    const m = sessionStorage.getItem(REAUTH_FLASH_KEY);
    if (m) sessionStorage.removeItem(REAUTH_FLASH_KEY);
    return m;
  } catch {
    return null;
  }
}
