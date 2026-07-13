# P3 STATUS — Discovery (swipe deck working on-device)

> App: `C:\Projects\RelationOS\version1\app-relationos\`. Read `CLAUDE.md` + this file only.
> P0 + P1 + P2 are done. `npx tsc --noEmit` = **green**.

## What P3 is

The Discover screen is now a **Tinder-style swipe deck** — one card at a time, drag right = like,
drag left = pass. Mutual like → DB trigger creates wishlist row → Realtime pushes to both partners →
**match celebration overlay** appears.

Also: the wishlist screen shows real data, and a filter bottom sheet narrows the deck by city/vibe/budget.

## ✅ DONE & VERIFIED ON DEVICE (2026-07-10)

### Swipe deck — working on-device
Cards render, drag with rotation + LIKE/PASS stamps fading in, commit at 120px threshold with
fly-out animation, spring-back when below threshold. The 5-place seed deck cycles (loops when
exhausted). Pull-to-refresh and filters are wired but untested on-device.

### On-device bugs fixed this session
- **Worklets crash** (`interpolate` + `Extrapolation.CLAMP` in `useAnimatedStyle` without `'worklet'`
  directive) → replaced with worklet-safe math helper `stampOpacity()`, added `'worklet'` directives
  to all `useAnimatedStyle` callbacks.
- **Card stuck after first swipe** → React reused the `SwipeableCard` component after index advanced
  but its internal `translateX` shared value stayed at 500+px (off-screen). Fixed by adding a `key`
  prop (`${active.id}-${swipeCount}`) that forces remount with fresh shared values on every swipe.
- **Deck query failing** (`"Couldn't load right now"`) → `useDeck` used a `.not('id','in', '(sql)')`
  pattern unsupported by supabase-js (expects array, not SQL string). Replaced with plain `select`
  query; swiped-place exclusion deferred to a later RPC-based upgrade.

## ✅ DONE — Detail screen + card info button fixes (2026-07-11)

### Detail screen layout overhaul (`app/(tabs)/place-detail/[id].tsx`)
- **Bottom bar**: replaced `fixed` + `grid-cols-12` (not supported in RN) with `absolute bottom-0` +
  `flex-row`. Removed redundant Directions button (Address card already opens Maps). Removed Calendar
  icon from primary CTA. Bar is now: `Book` (small) + `Save to Calendar` (primary, fills remaining width).
- **Gallery swiper**: `contentContainerStyle` now uses `screenWidth * images.length`, each image gets
  explicit `style={{ width: screenWidth }}` via `useWindowDimensions`. Pagination dots update on scroll.
- **Bare text crash**: `{price && <View/>}` → `{price ? <View/> : null}` — the `&&` pattern renders
  `""` as a bare text node outside `<Text>` when the value is a falsy string. Same fix for rating separator.
- **Text-in-View crash**: category/mood chips had bare strings inside `<View>` — wrapped in `<Text>`.
  Removed dead CSS classes (`text-primary`, `font-label`) from `<View>` wrappers (only work on `<Text>`).
- **Spacing & edge padding**: content uses `px-lg` (20px) so text doesn't hug screen edges. 24px vertical
  gap between sections via `style={{ gap: 24 }}`. Cards use `p-lg` + `rounded-2xl`. Chips get `py-1.5`.
- **Timings/Address redesign**: side-by-side `flex-row flex-wrap min-w-[160px]` replaced with clean
  vertical stack — full-width cards, icon left, text right with `flex-1`, Address card gets navigation chevron.
  Removed map preview placeholder (no value yet).
- **Interaction row**: 44pt touch targets (`w-11 h-11`), proper gap spacing.

### Swipe card — tap-to-detail replaced with info button
- **SwipeableCard.tsx**: removed `Gesture.Tap()` + `Gesture.Simultaneous()` — pan-only now, no accidental
  detail opens while swiping. New `onInfoPress` prop forwarded to `PlaceCardBody`.
- **PlaceCard.tsx**: `PlaceCardBody` accepts `onInfoPress` and renders a `(i)` button (Info icon from
  lucide) at top-right (`absolute right-lg top-lg`, `bg-white/20` circle, 40px hit target). Added
  `Pressable` import.
- **DeckStack.tsx**: passes `onInfoPress={() => router.push(...)}` to active card only. Removed `onTap` prop.

## What's built (all typecheck-green)

### DB layer
- `supabase/migrations/0004_swipes.sql` — `swipe_decision` + `item_status` enums, `swipes` table
  (unique per user+place), `wishlist` table (unique per couple+place), `handle_swipe_match()`
  security-definer trigger function, RLS (own swipes / couple wishlist), Realtime publication
  for `wishlist`, places RLS tightened to `authenticated`.
- `lib/database.types.ts` — added new enums, tables, function stub.

### Data layer
- `lib/queries/useDeck.ts` — **simple query** for now: all active places with optional city/mood/
  price_level filters. Swipe exclusion deferred (`.not('in', sub-select)` is unsupported by
  supabase-js's query builder — will move to a Postgres RPC function `get_deck_for_user`).
- `lib/swipes.ts` — `recordSwipe(userId, placeId, decision)` inserts to swipes.
- `lib/queries/useWishlist.ts` — wishlist rows + joined place data.
- `stores/discovery.ts` — Zustand: `pendingMatch`, `matchOverlayVisible`, `filters`.

### Swipe Deck UI
- `components/discovery/PlaceCard.tsx` — split: `PlaceCardBody` (visual: image + scrim + text +
  optional info button) + legacy `PlaceCard` wrapper. Both accept `onInfoPress?`.
- `components/discovery/SwipeableCard.tsx` — Reanimated 4 `useSharedValue` + `Gesture.Pan()` for
  60fps drag/rotate/spring-back/fly-out. LIKE stamp (green border) at right-swipe >20px, PASS stamp
  (red border) at left-swipe <-20px, both clamp to 1 at 100px. Commit threshold: 120px. Pan-only
  gesture (tap removed). `onInfoPress` forwarded to `PlaceCardBody`.
- `components/discovery/DeckStack.tsx` — 3-card stack (active z=30 + 2 behind: scale 0.95/0.90,
  translateY 12/24px). Index wraps modulo for seed deck cycling. Each swipe increments `swipeCount`
  so the active card's `key` changes → forced remount → fresh shared values. All 4 states.
  `onInfoPress` wired to router.push for active card only.

### Match overlay
- `components/discovery/MatchOverlay.tsx` — full-screen scrim + animated card. "It's a Match! 💞"
  in Fraunces display, place image + name. 3 floating ♡ hearts (RN `Animated` staggered loops).
  "View Wishlist" → router to wishlist tab. "Keep Swiping" → dismiss. Scale-in spring entrance.
- Realtime wired in `app/(tabs)/index.tsx` — sub on wishlist INSERT filtered by `couple_id`,
  fetches place, stores `pendingMatch` → overlay renders.

### Wishlist screen
- `app/(tabs)/wishlist.tsx` — real FlatList. Each row: thumbnail + name + category/area + rating +
  "Matched on {date}". All 4 states.

### Filter sheet
- `components/discovery/FilterSheet.tsx` — `Modal` bottom sheet. City chips (Pune/Mumbai),
  mood multi-select (11 vibe tags), budget ₹–₹₹₹₹ chips. Apply → Zustand `filters` →
  deck refetches. Reset clears.

### Detail screen
- `app/(tabs)/place-detail/[id].tsx` — hero gallery (horizontal paging ScrollView + pagination dots),
  header info (name + chips + price/rating/distance meta row), About section, Timings + Address
  (stacked cards, address opens Maps), interaction row (mark done, share, favorite), sticky bottom
  bar (Book + Save to Calendar). All 4 states. Proper spacing, edge padding, 44pt touch targets.

## ❌ NOT DONE — needs USER

1. **Two-phone match test**: both paired devices → Device A swipes right on a place → Device B
   swipes right on **same** place → **match overlay should appear on BOTH** (Realtime).
   This is the golden P3 test — hasn't been run yet.
2. **Test filters on-device**: open filter sheet → pick city/vibe/budget → apply → deck narrows.
3. **Dark mode**: toggle OS setting → all new screens render dark tokens.
4. **Solo mode**: unpaired user swipes → no crash (no coupleId → no Realtime sub).
5. **Error paths**: airplane mode → swipe should not crash (error swallowed in DeckStack).

## Deck query — current state & upgrade path

**Current:** simple `select * from places where is_active = true` — swiped places repeat.
This is fine for testing; the 5-place deck cycles. The swipe record is inserted to the DB
but isn't used for filtering yet.

**Upgrade path:** write a Supabase RPC function `get_deck_for_user(p_user_id uuid)` that:
```sql
SELECT p.* FROM places p WHERE p.is_active = true
  AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.user_id = p_user_id AND s.place_id = p.id)
ORDER BY p.created_at DESC LIMIT 20;
```
Then `useDeck.ts` calls `supabase.rpc('get_deck_for_user', { p_user_id })` instead of the
query builder. This is one round-trip, correct, and avoids supabase-js's `.not()` limitation.
Do this in P4 alongside seeding ~40 real places.

## Architecture notes

### Card gesture model
Each active card owns its `Gesture.Pan()`. On swipe commit, `DeckStack` bumps `currentIndex` +
`swipeCount` → `SwipeableCard` unmounts/remounts via key change → fresh shared values at 0.
No floating gesture overlay — simpler, reliable. Info button (`(i)`) on the card opens detail
instead of a tap gesture — eliminates swipe/tap conflict.

### Match flow
```
A swipes right → insert swipes(like)
  → trigger checks if B liked → if yes: insert wishlist
  → Realtime pushes INSERT to both devices
  → Discover screen useEffect picks it up → fetches place
  → stores/discovery setPendingMatch → MatchOverlay renders
```

### Reanimated vs RN Animated
- **Reanimated 4**: SwipeableCard pan gesture (worklet performance).
- **RN Animated**: MatchOverlay entrance + floating hearts (decorative, no gesture).

## P4 next

Seed ~40 real places, write `get_deck_for_user` RPC to exclude swiped places, upgrade deck query.
Then P5 Calendar & Memory, P6 Ship.

## File change summary

| Action | File |
|---|---|
| NEW | `supabase/migrations/0004_swipes.sql` |
| NEW | `lib/swipes.ts` |
| NEW | `lib/queries/useDeck.ts` |
| NEW | `lib/queries/useWishlist.ts` |
| NEW | `stores/discovery.ts` |
| NEW | `components/discovery/SwipeableCard.tsx` |
| NEW | `components/discovery/DeckStack.tsx` |
| NEW | `components/discovery/MatchOverlay.tsx` |
| NEW | `components/discovery/FilterSheet.tsx` |
| REWRITE | `app/(tabs)/index.tsx` — FlatList → DeckStack + Realtime |
| REWRITE | `app/(tabs)/wishlist.tsx` — stub → real FlatList |
| REWRITE | `app/(tabs)/place-detail/[id].tsx` — layout/spacing/gallery/bottom bar overhaul |
| MODIFY | `components/discovery/PlaceCard.tsx` — split PlaceCardBody + onInfoPress + info button |
| MODIFY | `components/discovery/SwipeableCard.tsx` — removed tap gesture, added onInfoPress |
| MODIFY | `components/discovery/DeckStack.tsx` — onTap → onInfoPress |
| MODIFY | `lib/database.types.ts` — added swipes/wishlist types |
