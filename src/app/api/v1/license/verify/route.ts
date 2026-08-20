import { NextResponse } from "next/server";
import { verifyInstanceLicense } from "@/lib/license/verify";
import { checkRateLimit, maybeSweepRateLimitBuckets } from "@/lib/license/rateLimit";

export const runtime = "nodejs";

/**
 * Authentication boundary between an ASODITECH product instance and the
 * Control Center (see docs/adr/0004-licensing-boundary.md).
 *
 * Request:  Authorization: Bearer <instance license key>
 * Response: 200 with verdict JSON on success or a denied verdict; 401 for a
 *           malformed/missing header; 429 when rate-limited.
 *
 * The verdict body intentionally never reveals *why* a key was denied
 * beyond the instance's own status (no distinction is made between "key
 * does not exist" and "key is malformed" in the HTTP status, to avoid
 * helping an attacker enumerate valid instances).
 */
export async function POST(request: Request) {
  maybeSweepRateLimitBuckets();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = checkRateLimit(`ip:${ip}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds ?? 60) } }
    );
  }

  const authHeader = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(\S+)$/.exec(authHeader);
  if (!match) {
    return NextResponse.json({ error: "Authentification manquante ou invalide." }, { status: 401 });
  }
  const rawToken = match[1];

  try {
    const result = await verifyInstanceLicense(rawToken);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[license.verify] unexpected error", error);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
