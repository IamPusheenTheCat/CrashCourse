/** Chip / emphasis: full name users recognize as “遗忘曲线” */
export const PRACTICE_MODE_EBBINGHAUS_LABEL = 'Ebbinghaus Forgetting Curve';

/** Quiz header (menu uses chip for the curve name) */
export const PRACTICE_MODE_SUBTITLE = 'Recommended practice · smart order';

/** 菜单：0 due 或练习池暂时为空（与 get_next 无题一致） */
export const PRACTICE_MENU_NOTHING_TO_PRACTICE = 'Nothing due right now';

/** Quiz：练习已做完 / 暂无下一题（与 isPracticeFinishedNoMore 一致） */
export const PRACTICE_COMPLETE_HEADLINE = "You're all good for now";
export const PRACTICE_COMPLETE_SUBLINE = 'Please review again later';

export function isPracticePoolExhaustedMessage(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return m.includes('no question available') || m.includes('no more questions');
}
