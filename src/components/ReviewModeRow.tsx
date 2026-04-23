import type { KeyboardEvent } from 'react';
import { MISTAKE_LIST_RULE } from '../constants/reviewCopy';
import GlassCard from './GlassCard';

export type ReviewRowMode = 'wrong' | 'favorite';

function rowTitle(mode: ReviewRowMode, count: number | null): string {
  const n = count === null ? '…' : String(count);
  return mode === 'wrong' ? `Wrong answers (${n})` : `Saved questions (${n})`;
}

function rowSubtitle(mode: ReviewRowMode, count: number | null): { layout: 'single'; text: string } {
  if (mode === 'wrong') {
    return count === 0
      ? { layout: 'single', text: 'Nothing in your wrong-answers list' }
      : { layout: 'single', text: MISTAKE_LIST_RULE };
  }
  return count === 0
    ? { layout: 'single', text: 'No saved questions yet' }
    : { layout: 'single', text: 'Stays on your list until you remove them' };
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
            ? 'border-rose-400/25 bg-rose-500/20'
            : 'border-amber-400/25 bg-amber-500/20'
        }`}
      >
        {busy ? (
          <i
            className={`fas fa-circle-notch fa-spin ${
              mode === 'wrong' ? 'text-rose-400' : 'text-amber-400'
            }`}
          />
        ) : mode === 'wrong' ? (
          <i className="fas fa-square-xmark text-xl leading-none text-rose-400" aria-hidden />
        ) : (
          <i className="fas fa-bookmark text-amber-400" aria-hidden />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-cc-fg leading-snug">{rowTitle(mode, count)}</p>
        <p className="text-cc-muted text-[13px] leading-snug mt-1">{subtitle.text}</p>
      </div>
      {clickable && !busy ? (
        <i className="fas fa-chevron-right shrink-0 text-[11px] text-cc-muted/45" aria-hidden />
      ) : null}
    </GlassCard>
  );
}
