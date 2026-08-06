import { describe, expect, it } from "vitest";
import { decryptJson, encryptJson } from "./crypto";

describe("encrypted backup", () => {
  it("round-trips JSON with AES-GCM", async () => {
    const source = { balance: 42.5, private: true, nested: ["safe"] };
    const envelope = await encryptJson(source, "correct horse battery staple");

    expect(envelope.format).toBe("wealthdock-encrypted-v1");
    expect(envelope.ciphertext).not.toContain("balance");
    await expect(
      decryptJson(envelope, "correct horse battery staple"),
    ).resolves.toEqual(source);
  });

  it("rejects a wrong passphrase", async () => {
    const envelope = await encryptJson(
      { balance: 42 },
      "correct horse battery staple",
    );
    await expect(
      decryptJson(envelope, "this password is wrong"),
    ).rejects.toThrow("Unable to decrypt");
  });

  it("rejects short passphrases", async () => {
    await expect(encryptJson({}, "short")).rejects.toThrow("at least 10");
  });
});
