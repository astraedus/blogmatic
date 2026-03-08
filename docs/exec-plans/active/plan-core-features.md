# Plan: Core User-Facing Features

## Goal
Build generate page, posts API, dashboard update, and post viewer page.

## Steps
- [x] Read playbook + existing codebase
- [x] Create `/api/posts/route.ts` (GET + POST)
- [x] Create `/api/posts/[id]/route.ts` (GET + DELETE)
- [x] Create `/dashboard/generate/page.tsx` (form + result display)
- [x] Dashboard page already done — verified, no changes needed
- [x] Create `/dashboard/posts/[id]/page.tsx` (post viewer) + PostActions.tsx
- [x] Run `npm run build` — zero errors, all routes built successfully

## Decisions made
- Use `marked` or manual markdown rendering. No new deps — use a simple regex-based approach to avoid adding packages.
- Actually lucide-react is available — use for icons.
- Dashboard page is already implemented and looks complete.
- For markdown rendering, parse client-side with a simple approach since `content` may be large.
