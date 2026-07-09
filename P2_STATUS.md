# P2 STATUS — Pairing (code-complete, UNTESTED on device)

> App: `C:\Projects\RelationOS\version1\app-relationos\`. Read `CLAUDE.md` + this file only.
> P0 + P1 are done (P1 was fully built despite P1_STATUS.md undersell). `npx tsc --noEmit` = **green**.

## What P2 is
One partner generates a 6-char invite code, the other enters it → they become an **active couple**.
Live "partner joined" via Supabase Realtime. **Solo mode**: pairing is skippable; app stays usable unpaired.

## ✅ DONE (written + typechecks green — but NOT run on device / against real DB)
- `supabase/migrations/0003_couples.sql` — `couple_status` enum, `couples` + `invite_codes` tables,
  `profiles.couple_id` + `profiles.pairing_skipped_at` columns, RLS, `current_couple_id()` helper +
  partner-visible profile SELECT policy, `redeem_invite_code(p_code)` **security-definer RPC**
  (checks: already_paired / invalid / already_used / expired / self_code), grants, and Realtime
  publication add for `couples`.
- `lib/pairing.ts` — `generateInviteCode(userId)` (inserts couple + code, retries once on collision),
  `redeemInviteCode(code)` (calls RPC), `skipPairing(userId)`, `pairingErrorMessage(err)`.
- `lib/database.types.ts` — added `CoupleRow`, `InviteCodeRow`, `couple_id`/`pairing_skipped_at` on
  `ProfileRow`, `couples`/`invite_codes` tables + `redeem_invite_code` fn + `couple_status` enum.
- `app/(pairing)/_layout.tsx` (Stack) + `app/(pairing)/index.tsx` — one screen, Invite/Enter segments.
  Invite: mints a code on mount, `Share.share` button, "Waiting for your partner…", inline Realtime
  subscription on the couple row → invalidates profile query on partner-join. Enter: TextField +
  `redeemInviteCode` + mapped error states. Skip: ghost "I'll do this later" → `skipPairing`.
- `app/_layout.tsx` — route guard extended: onboarded but `!couple_id && !pairing_skipped_at` →
  `(pairing)`; else tabs. Leaves `(pairing)` only once **actually paired** (so a skipped user can
  reopen it from Profile).
- `app/(tabs)/profile.tsx` — "Pair with your partner" button shown when `!profile.couple_id`.

## ⚠️ Two deliberate shortcuts (grep `ponytail:` — both intentional, not bugs)
1. `lib/pairing.ts` `redeemInviteCode`: call is `(supabase.rpc as any)(...)`. supabase-js's rpc
   generic won't infer args from the **hand-written** `database.types.ts` stub. Runtime is correct;
   returns `data as string`. Cast disappears when we swap in generated types (`supabase gen types`).
2. Invite code uses `Math.random` (readable alphabet, no 0/O/1/I). Fine for single-use, 7-day,
   RLS-guarded codes (31^6 ≈ 887M). Upgrade to `expo-crypto` only if abuse shows up.

## ❌ NOT DONE — do this next session (needs USER, Claude can't)
1. **Run `supabase/migrations/0003_couples.sql`** in Supabase SQL Editor (after 0001 + 0002).
   Then confirm Realtime is ON for `couples` (Dashboard → Database → Replication, or the migration's
   `alter publication` line already added it — verify it stuck).
2. **Two accounts on the EAS dev build** (`expo start --dev-client`) to test the loop:
   sign up A + B → both hit `(pairing)` → A "Invite partner" shows a code → B "Enter code" types it →
   **A's screen should auto-jump to tabs** (Realtime) and B lands in tabs too, both paired.
3. Test the error paths on the Enter tab: garbage code (invalid), A entering A's own code (self_code),
   re-entering a used code (already_used), a paired user trying again (already_paired). Expiry (7d)
   can't be tested live — verified by RPC inspection only.
4. Test **skip**: a 3rd account taps "I'll do this later" → lands in tabs solo → does NOT get
   redirected back to `(pairing)` on relaunch → the Profile "Pair with your partner" button reopens
   `(pairing)` and pairing still completes from there.

## Stale-types note (harmless)
`(pairing)` is a new route, so `.expo/types` doesn't know it until `expo start` regenerates. That's
why `app/_layout.tsx` + `app/(tabs)/profile.tsx` cast the `(pairing)` route/segment with
`as unknown as Href` / `(group as string)`. Casts become redundant after the first `expo start` but
stay harmless. (Same pattern the pre-existing `router.replace('/' as unknown as Href)` uses.)

## After P2 verifies → P3 Discovery (THE SPINE)
Swipe deck (Reanimated + gesture-handler), filters, `swipes` insert + match trigger, live wishlist +
match overlay. This is make-or-break; highest priority feature. Also still carrying P0 debt: Discover
screen renders "half" + layout polish (nav shell is now fixed by the P1 tab bar).
