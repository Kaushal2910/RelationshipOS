# P5_STATUS.md — Calendar & Memories

**Status:** Completed & verified on-device.

## Done
- Built monthly calendar grid and agenda list (`app/(tabs)/calendar.tsx`).
- Implemented calendar plan creation with strict validation (`app/(tabs)/calendar/create-item.tsx` - blocks invalid dates/times like 2:70 or 2026-12-40).
- Built memory logger with image picking and strict date validation (`app/(tabs)/memory/log.tsx` - blocks future date entries).
- Created private `memory-media` storage bucket and configured RLS policy to authorize uploads/downloads for coupled users.
- Fixed binary upload crash using native `XMLHttpRequest` blob conversion in `lib/storage.ts`.
- Refined calendar UI: pinned grid on top, scrollable agenda list below, and removed redundant pink floating action buttons.
- Highlight indicators: Dates with logged memories styled with a soft rose background halo (`bg-primary-soft`); plans show as bottom dots.

## Verified
- End-to-end plan creation and monthly calendar indicator rendering.
- Memory creation with native image picking, local blob conversion, and private bucket upload.
- Multi-state rendering (content, empty, loading, error) and dark mode styling.
