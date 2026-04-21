import { useEffect, useMemo, useRef, useState } from 'react';

const R = 14;
const CX = 18;
const CY = 18;

type Props = {
  targetIso: string;
  onElapsed?: () => void;
  className?: string;
  /** 菜单行等窄位：缩小环与数字，避免撑高布局 */
  compact?: boolean;
};

function parseTarget(ts: string): number | null {
  const t = Date.parse(ts);
  return Number.isFinite(t) ? t : null;
}

/** 环内短标签 */
function formatRemainingLabel(ms: number): string {
  if (ms <= 0) return '…';
  const sec = Math.ceil(ms / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.ceil(sec / 60);
  if (min < 60) return `${min}m`;
  const h = Math.ceil(min / 60);
  if (h < 48) return `${h}h`;
  return `${Math.ceil(h / 24)}d`;
}

/**
 * 仅展示「距 next_review_time 还有多久」：静态圆环 + 文字。
 * 不做按比例 depleted 弧（基准随刷新 / 重算会变，易产生缺口与心理落差）。
 */
export default function PracticeCooldownRing({
  targetIso,
  onElapsed,
  className = '',
  compact = false,
}: Props) {
  const target = parseTarget(targetIso);
  const [tick, setTick] = useState(0);
  const onElapsedRef = useRef(onElapsed);
  const firedRef = useRef(false);
  onElapsedRef.current = onElapsed;

  useEffect(() => {
    firedRef.current = false;
  }, [targetIso]);

  useEffect(() => {
    if (target == null) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const remaining = useMemo(() => {
    if (target == null) return 0;
    void tick;
    return Math.max(0, target - Date.now());
  }, [target, tick]);

  useEffect(() => {
    if (target == null || remaining > 0) return;
    if (firedRef.current) return;
    firedRef.current = true;
    onElapsedRef.current?.();
  }, [remaining, target]);

  if (target == null) return null;

  const dim = compact ? 32 : 40;

  return (
    <div
      className={`relative shrink-0 ${className}`}
      aria-label={`Next question in ${formatRemainingLabel(remaining)}`}
    >
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 36 36"
        className={compact ? 'text-emerald-400/75' : 'text-emerald-400/60'}
      >
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="currentColor" strokeWidth={2.5} />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span
          className={`font-bold tabular-nums leading-none text-emerald-50 ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}
        >
          {formatRemainingLabel(remaining)}
        </span>
      </div>
    </div>
  );
}
