"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addMonths, addWeeks, addYears } from "date-fns";
import { starterData } from "@/domain/demo-data";
import { wealthDockDataSchema } from "@/domain/schema";
import type {
  Account,
  Budget,
  Currency,
  Debt,
  Goal,
  RecurringRule,
  Transaction,
  WealthDockData,
} from "@/domain/types";
import { createId } from "@/domain/types";
import {
  clearVault,
  loadVault,
  saveEncryptedVault,
  savePlainVault,
  unlockVault,
  type StoredVault,
} from "@/lib/storage";

type ReadyState = "loading" | "locked" | "ready" | "error";

function freshStarterData(): WealthDockData {
  return structuredClone(starterData);
}

export function useWealthDock() {
  const [status, setStatus] = useState<ReadyState>("loading");
  const [data, setData] = useState<WealthDockData | null>(null);
  const [lockedVault, setLockedVault] = useState<Extract<
    StoredVault,
    { mode: "encrypted" }
  > | null>(null);
  const [error, setError] = useState("");
  const passphraseRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    void loadVault()
      .then(async (record) => {
        if (!record) {
          const starter = freshStarterData();
          await savePlainVault(starter);
          setData(starter);
          setStatus("ready");
        } else if (record.mode === "encrypted") {
          setLockedVault(record);
          setStatus("locked");
        } else {
          const parsed = wealthDockDataSchema.safeParse(record.data);
          if (!parsed.success)
            throw new Error(
              "Stored data is not compatible with this WealthDock version.",
            );
          setData(parsed.data);
          setStatus("ready");
        }
        hydratedRef.current = true;
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load the local vault.",
        );
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    if (!hydratedRef.current || status !== "ready" || !data) return;
    const timeout = window.setTimeout(() => {
      const write = data.settings.encryptionEnabled
        ? passphraseRef.current
          ? saveEncryptedVault(data, passphraseRef.current)
          : Promise.resolve()
        : savePlainVault(data);
      void write.catch(() =>
        setError("The latest change could not be saved locally."),
      );
    }, 180);
    return () => window.clearTimeout(timeout);
  }, [data, status]);

  const mutate = useCallback(
    (recipe: (current: WealthDockData) => WealthDockData) => {
      setData((current) =>
        current
          ? { ...recipe(current), updatedAt: new Date().toISOString() }
          : current,
      );
    },
    [],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      if (!lockedVault) return;
      try {
        const unlocked = await unlockVault(lockedVault.envelope, passphrase);
        const parsed = wealthDockDataSchema.parse(unlocked);
        passphraseRef.current = passphrase;
        setData(parsed);
        setLockedVault(null);
        setError("");
        setStatus("ready");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to unlock the vault.",
        );
      }
    },
    [lockedVault],
  );

  const enableEncryption = useCallback(
    async (passphrase: string) => {
      if (!data) return;
      const encrypted = {
        ...data,
        settings: { ...data.settings, encryptionEnabled: true },
        updatedAt: new Date().toISOString(),
      };
      await saveEncryptedVault(encrypted, passphrase);
      passphraseRef.current = passphrase;
      setData(encrypted);
    },
    [data],
  );

  const disableEncryption = useCallback(async () => {
    if (!data) return;
    const plain = {
      ...data,
      settings: { ...data.settings, encryptionEnabled: false },
      updatedAt: new Date().toISOString(),
    };
    await savePlainVault(plain);
    passphraseRef.current = null;
    setData(plain);
  }, [data]);

  const lock = useCallback(async () => {
    if (!data?.settings.encryptionEnabled || !passphraseRef.current) return;
    await saveEncryptedVault(data, passphraseRef.current);
    const record = await loadVault();
    if (record?.mode === "encrypted") {
      passphraseRef.current = null;
      setData(null);
      setLockedVault(record);
      setStatus("locked");
    }
  }, [data]);

  const addTransaction = useCallback(
    (input: Omit<Transaction, "id" | "createdAt">) =>
      mutate((current) => ({
        ...current,
        transactions: [
          { ...input, id: createId("tx"), createdAt: new Date().toISOString() },
          ...current.transactions,
        ],
      })),
    [mutate],
  );

  const addAccount = useCallback(
    (input: Omit<Account, "id">) =>
      mutate((current) => ({
        ...current,
        accounts: [...current.accounts, { ...input, id: createId("acc") }],
      })),
    [mutate],
  );

  const addBudget = useCallback(
    (input: Omit<Budget, "id">) =>
      mutate((current) => ({
        ...current,
        budgets: [
          ...current.budgets.filter(
            (budget) =>
              !(
                budget.category === input.category &&
                budget.month === input.month
              ),
          ),
          { ...input, id: createId("budget") },
        ],
      })),
    [mutate],
  );

  const addGoal = useCallback(
    (input: Omit<Goal, "id">) =>
      mutate((current) => ({
        ...current,
        goals: [...current.goals, { ...input, id: createId("goal") }],
      })),
    [mutate],
  );

  const addDebt = useCallback(
    (input: Omit<Debt, "id">) =>
      mutate((current) => ({
        ...current,
        debts: [...current.debts, { ...input, id: createId("debt") }],
      })),
    [mutate],
  );

  const addRecurring = useCallback(
    (input: Omit<RecurringRule, "id">) =>
      mutate((current) => ({
        ...current,
        recurring: [...current.recurring, { ...input, id: createId("rec") }],
      })),
    [mutate],
  );

  const applyDueRecurring = useCallback(() => {
    if (!data) return 0;
    const today = new Date().toISOString().slice(0, 10);
    const created: Transaction[] = [];
    const nextRules = data.recurring.map((rule) => {
      if (!rule.active) return rule;
      let nextDate = rule.nextDate;
      let guard = 0;
      while (nextDate <= today && guard < 24) {
        created.push({
          id: createId("tx"),
          type: rule.type,
          amount: rule.amount,
          accountId: rule.accountId,
          category: rule.category,
          note: rule.name,
          tags: ["recurring"],
          date: nextDate,
          createdAt: new Date().toISOString(),
        });
        const parsed = new Date(`${nextDate}T12:00:00Z`);
        const advanced =
          rule.frequency === "weekly"
            ? addWeeks(parsed, 1)
            : rule.frequency === "monthly"
              ? addMonths(parsed, 1)
              : addYears(parsed, 1);
        nextDate = advanced.toISOString().slice(0, 10);
        guard += 1;
      }
      return { ...rule, nextDate };
    });
    if (created.length) {
      setData({
        ...data,
        transactions: [...created, ...data.transactions],
        recurring: nextRules,
        updatedAt: new Date().toISOString(),
      });
    }
    return created.length;
  }, [data]);

  const updateGoal = useCallback(
    (id: string, saved: number) =>
      mutate((current) => ({
        ...current,
        goals: current.goals.map((goal) =>
          goal.id === id ? { ...goal, saved } : goal,
        ),
      })),
    [mutate],
  );

  const settleDebt = useCallback(
    (id: string) =>
      mutate((current) => ({
        ...current,
        debts: current.debts.map((debt) =>
          debt.id === id ? { ...debt, settled: !debt.settled } : debt,
        ),
      })),
    [mutate],
  );

  const deleteTransaction = useCallback(
    (id: string) =>
      mutate((current) => ({
        ...current,
        transactions: current.transactions.filter(
          (transaction) => transaction.id !== id,
        ),
      })),
    [mutate],
  );

  const importData = useCallback(async (next: WealthDockData) => {
    const parsed = wealthDockDataSchema.parse(next);
    const normalized = {
      ...parsed,
      settings: { ...parsed.settings, encryptionEnabled: false },
      updatedAt: new Date().toISOString(),
    };
    passphraseRef.current = null;
    await savePlainVault(normalized);
    setData(normalized);
    setStatus("ready");
  }, []);

  const importTransactions = useCallback(
    (transactions: Transaction[]) =>
      mutate((current) => ({
        ...current,
        transactions: [...transactions, ...current.transactions],
      })),
    [mutate],
  );

  const setBaseCurrency = useCallback(
    (baseCurrency: Currency) =>
      mutate((current) => ({
        ...current,
        settings: { ...current.settings, baseCurrency },
      })),
    [mutate],
  );

  const togglePrivacy = useCallback(
    () =>
      mutate((current) => ({
        ...current,
        settings: {
          ...current.settings,
          privacyMode: !current.settings.privacyMode,
        },
      })),
    [mutate],
  );

  const reset = useCallback(async () => {
    const starter = freshStarterData();
    passphraseRef.current = null;
    await clearVault();
    await savePlainVault(starter);
    setData(starter);
    setStatus("ready");
  }, []);

  return {
    status,
    data,
    error,
    setError,
    unlock,
    enableEncryption,
    disableEncryption,
    lock,
    addTransaction,
    addAccount,
    addBudget,
    addGoal,
    addDebt,
    addRecurring,
    applyDueRecurring,
    updateGoal,
    settleDebt,
    deleteTransaction,
    importData,
    importTransactions,
    setBaseCurrency,
    togglePrivacy,
    reset,
  };
}

export type WealthDockController = ReturnType<typeof useWealthDock>;
