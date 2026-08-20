# ADR 0003 — Staff authentication and session handling

## Status
Accepted (2026-08-20)

## Context
The project brief requires secure login/logout, protected routes, protected
server operations, and "appropriate password/session security according to
the selected stack." Next.js doesn't prescribe an auth solution. The
obvious default, Auth.js (`next-auth`) v5, is still published under the
`beta` npm dist-tag (`5.0.0-beta.32` at the time of writing), though its
peer dependencies do already declare Next.js 16 support.

## Decision
Implement authentication directly rather than depending on a beta-tagged
third-party library for the single most security-critical subsystem of an
internal admin platform managing client billing and licensing data:

- **Password hashing:** `bcryptjs`, cost factor 12
  (`src/lib/auth/password.ts`).
- **Sessions:** opaque, server-verified tokens, not JWTs.
  - `src/lib/auth/session.ts` generates a 256-bit random token
    (`crypto.randomBytes(32)`), stores only its HMAC-SHA256 hash (keyed by
    `AUTH_SECRET`) in the `sessions` table, and sets the raw token as an
    `httpOnly`, `secure` (in production), `sameSite=lax` cookie.
  - Every request that needs the current user re-verifies the token against
    the database (`getCurrentUser()`), checking expiry **and** that the
    owning `User.status` is still `ACTIVE`. A leaked database dump cannot be
    replayed as a valid cookie (only hashes are stored); a stolen cookie can
    be killed instantly by deleting its `Session` row — no waiting for JWT
    expiry, no deny-list needed.
  - Disabling a `User` (`status = DISABLED`) invalidates all of that user's
    sessions on their very next request, and `destroyAllSessionsForUser()`
    exists for immediate revocation.
  - Sessions last 30 days, sliding (refreshed at most once/day to avoid a
    database write on every request).
- **CSRF:** relies on Next.js Server Actions' built-in same-origin check
  (Origin header validation on the POST) rather than a separate CSRF token
  scheme. All mutations in this app go through Server Actions
  (`src/actions/*.ts`), not hand-written form-encoded API routes, so this
  protection applies uniformly.
- **Route protection is layered, not single-point:**
  1. `src/proxy.ts` — a cheap, cookie-*presence*-only redirect to avoid
     flashing protected UI. This is explicitly documented in the file as
     **not** the authorization boundary.
  2. `requireUser()` / `requireUserForAction()`
     (`src/lib/auth/guards.ts`) — the real, database-backed check, called at
     the top of every protected layout and every Server Action that
     mutates data.

## Consequences / scope
- Only one role tier is enforced today: any authenticated `User` (`OWNER` or
  `ADMIN`) has full access. `UserRole` exists in the schema for future
  differentiation but no authorization branches on it yet — this app has no
  client-facing users, only ASODITECH staff, so finer-grained RBAC would be
  speculative complexity at this stage.
- Revisit this ADR if/when Auth.js v5 reaches a stable release and a
  concrete need emerges (e.g. SSO, WebAuthn) that would be expensive to
  hand-roll — the session table design here doesn't block a future
  migration to an adapter-based library.
