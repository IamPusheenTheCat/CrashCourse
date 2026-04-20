import type { KeyboardEvent } from 'react';
import GlassCard from './GlassCard';

export type ReviewRowMode = 'wrong' | 'favorite';

function rowTitle(mode: ReviewRowMode, count: number | null): string {
  const n = count === null ? '…' : String(count);
  return mode === 'wrong' ? `Wrong answers (${n})` : `Favorites (${n})`;
}

function rowSubtitle(mode: ReviewRowMode, count: number | null): string {
  if (mode === 'wrong') {
    return count === 0 ? 'No mistakes to review.' : 'Review mistakes in book order';
  }
  return count === 0 ? 'No favorites to review.' : 'Review favorites in book order';
}

interface Props {
  mode: ReviewRowMode;
  count: number | null;
  busy: boolean;
  onClick: () => void;
}

export default function ReviewModeRow({ mode, count, busy, onClick }: Props) {
  const empty = count === 0;
  const clickable = !empty;

  const activate = () => {
    if (!clickable || busy) return;
    onClick();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!clickable || busy) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  };

  return (
    <GlassCard
      role="button"
      tabIndex={clickable && !busy ? 0 : -1}
      aria-busy={busy}
      aria-disabled={!clickable}
      className={`p-4 flex items-center gap-4 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a2e] ${
        empty ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-[0.98]'
      }`}
      onClick={() => activate()}
      onKeyDown={onKeyDown}
    >
      <div
        className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${
          mode === 'wrong' ? 'bg-amber-500/20' : 'bg-[#e94560]/20'
        }`}
      >
        {busy ? (
          <i
            className={`fas fa-circle-notch fa-spin ${
              mode === 'wrong' ? 'text-amber-400' : 'text-[#e94560]'
            }`}
          />
        ) : mode === 'wrong' ? (
          <i className="fas fa-exclamation-circle text-amber-400" />
        ) : (
          <i className="fas fa-heart text-[#e94560]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{rowTitle(mode, count)}</p>
        <p className="text-white/60 text-xs mt-0.5">{rowSubtitle(mode, count)}</p>
      </div>
    </GlassCard>
  );
}
