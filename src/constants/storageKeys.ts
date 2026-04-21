/**
 * 教程与引导的 sessionStorage 键。
 * - 访客：看完引导点「Login」后记一次，根路径未登录时不再强制回教程页
 * - 账号：登录成功时写入（与教程页 Login 配套；用于区分设备等，可按需扩展）
 */

/** 旧版：访客在教程点 Login 时写入；仍参与 readGuestTutorialIntroDone，兼容已有会话 */
export const TUTORIAL_SEEN_KEY = 'crashcourse-tutorial-seen';

/** 新版：访客完成引导、前往登录 */
export const TUTORIAL_GUEST_DONE_KEY = 'crashcourse-tutorial-guest-done';

export function tutorialUserSeenStorageKey(userId: number): string {
  return `crashcourse-tutorial-user-${userId}`;
}

/** 未登录用户是否已看过引导并去过登录页（根路径 / 用） */
export function readGuestTutorialIntroDone(): boolean {
  try {
    return (
      sessionStorage.getItem(TUTORIAL_GUEST_DONE_KEY) === '1' ||
      sessionStorage.getItem(TUTORIAL_SEEN_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function markGuestTutorialIntroDone(): void {
  try {
    sessionStorage.setItem(TUTORIAL_GUEST_DONE_KEY, '1');
  } catch {
    /* private mode */
  }
}

export function markUserTutorialDone(userId: number): void {
  try {
    sessionStorage.setItem(tutorialUserSeenStorageKey(userId), '1');
  } catch {
    /* private mode */
  }
}
