# ADR 0002 — Domain model: Client, Product, Instance, Subscription, Payment

## Status
Accepted (2026-08-20)

## Context
ASODITECH will sell more than one product to more than one client over the
life of this platform. The first product is an E-commerce Management
System, but the schema must not encode assumptions specific to it.

## Decision

### Entity boundaries
- **Client** — the paying business. Independent of any product.
- **Product** — an ASODITECH-built system (e.g. "Gestion E-commerce").
  Generic: `name`, `slug`, `description`, `status`, `currentVersion`. No
  product-specific fields live here or anywhere in this schema.
- **Instance** — one deployed installation of a `Product` for a `Client`.
  This is the join point between the two, and the entity that authenticates
  against the licensing endpoint (ADR 0004). A client with two products has
  two `Instance` rows; a client needing separate staging/production
  deployments of the same product also just gets two `Instance` rows rather
  than an `environment` enum bolted onto one row — simpler, and it reuses
  the same status/licensing machinery instead of adding a second axis.
- **Subscription** — the commercial relationship funding one `Instance`.
  Deliberately requires both `clientId` and `instanceId` (not just one)
  so a query never has to join through `Instance` to know who's paying.
- **Payment** — a financial record. `clientId` is required;
  `subscriptionId` is optional so one-off charges (e.g. a setup fee) can be
  recorded without inventing a fake subscription for them.
- **AuditEvent** — append-only, generic (`actorType` / `action` /
  `entityType` / `entityId` / `metadata` JSON) rather than one table per
  entity kind, so adding a new auditable action never requires a migration.

No `WooCommerceClient`, `ShopifyClient`, or `EcommerceSubscription`-style
types exist anywhere — the E-commerce Management System is just "a Product"
to this schema.

### Status models
Each status is a Postgres enum (not a free string) with an explicit,
code-enforced transition table rather than allowing arbitrary writes:

- `ClientStatus`: `ACTIVE | INACTIVE` — archival, not deletion.
- `ProductStatus`: `ACTIVE | DEPRECATED | ARCHIVED`.
- `InstanceStatus`: `PROVISIONING → ACTIVE ⇄ SUSPENDED → DECOMMISSIONED`
  (`DECOMMISSIONED` is terminal). See
  `src/lib/validation/instance.ts:INSTANCE_STATUS_TRANSITIONS`.
- `SubscriptionStatus`: `ACTIVE ⇄ PAST_DUE ⇄ SUSPENDED → CANCELLED`
  (`CANCELLED` is terminal). See
  `src/lib/validation/subscription.ts:SUBSCRIPTION_STATUS_TRANSITIONS`.
- `PaymentStatus`: `PENDING | SUCCEEDED | FAILED | REFUNDED`.

Transitions are validated server-side in the relevant Server Action, not
just constrained in the UI.

### Deletion policy
No hard deletes are exposed for `Client`, `Instance`, `Subscription`, or
`Payment` from the application layer. Client/product/instance archival is
status-based (`INACTIVE` / `DECOMMISSIONED` / etc.). Foreign keys from
`Instance`/`Subscription`/`Payment` back to `Client`/`Product`/`Instance` use
`onDelete: Restrict` so the database itself refuses to cascade-delete
financial or licensing history. `AuditEvent` rows are never updated or
deleted by application code (`src/lib/audit.ts` is the only writer, and it
only ever creates).

### Currency
`currency` is a validated 3-letter string (ISO 4217), not a Postgres enum —
unlike statuses, the set of currencies ASODITECH might invoice in isn't a
closed set worth a migration to extend. Money amounts use
`Decimal(12,2)`, never floating point.

## Deferred (explicitly, not silently)
- **Automated billing enforcement** (e.g. auto-suspending an `Instance` when
  its `Subscription` goes `PAST_DUE`) is *not* implemented. The status model
  and transition machinery exist; wiring a grace-period policy to them is a
  future phase, per the project brief's explicit instruction not to build
  aggressive automatic suspension without a defined policy.
- **Client-facing multi-tenancy** (client-scoped login/portal) does not
  exist yet — every authenticated user in this phase is ASODITECH staff with
  full access. `docs/adr/0003-auth-and-sessions.md` covers current auth
  scope.
- Per-role authorization beyond `OWNER`/`ADMIN` is not enforced yet; the
  `UserRole` enum exists so it can be added without a schema change, but no
  code branches on it today.
