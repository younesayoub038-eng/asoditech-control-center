# ASODITECH Control Center

Internal platform for managing ASODITECH's clients, products, deployed
instances, subscriptions, payments, and instance licensing.

See `docs/adr/` for the architecture decisions behind this codebase —
read those before making framework, auth, schema, or licensing changes.

## Stack

Next.js 16 (App Router) · TypeScript · PostgreSQL · Prisma 6 · Tailwind CSS v4
+ shadcn/ui (`@base-ui/react`) · Zod v4 · Vitest.

Next.js 16 and this shadcn style changed several conventions since most
training data was written (`middleware.ts` → `proxy.ts`, fully-async
`params`/`cookies()`/`headers()`, `Select` needs an explicit label formatter
rather than deriving it from `SelectItem` children — see
`src/components/ui/select.tsx`). `AGENTS.md` points at the bundled Next.js
docs in `node_modules/next/dist/docs/`.

## Prerequisites

- Node.js 20.9+ (developed against Node 24)
- pnpm
- A local PostgreSQL server. This environment has no Docker; Postgres runs
  directly via Homebrew:

  ```bash
  brew install postgresql@16
  /usr/local/opt/postgresql@16/bin/pg_ctl -D /usr/local/var/postgresql@16 \
    -l /usr/local/var/postgresql@16/server.log start
  createdb asoditech_control_center
  createdb asoditech_control_center_test
  ```

## Setup

```bash
pnpm install
cp .env.example .env      # then fill in DATABASE_URL / AUTH_SECRET
npx prisma migrate deploy # applies prisma/migrations against DATABASE_URL
pnpm db:seed               # creates the initial OWNER account (see below)
pnpm dev
```

`pnpm db:seed` only creates one `User` row (role `OWNER`) — it does **not**
create any clients, products, instances, or other business data. An empty
dashboard after seeding is correct, not a bug (see project brief on honest
empty states). Override the seeded credentials with `SEED_OWNER_EMAIL` /
`SEED_OWNER_PASSWORD`; without them it uses
`owner@asoditech.local` / `change-me-immediately` and prints a reminder to
change the password.

## Testing

Tests run against a **separate** database (`asoditech_control_center_test`
by default, configured in `.env.test`) so `pnpm test` can freely wipe tables
between test cases. `tests/helpers/db.ts` refuses to run if `DATABASE_URL`
doesn't look like a test database — never point `.env.test` at real data.

```bash
npx prisma migrate deploy   # first time, against the test database — see
                              # .env.test's DATABASE_URL
pnpm test                    # run once
pnpm test:watch               # watch mode
```

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest, against `.env.test`'s database |
| `pnpm db:seed` | Create the initial OWNER account |

## Licensing API

`POST /api/v1/license/verify` is the boundary a deployed product instance
uses to check whether it's allowed to operate. See
`docs/adr/0004-licensing-boundary.md` for the credential model, rate
limiting, and what's deliberately out of scope for this phase.
