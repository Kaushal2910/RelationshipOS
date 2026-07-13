# P6_PLAN — Dashboard & Ship

**Goal:** Implement Home/Dashboard, complete final polish sweep, and package V1 build.

## Tasks

### 1. Tab Navigation Refactor
- [ ] Move current Discover screen from `app/(tabs)/index.tsx` to `app/(tabs)/discover.tsx`
- [ ] Update `app/(tabs)/_layout.tsx` to add Home (`index`) and Discover (`discover`) tabs

### 2. Dashboard Screen (`app/(tabs)/index.tsx`)
- [ ] Upcoming Date Widget: Fetches next planned calendar item.
- [ ] Latest Memory Widget: Fetches newest memory with photo thumbnail.
- [ ] Relationship Streak Widget: Shows days active/paired.
- [ ] Partner Status Widget: Shows pairing info.
- [ ] "Start Swiping" Action: Quick navigation button to Discover.
- [ ] Wire loading/empty/error states.

### 3. Polish & Accessibility Sweep
- [ ] Verification of 4 states (loading skeleton, empty illustration, error, content) on all screens.
- [ ] Light & Dark mode visual verification.
- [ ] Accessibility audit: 44pt touch targets minimum, appropriate labels.

### 4. EAS Build & Release
- [ ] Add final V1 assets (app icon, splash screen).
- [ ] Trigger EAS build for iOS and Android.
- [ ] Perform two-phone end-to-end user verification (pairing -> swiping -> match -> calendar -> memory log).
