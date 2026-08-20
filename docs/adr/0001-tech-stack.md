# ADR 0001 — Tech stack for the Control Center core

## Status
Accepted (2026-08-20)

## Context
The repository was empty. This is a greenfield, production-oriented internal
platform that must support multiple ASODITECH products and many clients for
years without a rewrite.

## Decision
- **Framework:** Next.js 16 (App Router), TypeScript, React 19.2. Chosen
  because it gives one deployable app for both the admin UI and the
  server-side API surface (Server Actions for mutations, Route Handlers for
  the external licensing endpoint), with first-class server rendering for an
  internal dashboard that doesn't need SPA-style client routing complexity.
  Next.js 16 changed several conventions from what most training data
  assumes — notably `middleware.ts` → `proxy.ts`, and fully-async
  `params`/`searchParams`/`cookies()`/`headers()`. `AGENTS.md` at the repo
  root points at the bundled docs in `node_modules/next/dist/docs/`; read
  those before changing framework-level code.
- **Database:** PostgreSQL. Relational integrity (foreign keys, unique
  constraints, enums) matters here — this is billing and licensing data, not
  a document store use case.
- **ORM:** Prisma, pinned to the **6.19.2** line rather than the newly
  released Prisma 7. Prisma 7 changed the client generator and config format
  in ways not yet reflected in common training data; Prisma 6 is mature,
  extremely well documented, and fully capable for this schema. Revisit once
  Prisma 7 has been out long enough to be a safe, well-understood upgrade.
- **Auth:** hand-rolled, database-backed sessions rather than Auth.js/NextAuth.
  See ADR 0003 for the full reasoning.
- **Validation:** Zod v4, used at every Server Action boundary and in
  `src/lib/env.ts` for startup environment validation.
- **UI:** Tailwind CSS v4 + shadcn/ui (the CLI's current `base-nova` style,
  built on `@base-ui/react` rather than Radix — this is what the shadcn CLI
  generated at the time of writing; don't hand-add `@radix-ui/*` packages,
  the installed components don't use them). `lucide-react` for icons.
- **Testing:** Vitest for unit and integration tests, run against a real
  local Postgres database (`asoditech_control_center_test`) rather than
  mocks — see `docs/adr` note in ADR 0002 on why business-rule tests hit a
  real database.
- **Password hashing:** `bcryptjs` (pure JS, no native build step, portable
  across deployment targets).

## Consequences
- No Docker is available in this environment; local Postgres runs via
  Homebrew (`postgresql@16`) directly. Document this clearly for other
  engineers — see README.md.
- Because Next 16 and Prisma are both recent majors, any future upgrade
  (Prisma 7, Next 17, etc.) should be treated as a deliberate, tested
  migration, not a routine `pnpm update`.
