import { PRACTICE_MODE_EBBINGHAUS_LABEL } from '../constants/practiceModeCopy';

type Props = { className?: string; compact?: boolean };

export default function EbbinghausCurveBadge({ className = '', compact = false }: Props) {
  const size = compact
    ? 'gap-0.5 px-1.5 py-[1px] text-[9px]'
    : 'gap-1 px-2 py-0.5 text-[10px]';
  const icon = compact ? 'text-[8px]' : 'text-[9px]';
  return (
    <span
      className={`inline-flex max-w-full shrink-0 items-center rounded-full border border-emerald-400/20 bg-emerald-500/12 font-medium leading-none text-emerald-300/90 ${size} ${className}`}
      title={PRACTICE_MODE_EBBINGHAUS_LABEL}
    >
      <i className={`fas fa-chart-line shrink-0 opacity-85 ${icon}`} aria-hidden />
      <span className="whitespace-nowrap">{PRACTICE_MODE_EBBINGHAUS_LABEL}</span>
    </span>
  );
}
