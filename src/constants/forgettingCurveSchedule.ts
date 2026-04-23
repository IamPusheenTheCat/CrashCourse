/**
 * 错题后「下次可复习」的时间阶梯，与后端
 * `CrashCourseBackend/app/services/question_service.py` 中
 * `_FIRST_WRONG_DELAY`、`_SECOND_WRONG_DELAY`、`_LATER_WRONG_DELAY` 保持一致。
 */
export const EBBINGHAUS_CURVE_MARKERS = [
  { minutes: 30, shortLabel: '30m' },
  { minutes: 12 * 60, shortLabel: '12h' },
  { minutes: 24 * 60, shortLabel: '1d' },
] as const;
