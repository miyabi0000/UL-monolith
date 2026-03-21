## Summary
- Remove `ZenGardenBackground` canvas layer from the app shell.
- Simplify root layout in `App.tsx` by removing extra stacking wrappers (`relative z-10`).

## Why
- Background rendering added visual noise and made UI readability inconsistent.
- Canvas layer increased complexity and potential rendering/performance risk.
- Current direction prioritizes stable, clean UI before introducing decorative effects.

## Changes
- Deleted: `client/components/ui/ZenGardenBackground.tsx`
- Updated: `client/components/App.tsx`
  - removed `ZenGardenBackground` import
  - removed `<ZenGardenBackground />`
  - flattened wrapper structure to a single `min-h-screen` container

## Impact
- No API/data model change.
- No route change.
- Improves maintainability and reduces UI side effects.

## Verification
- App renders without background canvas.
- Main header/page/modal layers still display correctly.
- No regression in interactions (theme toggle, routing, notifications).
