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
- Ensure DB columns: `pnpm db:ensure-representatives`

## Important constraints and quirks
- `next.config.mjs` sets `typescript.ignoreBuildErrors = true`; `pnpm build` can succeed with TypeScript errors. Run `pnpm lint` (and optionally `npx tsc --noEmit`) before considering work complete.
- There is no `test` script and no CI workflow in this repo; do not assume automated tests exist.
- `scripts/setup-database.sql` is stale relative to runtime code. The app uses the schema expected by `scripts/setup-database.js` and `lib/db/service.ts` (tables: `courses`, `students`, `settings`, `users`; columns like `capacity`, `enrolled`, `active`).

## Runtime wiring (high-signal map)
- DB client: `lib/db/turso.ts` (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
- Data access layer used by all API routes: `lib/db/service.ts`.
- API surface is in `app/api/**/route.ts` (students, courses, settings, dashboard, auth).
- Public form state is client-side context in `lib/form-context.tsx`; submission posts to `POST /api/students` from `components/form/pre-inscription-form.tsx`.
- Admin auth: signed JWT in `admin_session` cookie via `lib/auth/session.ts`; middleware at `middleware.ts` protects `/admin/*` routes (except `/admin/login`).

## Settings key normalization (already handled)
- The API layer (`app/api/settings/route.ts`) normalizes between UI-facing keys (`enrollment_*`, `institution_*`) and DB-facing keys (`inscription_*`, `contact_*`).
- UI submits `enrollment_open`, `enrollment_start_date`, etc.; API stores as `inscription_open`, `inscription_start_date`, etc.
- Both GET and PATCH/PUT endpoints handle this translation automatically—no manual reconciliation needed.

## Admin authentication setup
Required environment variables:
```bash
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...
AUTH_SECRET=your-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=sha256:...
ADMIN_NAME=Administrator
```

Generate admin password hash:
```bash
node scripts/generate-admin-hash.js "your-admin-password"
```

Initialize/update database:
```bash
node scripts/setup-database.js
```

## Editing boundaries
- Treat `components/ui/*` as shared shadcn-style primitives; keep feature logic in `app/*`, `components/form/*`, or `lib/*`.
- Ignore `.next/` and `node_modules/` when searching or editing.

## Student validation rules
- Backend enforces at least one complete representative (father, mother, or guardian).
- A complete representative requires: first name, last name, and phone.
- Partial representatives are rejected with validation error.
