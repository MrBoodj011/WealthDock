export const currencies = ["USD", "EUR", "GBP", "CAD", "MAD"] as const;
export type Currency = (typeof currencies)[number];

export type AccountType = "cash" | "checking" | "savings" | "credit";
export type TransactionType = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: number;
  exchangeRateToBase: number;
  color: string;
  archived?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  accountId: string;
  toAccountId?: string;
  targetAmount?: number;
  category: string;
  note: string;
  tags: string[];
  date: string;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
  color: string;
}

export interface Debt {
  id: string;
  person: string;
  amount: number;
  direction: "owed-to-me" | "i-owe";
  dueDate?: string;
  settled: boolean;
}

export interface RecurringRule {
  id: string;
  name: string;
  type: "income" | "expense";
  amount: number;
  accountId: string;
  category: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextDate: string;
  active: boolean;
}

export interface WealthDockSettings {
  baseCurrency: Currency;
  locale: string;
  privacyMode: boolean;
  encryptionEnabled: boolean;
}

export interface WealthDockData {
  schemaVersion: 1;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];
  recurring: RecurringRule[];
  settings: WealthDockSettings;
  updatedAt: string;
}

export const categoryOptions = [
  "Housing",
  "Food",
  "Transport",
  "Health",
  "Shopping",
  "Subscriptions",
  "Education",
  "Travel",
  "Salary",
  "Freelance",
  "Other",
] as const;

export function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}
