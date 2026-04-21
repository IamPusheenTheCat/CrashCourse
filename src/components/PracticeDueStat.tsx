import PracticeCooldownRing from './PracticeCooldownRing';

type Props = {
  count: number;
  /** 拉取数量时占位，避免布局跳动 */
  loading?: boolean;
  /** 0 due 时下一题可做的预计时间（get_next 无题时的 next_review_time） */
  nextReviewIso?: string | null;
  onCooldownElapsed?: () => void;
  className?: string;
};

/** 与菜单行左侧 w-12 h-12 图标同高，避免冷却计时态撑高整行 */
const shellClass =
  'flex h-12 min-w-[2.75rem] shrink-0 flex-col items-center justify-center rounded-xl border px-2 py-0 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

/** Menu row: compact “how many recommended / due now” */
export default function PracticeDueStat({
  count,
  loading = false,
  nextReviewIso = null,
  onCooldownElapsed,
  className = '',
}: Props) {
  const muted = !loading && count === 0;
  const showCooldown = muted && typeof nextReviewIso === 'string' && nextReviewIso.length > 0;

  if (loading) {
    return (
      <div
        className={`${shellClass} gap-0.5 border-emerald-400/20 bg-emerald-500/10 ${className}`}
        aria-busy
        aria-label="Loading available question count"
      >
        <i className="fas fa-circle-notch fa-spin text-sm text-emerald-400/90" aria-hidden />
      </div>
    );
  }
  if (showCooldown) {
    return (
      <div
        className={`${shellClass} gap-px border-cc-border bg-cc-fill ${className}`}
        aria-label="Countdown until next question is due"
      >
        <PracticeCooldownRing
          compact
          targetIso={nextReviewIso}
          onElapsed={onCooldownElapsed}
        />
        <span className="text-[8px] font-semibold uppercase leading-none tracking-wide text-emerald-200/85">
          next
        </span>
      </div>
    );
  }

  return (
    <div
      className={`${shellClass} gap-px ${
        muted
          ? 'border-cc-border bg-cc-fill'
          : 'border-emerald-400/30 bg-gradient-to-b from-emerald-500/25 to-emerald-600/[0.12]'
      } ${className}`}
      aria-label={`${count} questions due now`}
    >
      <span
        className={`text-[15px] font-bold tabular-nums leading-none ${
          muted ? 'text-emerald-50/45' : 'text-emerald-50'
        }`}
      >
        {count}
      </span>
      <span
        className={`text-[11px] font-semibold uppercase leading-none tracking-wide ${
          muted ? 'text-emerald-200/45' : 'text-emerald-200/85'
        }`}
      >
        due
      </span>
    </div>
  );
}
