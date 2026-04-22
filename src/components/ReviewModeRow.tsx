import type { KeyboardEvent } from 'react';
import GlassCard from './GlassCard';

export type ReviewRowMode = 'wrong' | 'favorite';

function rowTitle(mode: ReviewRowMode, count: number | null): string {
  const n = count === null ? '…' : String(count);
  return mode === 'wrong' ? `Wrong answers (${n})` : `Favorites (${n})`;
}

type RowSubtitle =
  | { layout: 'single'; text: string }
  | { layout: 'stacked'; primary: string; secondary: string };

function rowSubtitle(mode: ReviewRowMode, count: number | null): RowSubtitle {
  if (mode === 'wrong') {
    return count === 0
      ? { layout: 'single', text: 'Nothing in your wrong-answers list' }
      : {
          layout: 'stacked',
          primary: 'Review in fixed order',
          secondary: 'Removed after two correct answers in a row',
        };
  }
  return count === 0
    ? { layout: 'single', text: 'No saved favorites yet' }
    : {
        layout: 'stacked',
        primary: 'Review in fixed order',
        secondary: 'Stays on your list until you remove them',
      };
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
  const subtitle = rowSubtitle(mode, count);

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
      className={`p-4 flex items-center gap-3.5 sm:gap-4 transition-transform outline-none focus-visible:ring-2 focus-visible:ring-cc-muted/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cc-surface ${
        empty ? 'opacity-60 cursor-default' : 'cursor-pointer active:scale-[0.98]'
      }`}
      onClick={() => activate()}
      onKeyDown={onKeyDown}
    >
      <div
        className={`w-11 h-11 shrink-0 rounded-xl border flex items-center justify-center ${
          mode === 'wrong'
            ? 'border-amber-400/25 bg-amber-500/20'
            : 'border-cc-border bg-cc-accent/25'
        }`}
      >
        {busy ? (
          <i
            className={`fas fa-circle-notch fa-spin ${
              mode === 'wrong' ? 'text-amber-400' : 'text-cc-accent'
            }`}
          />
        ) : mode === 'wrong' ? (
          <i className="fas fa-circle-xmark text-lg text-amber-400" aria-hidden />
        ) : (
          <i className="fas fa-heart text-cc-accent" aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-cc-fg leading-snug">{rowTitle(mode, count)}</p>
        {subtitle.layout === 'single' ? (
          <p className="text-cc-muted text-[13px] leading-snug mt-1">{subtitle.text}</p>
        ) : (
          <div className="mt-1 space-y-0.5">
            <p className="text-cc-muted text-[13px] leading-snug">{subtitle.primary}</p>
            <p className="text-cc-muted text-[13px] leading-snug">{subtitle.secondary}</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
