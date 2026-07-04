import type { PlaceRow } from '../lib/database.types';

/** Domain type used across the app. For P0 it maps 1:1 to the DB row. */
export type Place = PlaceRow;

/** Format a 1–4 price_level as ₹ symbols (Backend_Schema §4.4). */
export function priceLevelToRupees(level: number | null): string {
  if (!level || level < 1) return '';
  return '₹'.repeat(Math.min(level, 4));
}
