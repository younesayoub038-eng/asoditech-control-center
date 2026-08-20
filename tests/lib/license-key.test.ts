import { describe, expect, it } from "vitest";
import { generateLicenseKey, hashLicenseKey } from "@/lib/license/key";

describe("license key generation", () => {
  it("generates unique raw keys and matching hashes", () => {
    const a = generateLicenseKey();
    const b = generateLicenseKey();

    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
    expect(a.hash).toBe(hashLicenseKey(a.raw));
  });

  it("does not embed the raw secret in the stored hash", () => {
    const { raw, hash } = generateLicenseKey();
    expect(hash).not.toContain(raw);
  });

  it("prefix is a strict, non-secret-leaking prefix of the raw key", () => {
    const { raw, displayPrefix } = generateLicenseKey();
    expect(raw.startsWith(displayPrefix)).toBe(true);
    expect(displayPrefix.length).toBeLessThan(raw.length);
  });

  it("hashLicenseKey is deterministic", () => {
    const { raw } = generateLicenseKey();
    expect(hashLicenseKey(raw)).toBe(hashLicenseKey(raw));
  });
});
