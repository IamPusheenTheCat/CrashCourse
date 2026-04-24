import { create } from 'zustand';
import type { StatsSummary } from '../api/services';
import * as api from '../api/services';

interface ProfileData {
  summary: StatsSummary;
  mistakeBookTotal: number;
  favoriteListTotal: number;
}

interface ProfileState {
  /** Cached snapshot — survives navigation, shown immediately on re-entry */
  cached: ProfileData | null;
  /** True only on the very first load when there is no cached data yet */
  coldLoading: boolean;
  /** True while a background refresh is in-flight (UI can ignore this) */
  refreshing: boolean;
  error: string | null;
  /**
   * Fetch profile data.
   * If cached data exists, returns instantly and refreshes in the background.
   * If no cache, does a full blocking load (coldLoading = true).
   */
  load: () => Promise<void>;
  /** Clear all cached profile data (call on logout) */
  clear: () => void;
}

async function fetchProfileData(): Promise<ProfileData> {
  const [summary, mistakes, favorites] = await Promise.all([
    api.getStatsSummary(),
    api.getMistakeList(1, 1),
    api.getFavoriteList(1, 1),
  ]);
  return {
    summary,
    mistakeBookTotal: mistakes.total,
    favoriteListTotal: favorites.total,
  };
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  cached: null,
  coldLoading: false,
  refreshing: false,
  error: null,

  load: async () => {
    const { cached, refreshing } = get();

    if (refreshing) return;

    if (cached) {
      set({ refreshing: true, error: null });
      try {
        const data = await fetchProfileData();
        set({ cached: data, refreshing: false });
      } catch (e) {
        set({ refreshing: false, error: e instanceof Error ? e.message : 'Refresh failed' });
      }
      return;
    }

    set({ coldLoading: true, error: null });
    try {
      const data = await fetchProfileData();
      set({ cached: data, coldLoading: false });
    } catch (e) {
      set({ coldLoading: false, error: e instanceof Error ? e.message : 'Failed to load stats' });
    }
  },

  clear: () => set({ cached: null, coldLoading: false, refreshing: false, error: null }),
}));
