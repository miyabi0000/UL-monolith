## Summary
- Add primary navigation tabs: `ALL` and `Packs` in app header.
- Introduce `Packs` list page (`/packs`) with card-based overview.
- Introduce public pack detail page (`/p/:packId`) for shared viewing.
- Add local storage based Pack model and CRUD/toggle hook (`usePacks`).

## Why
- Existing UI looked like a single list only.
- Users need explicit separation between full inventory (`ALL`) and trip-operation lists (`Packs`).
- Public shareable detail pages are required for profile/public-link direction.

## Main UI/UX
- Header now exposes clear top-level intent with `ALL | Packs` tabs.
- `Packs` page supports:
  - create pack (name/description)
  - pack cards with item count/weight/cost
  - edit items by checkbox
  - copy public link
- Public detail page focuses on readability and summary-first layout.

## Technical Notes
- Pack persistence is local storage MVP (`ul_packs_v1`) to avoid backend blocking.
- Existing inventory flow remains unchanged.
- Route additions are isolated to `App.tsx`.

## Follow-up
- Replace local storage with backend API.
- Add ownership/auth guard for pack mutation.
- Add profile page integration and publicly indexed user packs.
