# P4 STATUS — Place Detail & Seeding (Done & Verified)

> App: `C:\Projects\RelationOS\version1\app-relationos\`. Read `CLAUDE.md` + this file only.
> P0 + P1 + P2 + P3 + P4 are done. `npx tsc --noEmit` = **green**.

## ✅ DONE & VERIFIED ON DEVICE

### Detail Screen Overhaul (`app/(tabs)/place-detail/[id].tsx`)
- **Spacing & Padding**: Content uses `px-lg` (20px) so text doesn't hug screen edges. 24px vertical gap between sections using `style={{ gap: 24 }}`. Timings/Address list items use `p-lg` and `rounded-2xl` for breathing room.
- **Bare Text & Crashes**: Replaced `{price && <View/>}` evaluated string crashes with `{price ? <View/> : null}`. Wrapped chips text in `<Text>` components inside `<View>` tags. Removed dead layout class names (`text-primary`, `font-label`) from layout containers.
- **Gallery Swiper**: Horizontal ScrollView container style is set to `width: screenWidth * images.length` via `useWindowDimensions`. Each image gets an explicit width match. Dots update correctly on scroll.
- **Header Info & Metadata**: Rating average and price render properly without clipping.
- **Timings / Address Stack**: Side-by-side flexbox wrapping replaced with a vertical stacked list of full-width cards. Address card click opens maps. Directions secondary buttons removed from the bottom bar.
- **Sticky Bottom Action Bar**: Redesigned to a single row containing `Book` (small button on the left) and `Save to Calendar` (primary CTA filling remaining width, calendar icon removed). Proper safe area padding bottom (`insets.bottom + 8`) and top (`12px`) applied.

### Swipe Card Tap & Detail Navigation
- **SwipeableCard.tsx**: Removed tap gesture and simultaneous gesture handling to prevent accidental detail triggers while swiping.
- **PlaceCard.tsx**: Added `onInfoPress` to `PlaceCardBody`. Renders a small transparent circle `(i)` button absolute positioned top-right with `lucide` Info icon.
- **DeckStack.tsx**: Forwards `onInfoPress` on the active card to router navigation. Tap on background card is ignored.
- **Wishlist screen**: FlatList rows navigate to details on click. Empty state Action goes to discovery.

### Server Deck Query & Database RPC (`0005_deck_rpc.sql` & `useDeck.ts`)
- Database contains `get_deck_for_user(p_user_id)` RPC function. Excludes swiped items, handles optional vibe, city, and cost limits.
- Client React Query is updated to execute the RPC function. Filters work.
- Seed data loaded and active.

## ❌ NOT DONE — needs USER

1. **Two-phone match test**: both paired devices → Device A swipes right on a place → Device B swipes right on **same** place → **match overlay should appear on BOTH** (Realtime). This is the last remaining verification check.
2. **Dark mode**: toggle OS setting → all new screens render dark tokens.
3. **Solo mode**: unpaired user swipes → no crash.
4. **Error paths**: airplane mode → swipe should not crash.

## File change summary

| Action | File |
|---|---|
| REWRITE | `app/(tabs)/place-detail/[id].tsx` — layout/spacing/gallery/bottom bar overhaul |
| MODIFY | `components/discovery/PlaceCard.tsx` — split PlaceCardBody + onInfoPress + info button |
| MODIFY | `components/discovery/SwipeableCard.tsx` — removed tap gesture, added onInfoPress |
| MODIFY | `components/discovery/DeckStack.tsx` — onTap → onInfoPress |
| MODIFY | `app/(tabs)/wishlist.tsx` — wired navigation to detail screen |
