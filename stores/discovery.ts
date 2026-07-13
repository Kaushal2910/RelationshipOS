import { create } from 'zustand';
import type { Place } from '../types/place';

/**
 * Discovery session state (P3). Holds:
 * - pendingMatch: set by the Realtime wishlist subscription when a new mutual
 *   match is detected. The MatchOverlay reads from here, and clears on dismiss.
 * - filters: city / mood tags / max price_level applied to the deck query.
 */
interface DiscoveryState {
  /** A fresh match waiting to be celebrated (cleared on dismiss). */
  pendingMatch: { place: Place; coupleId: string } | null;
  matchOverlayVisible: boolean;

  /** Active deck filters (all optional — no filter = all places). */
  filters: {
    city?: string;
    moods?: string[];
    priceLevel?: number;
  };

  setPendingMatch: (match: { place: Place; coupleId: string }) => void;
  clearMatch: () => void;
  setFilters: (filters: DiscoveryState['filters']) => void;
  resetFilters: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>((set) => ({
  pendingMatch: null,
  matchOverlayVisible: false,

  filters: {},

  setPendingMatch: (match) => set({ pendingMatch: match, matchOverlayVisible: true }),
  clearMatch: () => set({ pendingMatch: null, matchOverlayVisible: false }),
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
}));