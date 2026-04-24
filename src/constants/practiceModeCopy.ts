/** Shown on the Ebbinghaus chip — keep this exact curve name */
export const PRACTICE_MODE_EBBINGHAUS_LABEL = 'Ebbinghaus Forgetting Curve';

/** Hover / screen reader — one short line */
export const PRACTICE_MODE_EBBINGHAUS_CHIP_TITLE = 'Timed for better recall';

/** Quiz header & menu practice row */
/** Menu + quiz practice subtitle — length ~ other menu rows */
export const PRACTICE_MODE_SUBTITLE = 'Smart review · start now';

/** 菜单：0 due 或练习池暂时为空（与 get_next 无题一致） */
export const PRACTICE_MENU_NOTHING_TO_PRACTICE = 'Nothing due right now';

/** Quiz：练习已做完 / 暂无下一题（与 isPracticeFinishedNoMore 一致） */
export const PRACTICE_COMPLETE_HEADLINE = "You're all good for now";
export const PRACTICE_COMPLETE_SUBLINE = 'Come back later for more';

export function isPracticePoolExhaustedMessage(msg: string): boolean {
  const m = msg.trim().toLowerCase();
  return m.includes('no question available') || m.includes('no more questions');
}
