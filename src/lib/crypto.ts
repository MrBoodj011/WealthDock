export interface EncryptedEnvelope {
  format: "wealthdock-encrypted-v1";
  kdf: "PBKDF2-SHA256";
  iterations: 310000;
  salt: string;
  iv: string;
  ciphertext: string;
  createdAt: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(value: Uint8Array): string {
  let binary = "";
  value.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: 310000 },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptJson(
  value: unknown,
  passphrase: string,
): Promise<EncryptedEnvelope> {
  if (passphrase.length < 10)
    throw new Error("Passphrase must contain at least 10 characters.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(JSON.stringify(value)),
  );
  return {
    format: "wealthdock-encrypted-v1",
    kdf: "PBKDF2-SHA256",
    iterations: 310000,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
    createdAt: new Date().toISOString(),
  };
}

export async function decryptJson<T>(
  envelope: EncryptedEnvelope,
  passphrase: string,
): Promise<T> {
  if (envelope.format !== "wealthdock-encrypted-v1")
    throw new Error("Unsupported backup format.");
  const salt = fromBase64(envelope.salt);
  const iv = fromBase64(envelope.iv);
  const key = await deriveKey(passphrase, salt);
  try {
    const cleartext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      fromBase64(envelope.ciphertext),
    );
    return JSON.parse(decoder.decode(cleartext)) as T;
  } catch {
    throw new Error("Unable to decrypt the vault. Check your passphrase.");
  }
}
