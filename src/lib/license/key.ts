import "server-only";

import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "lic_";
const DISPLAY_PREFIX_LENGTH = 12; // "lic_" + 8 chars, enough to identify a key in support tickets/logs

export interface GeneratedLicenseKey {
  /** Shown to the operator exactly once. Never persisted. */
  raw: string;
  /** SHA-256 hex digest — what actually gets stored and compared. */
  hash: string;
  /** Short, non-secret prefix stored alongside the hash for human identification. */
  displayPrefix: string;
}

export function generateLicenseKey(): GeneratedLicenseKey {
  const raw = KEY_PREFIX + randomBytes(24).toString("base64url");
  return {
    raw,
    hash: hashLicenseKey(raw),
    displayPrefix: raw.slice(0, DISPLAY_PREFIX_LENGTH),
  };
}

export function hashLicenseKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
