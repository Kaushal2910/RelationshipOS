# P1 STATUS — Auth & Onboarding (in progress, handoff)

> Read `CLAUDE.md` + `P0_STATUS.md` (still valid: EAS dev build, Discover half-rendered,
> no nav bar) + THIS file. Then continue. App: `C:\Projects\RelationOS\version1\app-relationos\`.

## Decision locked this session
**Auth = email + password with email verification** (Supabase native, free).
NOT phone/SMS OTP (that needs a paid provider — rejected). Email-verify link/code only.

## ✅ DONE (files written — but NOT yet typechecked; see ⚠️)
1. `supabase/migrations/0002_profiles.sql` — `profiles` table (id=auth.uid, display_name,
   avatar_url, city default 'Pune', onboarded_at), RLS (own-row read/update, no client insert),
   + trigger `on_auth_user_created` that auto-creates a profile row from user_metadata.display_name.
   **User must run this in Supabase SQL Editor** (after 0001).
2. `lib/database.types.ts` — added `ProfileRow` + `profiles` table entry.
3. `lib/validation/auth.ts` — Zod: `signInSchema`, `signUpSchema`, `profileSchema` (+ types).
4. `types/profile.ts` — `Profile` type + `isOnboarded()` helper.
5. `lib/auth.ts` — `signUpWithEmail` (returns `needsEmailVerification`), `signInWithEmail`,
   `signOut`, `resendVerificationEmail`, `authErrorMessage()`.

## ❌ NOT DONE (continue here, in this order)
6. `lib/queries/useProfile.ts` — TanStack query: fetch `profiles` row for current user id.
   Also add a `useUpdateProfile` mutation that sets display_name/city/onboarded_at (used to
   finish onboarding). Pattern: copy `lib/queries/usePlaces.ts`.
7. **Rewrite `stores/session.ts`** — currently the P0 stub (session only). Make it hold
   `{ session, profile, isBootstrapping }` + setters. (Or keep session in store, profile via
   useProfile query — either is fine; pick one and be consistent.)
8. `components/ui/TextField.tsx` + `components/ui/Button.tsx` — token classes only, 44pt targets,
   a11y. TextField: label + error text + secureTextEntry. Button: primary/secondary/ghost + loading.
   Match style of existing `components/ui/EmptyState.tsx` (uses `useTheme()`, `bg-primary`, etc.).
9. Screens (expo-router groups):
   - `app/(auth)/_layout.tsx` (Stack), `welcome.tsx`, `sign-in.tsx`, `sign-up.tsx`.
   - `app/(onboarding)/_layout.tsx`, `profile.tsx` (display_name + city → useUpdateProfile → sets
     onboarded_at).
   - Use RHF + `@hookform/resolvers/zod` + the schemas in `lib/validation/auth.ts`.
   - After sign-up show "Check your email to verify" state + a Resend button (`resendVerificationEmail`).
10. **Tab shell (ALSO FIXES P0's missing nav bar):** `app/(tabs)/_layout.tsx` = Tabs with
    Discover / Wishlist / Calendar / Profile (lucide icons, token colors). **Move** current
    `app/index.tsx` (Discover) → `app/(tabs)/index.tsx`. Stub the other 3 tab screens.
11. **Rewrite root `app/_layout.tsx`** (currently only providers+fonts): add a session bootstrap
    (`supabase.auth.getSession()` on mount + `supabase.auth.onAuthStateChange` → update store),
    and a **route guard** using `useSegments()` + `router.replace`: no session → `(auth)`;
    session but `!isOnboarded` → `(onboarding)`; else → `(tabs)`. Keep splash held until bootstrap done.
12. `npx tsc --noEmit` → green. Then EAS dev build / `expo start --dev-client`, test sign-up →
    verify email → sign-in → onboarding → land on Discover tab with a bottom nav bar.

## ⚠️ Gotchas / cleanup for next session
- **NEW P1 files are UNVERIFIED — `npx tsc --noEmit` was NOT run after writing them.** Run it early.
  They're dormant (nothing imports them yet) so the app still builds/runs as in P0.
- **Stray file:** a placeholder `auth.ts` was accidentally written to a bad path (`C:\Users\..\lib`
  → resolves to `C:\lib\auth.ts`). Attempted delete; **verify `C:\lib\` is gone** (harmless, outside
  repo, but delete if present). The REAL file is `version1/app-relationos/lib/auth.ts` (correct).
- May need `npx expo install @hookform/resolvers` if not already in package.json (RHF is; check resolver).
- Supabase: **turn ON "Confirm email"** in Auth settings (Dashboard → Auth → Providers → Email) so
  verification actually fires. Free.
- Demo/placeholder data must use **Indian names** (Kaushal, Priya — NOT Alex/Jordan). App is Pune-first.
- Images (avatars/place covers) are **URL-based, never hardcoded** — keep it that way (avatar_url is a URL).
- Still on P0 debt: Discover renders half + needs the nav shell (step 10 fixes nav). Layout polish TBD.
