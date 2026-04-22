import type { ReactNode } from 'react';
import IconCircleButton from './IconCircleButton';

type Props = {
  title: string;
  /** 练习 / 复习说明；内层可自带 line-clamp */
  subtitle?: ReactNode;
  streak: number;
  onBack: () => void;
  backAriaLabel: string;
  /** Product tour 锚点 */
  backDataTour?: string;
  streakDataTour?: string;
};

const subtitleWrap = 'mt-0.5 text-[10px] text-cc-muted leading-snug sm:text-[11px]';

/**
 * Quiz 顶栏：紧凑标题 + 可选说明 + streak（字阶与 ScreenHeader 区分）
 */
export default function QuizSessionHeader({
  title,
  subtitle,
  streak,
  onBack,
  backAriaLabel,
  backDataTour,
  streakDataTour,
}: Props) {
  return (
    <header className="flex items-center justify-between mb-4 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <IconCircleButton
          onClick={onBack}
          aria-label={backAriaLabel}
          {...(backDataTour ? { 'data-product-tour': backDataTour } : {})}
        >
          <i className="fas fa-arrow-left" />
        </IconCircleButton>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold truncate text-cc-fg">{title}</h1>
          {subtitle != null ? <div className={subtitleWrap}>{subtitle}</div> : null}
        </div>
      </div>
      <div
        className="flex items-center gap-2 text-cc-muted text-sm shrink-0 tabular-nums"
        {...(streakDataTour ? { 'data-product-tour': streakDataTour } : {})}
      >
        <i className="fas fa-fire-alt" aria-hidden />
        <span>{streak} streak</span>
      </div>
    </header>
  );
}
