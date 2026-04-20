import type { NavigateFunction } from 'react-router-dom';

const DEFAULT_FALLBACK = '/menu';

/**
 * Matches React Router’s history `idx`: go back when there is a prior in-app entry,
 * otherwise navigate to fallback (e.g. first open / deep link).
 */
export function goBackOrMenu(
  navigate: NavigateFunction,
  fallback: string = DEFAULT_FALLBACK,
): void {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
