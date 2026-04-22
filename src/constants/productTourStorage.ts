/**
 * 应用内 Product tour（首次进入菜单 / 练习 Quiz 的真实 UI 引导）。
 * 按用户 id 区分，存 localStorage。
 */

function keyMenu(uid: number): string {
  return `crashcourse-tour-menu-v1-u${uid}`;
}

function keyQuiz(uid: number): string {
  /** v4：Tap + Swipe 合并为一步后升级键名 */
  return `crashcourse-tour-quiz-v4-u${uid}`;
}

function keyQuizWrongVideo(uid: number): string {
  /** v2：错题视频 tour 合并为一步（仅高亮 Continue） */
  return `crashcourse-tour-quiz-wrong-video-v2-u${uid}`;
}

export function readMenuProductTourDone(userId: number): boolean {
  try {
    return localStorage.getItem(keyMenu(userId)) === '1';
  } catch {
    return false;
  }
}

export function markMenuProductTourDone(userId: number): void {
  try {
    localStorage.setItem(keyMenu(userId), '1');
  } catch {
    /* private mode */
  }
}

export function readQuizProductTourDone(userId: number): boolean {
  try {
    return localStorage.getItem(keyQuiz(userId)) === '1';
  } catch {
    return false;
  }
}

export function markQuizProductTourDone(userId: number): void {
  try {
    localStorage.setItem(keyQuiz(userId), '1');
  } catch {
    /* private mode */
  }
}

export function readQuizWrongVideoTourDone(userId: number): boolean {
  try {
    return localStorage.getItem(keyQuizWrongVideo(userId)) === '1';
  } catch {
    return false;
  }
}

export function markQuizWrongVideoTourDone(userId: number): void {
  try {
    localStorage.setItem(keyQuizWrongVideo(userId), '1');
  } catch {
    /* private mode */
  }
}
