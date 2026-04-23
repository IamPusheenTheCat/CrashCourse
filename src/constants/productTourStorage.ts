/**
 * 应用内 Product tour（首次进入菜单 / 练习 Quiz 的真实 UI 引导）。
 * 按用户 id 区分，存 localStorage。
 */

function keyMenu(uid: number): string {
  /** v3：去掉 Settings 教程步 */
  return `crashcourse-tour-menu-v3-u${uid}`;
}

function legacyKeyMenuV2(uid: number): string {
  return `crashcourse-tour-menu-v2-u${uid}`;
}

function keyQuiz(uid: number): string {
  /** v6：顶栏+进度条与 streak 一步 + 答题滑动；首次完成于任一 Quiz 模式即记为完成 */
  return `crashcourse-tour-quiz-v6-u${uid}`;
}

function legacyKeyQuizV5(uid: number): string {
  return `crashcourse-tour-quiz-v5-u${uid}`;
}

function legacyKeyQuizV4(uid: number): string {
  return `crashcourse-tour-quiz-v4-u${uid}`;
}

function keyQuizWrongVideo(uid: number): string {
  /** v2：错题视频 tour 合并为一步（仅高亮 Continue） */
  return `crashcourse-tour-quiz-wrong-video-v2-u${uid}`;
}

export function readMenuProductTourDone(userId: number): boolean {
  try {
    if (localStorage.getItem(keyMenu(userId)) === '1') return true;
    return localStorage.getItem(legacyKeyMenuV2(userId)) === '1';
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
    if (localStorage.getItem(keyQuiz(userId)) === '1') return true;
    if (localStorage.getItem(legacyKeyQuizV5(userId)) === '1') return true;
    return localStorage.getItem(legacyKeyQuizV4(userId)) === '1';
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
