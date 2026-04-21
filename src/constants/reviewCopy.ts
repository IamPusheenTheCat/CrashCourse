/**
 * Backend keeps a question on the mistake list until two consecutive correct
 * answers (repetition_count); show this so list counts don’t look “stuck”.
 */
export const MISTAKE_LIST_RULE =
  'Removed after two correct answers in a row · fixed order';
