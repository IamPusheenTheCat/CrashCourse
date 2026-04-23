/**
 * Backend keeps a question on the mistake list until two consecutive correct
 * answers (repetition_count); show this so list counts don’t look “stuck”.
 */
export const MISTAKE_LIST_RULE = 'Removed after two correct answers in a row';

/** Menu row + quiz header: each question once per session (full question bank) */
export const FULL_BANK_MODE_TITLE = 'Full-bank pass';

/** Menu subtitle under full-bank row */
export const FULL_BANK_MENU_SUBTITLE = 'Full run · list or shuffle';

/** Quiz session header under full-bank mode */
export const FULL_BANK_QUIZ_SUBTITLE_SHUFFLED = 'Full run · shuffled order';
export const FULL_BANK_QUIZ_SUBTITLE_LIST_ORDER = 'Full run · list order';
