import Papa from "papaparse";
import type { Account, Transaction, WealthDockData } from "@/domain/types";
import { createId } from "@/domain/types";
import { wealthDockDataSchema } from "@/domain/schema";

function safeSpreadsheetValue(value: string): string {
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}

export function exportTransactionsCsv(data: WealthDockData): string {
  const accounts = new Map(
    data.accounts.map((account) => [account.id, account.name]),
  );
  return Papa.unparse(
    data.transactions.map((transaction) => ({
      date: transaction.date,
      type: transaction.type,
      amount: transaction.amount,
      account: safeSpreadsheetValue(
        accounts.get(transaction.accountId) ?? transaction.accountId,
      ),
      targetAccount: safeSpreadsheetValue(
        transaction.toAccountId
          ? (accounts.get(transaction.toAccountId) ?? transaction.toAccountId)
          : "",
      ),
      category: safeSpreadsheetValue(transaction.category),
      note: safeSpreadsheetValue(transaction.note),
      tags: transaction.tags.map(safeSpreadsheetValue).join("|"),
    })),
  );
}

interface CsvRow {
  date?: string;
  type?: string;
  amount?: string;
  account?: string;
  targetAccount?: string;
  category?: string;
  note?: string;
  tags?: string;
}

function resolveAccount(accounts: Account[], value: string | undefined) {
  if (!value) return undefined;
  return accounts.find(
    (account) =>
      account.id === value ||
      account.name.toLowerCase() === value.toLowerCase(),
  );
}

export function importTransactionsCsv(
  csv: string,
  accounts: Account[],
): { transactions: Transaction[]; errors: string[] } {
  const result = Papa.parse<CsvRow>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  const errors = result.errors.map(
    (error) => `Row ${error.row ?? "?"}: ${error.message}`,
  );
  const transactions: Transaction[] = [];

  result.data.forEach((row, index) => {
    const account = resolveAccount(accounts, row.account);
    const target = resolveAccount(accounts, row.targetAccount);
    const amount = Number(row.amount);
    const type = row.type?.toLowerCase();
    if (!account || !Number.isFinite(amount) || amount <= 0) {
      errors.push(`Row ${index + 2}: invalid account or amount.`);
      return;
    }
    if (type !== "income" && type !== "expense" && type !== "transfer") {
      errors.push(
        `Row ${index + 2}: type must be income, expense or transfer.`,
      );
      return;
    }
    if (type === "transfer" && !target) {
      errors.push(`Row ${index + 2}: transfer target account is missing.`);
      return;
    }
    const date =
      row.date && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
        ? row.date
        : new Date().toISOString().slice(0, 10);
    transactions.push({
      id: createId("tx"),
      type,
      amount,
      accountId: account.id,
      toAccountId: target?.id,
      category: row.category?.slice(0, 80) || "Other",
      note: row.note?.slice(0, 300) || "",
      tags: (row.tags ?? "")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 20),
      date,
      createdAt: new Date().toISOString(),
    });
  });
  return { transactions, errors };
}

export function parseWealthDockJson(text: string): WealthDockData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
  const result = wealthDockDataSchema.safeParse(parsed);
  if (!result.success)
    throw new Error("The file does not match the WealthDock data schema.");
  return result.data;
}

export function downloadText(
  filename: string,
  value: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
