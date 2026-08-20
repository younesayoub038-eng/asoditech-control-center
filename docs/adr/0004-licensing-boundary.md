# ADR 0004 — Instance ↔ Control Center licensing boundary

## Status
Accepted (2026-08-20)

## Context
The Control Center must eventually let a deployed product `Instance` ask
"am I allowed to operate?" This is the first implementation of that
boundary — the brief is explicit that it must not be a naive
`return true` endpoint, but also that a full distributed licensing platform
would be over-engineering for this phase.

## Decision

### Credential model
Each `Instance` gets one opaque bearer secret (`src/lib/license/key.ts`):
`lic_` + 24 random bytes (base64url). Only its SHA-256 hash is stored
(`Instance.licenseKeyHash`, unique-indexed); a short, non-secret
`licenseKeyPrefix` is stored alongside it purely so support staff can
identify a key in logs/tickets without ever seeing the secret again. The
raw secret is returned to the operator exactly once, at creation or
rotation time (`createInstanceAction`, `rotateInstanceLicenseKeyAction`),
and is never logged.

### Endpoint
`POST /api/v1/license/verify`, `Authorization: Bearer <raw key>`
(`src/app/api/v1/license/verify/route.ts` → `src/lib/license/verify.ts`):
1. Rate-limited per source IP (`src/lib/license/rateLimit.ts`) before any
   database lookup, to blunt brute-force enumeration.
2. Looks the instance up by the hash of the presented token (O(1), via the
   unique index — no need to encode an instance ID in the token itself).
3. Returns `allowed: true` only when `Instance.status === "ACTIVE"`.
   `PROVISIONING`, `SUSPENDED`, `DECOMMISSIONED`, and "no matching key" all
   return `allowed: false`; the HTTP status and body deliberately don't
   distinguish "key doesn't exist" from "key is malformed" from each other,
   to avoid helping an attacker enumerate valid instances.
4. Every attempt — success or failure — is written to `AuditEvent` with
   `actorType: "INSTANCE"`, never including the secret itself.
5. On success, `Instance.licenseKeyLastVerifiedAt` is updated, giving
   operators visibility into which instances are actively checking in.

### What the response gives the instance
`cacheTtlSeconds` (1 hour) and `gracePeriodHours` (24 hours) are returned as
*guidance* — how long the instance should trust a cached `ACTIVE` result
before re-checking, and how long it may keep operating on that cached result
if the Control Center becomes briefly unreachable. Enforcing the grace
period is the instance's responsibility, not the Control Center's; the
Control Center only needs to state the policy.

## Explicitly deferred
- **Replay protection beyond TLS + rate limiting + rotation.** A verification
  request is a read-only, idempotent question ("am I allowed to run?"); a
  replayed request produces the same true answer it would today. Full
  nonce/HMAC-signed-timestamp replay resistance is deferred until there's a
  concrete threat model that requires it — see project brief §4G, which
  asks for a secure *extensible* foundation, not a complete distributed
  licensing platform.
- **Multi-instance-server rate limiting.** `checkRateLimit()` is
  process-local (an in-memory `Map`). If the Control Center is ever
  horizontally scaled, this must move to a shared store (Redis or similar)
  — noted directly in `src/lib/license/rateLimit.ts`.
- **Key rotation reminders / expiry.** Keys don't currently expire on a
  schedule; rotation is manual, operator-triggered
  (`rotateInstanceLicenseKeyAction`). Scheduled rotation policy is a future
  phase.
