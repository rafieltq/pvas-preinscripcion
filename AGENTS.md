# AGENTS.md

## Quick facts
- Single-package Next.js App Router app (no monorepo/workspaces).
- Package manager is `pnpm` (lockfile is `pnpm-lock.yaml`).
- Main user flow is `/` (multi-step pre-inscription form) and admin UI is under `/admin`.

## Verified commands
- Install deps: `pnpm install`
- Dev server: `pnpm dev`
- Lint: `pnpm lint`
- Production build: `pnpm build`
- Start prod server: `pnpm start`

## Important constraints and quirks
- `next.config.mjs` sets `typescript.ignoreBuildErrors = true`; `pnpm build` can succeed with TypeScript errors. Run `pnpm lint` (and optionally `npx tsc --noEmit`) before considering work complete.
- There is no `test` script and no CI workflow in this repo; do not assume automated tests exist.
- `scripts/setup-database.sql` is stale relative to runtime code. The app uses the schema expected by `scripts/setup-database.js` and `lib/db/service.ts` (tables: `courses`, `students`, `settings`; columns like `capacity`, `enrolled`, `active`).

## Runtime wiring (high-signal map)
- DB client: `lib/db/turso.ts` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
- Data access layer used by all API routes: `lib/db/service.ts`.
- API surface is in `app/api/**/route.ts` (students, courses, settings, dashboard).
- Public form state is client-side context in `lib/form-context.tsx`; submission posts to `POST /api/students` from `components/form/pre-inscription-form.tsx`.

## Known contract mismatches to watch before editing
- `app/admin/settings/page.tsx` submits `PUT /api/settings`, but `app/api/settings/route.ts` only implements `PATCH`.
- Settings keys differ across layers:
  - Seeded/DB-facing keys in `scripts/setup-database.js` + service are `inscription_*` and `contact_*`.
  - Admin UI type in `app/admin/settings/page.tsx` expects `enrollment_*` and `institution_*` keys.
- If touching settings, reconcile API method + key names first; otherwise settings changes will appear "saved" in UI logic but not persist correctly.

## Editing boundaries
- Treat `components/ui/*` as shared shadcn-style primitives; keep feature logic in `app/*`, `components/form/*`, or `lib/*`.
- Ignore `.next/` and `node_modules/` when searching or editing.
