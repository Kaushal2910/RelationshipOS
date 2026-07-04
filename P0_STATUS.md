# P0 STATUS — handoff for the next session

> Read THIS + root `CLAUDE.md` only. App lives at
> `C:\Projects\RelationOS\version1\app-relationos\`.

## Where we are (2026-07-04)
**Milestone: the app builds and launches on a physical Android phone via an EAS dev build,
and the Discover screen appears.** That proves the toolchain end-to-end. But the on-device
result is still rough — see "What was actually seen" below. Typecheck is green.

## ⚠️ What was actually seen on-device (be accurate — do NOT overclaim P0 done)
- **Only the Discover screen** rendered. No other screen exists yet or was reachable.
- **The Discover screen was only partially visible ("half")** — layout is cut off / cramped,
  not fully laid out. Needs layout work.
- **No bottom navigation bar** — so it's impossible to navigate to any other page. There is
  currently no tab bar / nav shell at all. (P0 only planned the Discover screen, but the missing
  nav shell means the app is not navigable — flag for P1.)
- Not confirmed whether the **5 seeded places render** (data pipe). Still to verify.

So P0 is **NOT formally "exit met" yet** — the app runs on-device (the hard part), but Discover
is half-rendered, there's no navigation, and the 5-places data render is unconfirmed.

## 🔑 The big learning this session — HOW TO RUN THE APP
**Expo Go does NOT work — the project is SDK 57 and the Play Store Expo Go is too old
("Project is incompatible with this version of Expo Go"). Do not fight this; Expo Go is
out for this project.** We run via an **EAS development build** instead:

- Built with: `eas build --profile development --platform android` → download APK → install on phone.
- EAS account: **@sonawanekaushal5**, project **app-relationos**,
  projectId `7995ab73-741d-4f1b-9c6d-2490057755d2` (already in `app.config.ts` → `extra.eas.projectId`).
- Day-to-day dev: `npx expo start --dev-client`, then open the installed **RelationshipOS**
  app on the phone (NOT Expo Go). `--clear` just clears Metro cache; both flags can combine.
- Alt path (not used): `npx expo run:android` (needs local Android Studio SDK + USB device).

## app.config.ts fixes made this session (SDK 57 breaking changes)
- Removed `newArchEnabled` — New Arch is default-on in SDK 57 / RN 0.86.
- Removed top-level `splash` key (gone in SDK 57) → moved into the **`expo-splash-screen` plugin**
  in the `plugins` array.
- Added `extra.eas.projectId` (dynamic config can't be auto-written by EAS).
- Installed `react-native-worklets` via `npx expo install` (reanimated 4 peer dep, flagged by expo-doctor).

## ⚠️ Likely blocker — Supabase creds in the EAS build
`.env` is **gitignored**, so `EXPO_PUBLIC_SUPABASE_URL/KEY` may **not** reach the EAS cloud build
→ Supabase queries fail and Discover shows no places. **If the 5 seeded cards don't render, set them
as EAS env vars:** `eas env:create --environment development --name EXPO_PUBLIC_SUPABASE_URL --value ...`
(and the KEY), then rebuild. (Locally with `expo start` the `.env` is read fine — this only bites cloud builds.)

## TODO (remaining — do in this order)
1. **Fix the Discover layout** so the full screen renders (not half) — cramped/cut-off layout in `app/index.tsx`.
2. **Add a bottom navigation shell** (expo-router tabs) so the app is navigable. (Was not built in P0.)
3. **Confirm the data pipe**: in Supabase SQL Editor run `supabase/migrations/0001_places.sql` then
   `supabase/seed/seed_5_places.sql`. Pull-to-refresh → **5 Pune places with photos = data pipe proven**.
   If empty → fix EAS creds (see above) and/or run the SQL.
4. **Ship P0**: `git add -A && git commit`. Update root `CLAUDE.md` changelog.
5. **Then P1 (Auth)** — root `CLAUDE.md §4` build order.

## Environment facts (don't re-derive)
- Expo **SDK 57**, RN 0.86, React 19.2, TS strict. Node 20.19.0, npm 10.8.2.
  ⚠️ babel-preset wants Node ≥20.19.4 — warning only; bump if Metro bundling fails.
- npm: `legacy-peer-deps` is in `.npmrc` — plain `npm i` is fine.
- NativeWind **v4.2.6** + Tailwind **v3.4.17** (NOT v4). Reanimated **4.5** (worklets; babel-preset-expo
  auto-adds the plugin — do NOT add it manually).
- Supabase: project ref `akryxhbedgyfvhqtlcgp`, creds in gitignored `.env`, surfaced via
  `app.config.ts` → `extra.supabaseUrl/supabaseKey`.
- Dark mode is OS-driven (`darkMode:'media'` + prefers-color-scheme in global.css) — no toggle/provider.

## What's built (files — reference only, don't re-read unless editing)
- Config: `babel.config.js`, `metro.config.js`, `global.css`, `tailwind.config.js`, `nativewind-env.d.ts`,
  `app.config.ts`, `theme/tokens.ts`, `theme/useTheme.ts`.
- Data: `lib/database.types.ts`, `lib/supabase.ts`, `lib/queryClient.ts`, `stores/session.ts`,
  `lib/queries/usePlaces.ts`, `types/place.ts`.
- UI: `components/ui/{Skeleton,EmptyState,ErrorState}.tsx`, `components/discovery/PlaceCard.tsx`,
  `app/_layout.tsx` (providers + fonts + splash hold), `app/index.tsx` (Discover, 4 states + pull-to-refresh).
  **No tab bar / nav shell built yet.**
- SQL: `supabase/migrations/0001_places.sql` (enums + places + place_images + indexes + RLS; **public
  read `using(true)` for P0** — tighten to `authenticated` in P1), `supabase/seed/seed_5_places.sql`
  (5 Pune spots, Unsplash covers).

## Gotchas — do NOT rediscover
- **Expo Go can't run this — use the EAS dev build** (top section). This is the #1 time-sink; don't retry Expo Go.
- Don't upgrade Tailwind to v4 (NativeWind v4 needs v3).
- Don't add a reanimated/worklets babel plugin manually.
- P0 = prove the pipe only. No auth/pairing/swipe/calendar/memory/dashboard.
