# Plan: Detail screen layout fix + gallery swiper + card info button

## Problem Summary
1. **Detail screen overlapping** — bottom action bar overlaps content because `fixed` and `grid-cols-*` don't work in
 React Native (no CSS Grid support).
2. **Gallery images don't swipe** — `ScrollView pagingEnabled` not functional because content container width isn't s
et to `N * screenWidth`.
3. **Tap vs swipe conflict** — `Gesture.Simultaneous(pan, tap)` in SwipeableCard opens detail on any tap, making swip
ing frustrating. Instead, add a small info button on the card.

---

## Fix 1: Detail screen layout (overlapping)

**File: `app/(tabs)/place-detail/[id].tsx`**

### Changes:
- Replace the sticky bottom bar's `fixed` + `grid grid-cols-12 col-span-4 col-span-8` with a plain flex row layout at
 the bottom using absolute positioning.
- Wrap everything in a single `flex-1` View. The `ScrollView` gets `paddingBottom: 100` (space for the bottom bar). T
he bottom bar sits at `position: absolute, bottom: 0` covering `insets.bottom`.
- Replace the action bar structure:
  - Directions + Book buttons: `flex-row` with 2 equal buttons
  - Save to Calendar: full-width button bel
- Remove `text-on-primary` (doesn't exist in tokens — replace with `text-white` or `text-surface` inline color).

---

## Fix 2: Gallery swiper

**File: `app/(tabs)/place-detail/[id].tsx`**

### Changes:
- Import `Dimensions` from `react-native`
- Get `screenWidth = Dimensions.get('window').width`
- Set `contentContainerStyle={{ width: scre
- Each image container gets `style={{ width: screenWidth }}` explicitly
- On scroll, calculate `currentImageIndex` nWidth`

---

## Fix 3: Card info button (replace tap ges

**File: `components/discovery/SwipeableCard
**File: `components/discovery/PlaceCard.tsx`**

### Changes:
- **Remove** the `Gesture.Tap()` and `Gestuy the `panGesture`. This eliminates accidenta
l detail opens while swiping.
- **Remove** the `onTap` prop from `Swipeab
- **Remove** the `router.push` from `DeckStack.tsx`'s `SwipeableCard` (the `onTap` prop).

### Add info button to `PlaceCardBody`:
- Accept a new optional prop `onInfoPress?:
- When provided, render a small circular `(i)` icon button at the **top-right** of the card (absolute positioned, abo
ve the scrim overlay).
  - White circle with slight transparency (`bg-white/20`)
  - `Info` icon from lucide-react-native (s
  - `onPress` calls `onInfoPress`
- In `DeckStack.tsx`, pass `onInfoPress={() active card's `PlaceCardBody`.

---

## Files to modify
1. `app/(tabs)/place-detail/[id].tsx` — layout fix + gallery swiper fix
2. `components/discovery/SwipeableCard.tsx`
3. `components/discovery/PlaceCard.tsx` — add `onInfoPress` + info button
4. `components/discovery/DeckStack.tsx` — ress`

## Verification
1. `npx tsc --noEmit` — must be green
2. Detail screen: no overlapping; gallery iots updating
3. Discover: swiping cards doesn't accidentally open detail; info button opens detail
