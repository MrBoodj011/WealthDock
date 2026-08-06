import { openDB } from "idb";
import type { WealthDockData } from "@/domain/types";
import { decryptJson, encryptJson, type EncryptedEnvelope } from "./crypto";

const DATABASE_NAME = "wealthdock";
const STORE_NAME = "vault";
const RECORD_KEY = "primary";

export type StoredVault =
  | { mode: "plain"; data: WealthDockData }
  | { mode: "encrypted"; envelope: EncryptedEnvelope };

async function database() {
  return openDB(DATABASE_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME);
    },
  });
}

export async function loadVault(): Promise<StoredVault | undefined> {
  return (await database()).get(STORE_NAME, RECORD_KEY);
}

export async function savePlainVault(data: WealthDockData): Promise<void> {
  await (await database()).put(STORE_NAME, { mode: "plain", data }, RECORD_KEY);
}

export async function saveEncryptedVault(
  data: WealthDockData,
  passphrase: string,
): Promise<void> {
  const envelope = await encryptJson(data, passphrase);
  await (
    await database()
  ).put(STORE_NAME, { mode: "encrypted", envelope }, RECORD_KEY);
}

export async function unlockVault(
  envelope: EncryptedEnvelope,
  passphrase: string,
): Promise<WealthDockData> {
  return decryptJson<WealthDockData>(envelope, passphrase);
}

export async function clearVault(): Promise<void> {
  await (await database()).delete(STORE_NAME, RECORD_KEY);
}
