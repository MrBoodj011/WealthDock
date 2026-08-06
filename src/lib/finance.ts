import type { Account, Transaction, WealthDockData } from "@/domain/types";

export function accountBalance(
  account: Account,
  transactions: Transaction[],
): number {
  return transactions.reduce((balance, transaction) => {
    if (transaction.type === "income" && transaction.accountId === account.id) {
      return balance + transaction.amount;
    }
    if (
      transaction.type === "expense" &&
      transaction.accountId === account.id
    ) {
      return balance - transaction.amount;
    }
    if (transaction.type === "transfer") {
      if (transaction.accountId === account.id)
        return balance - transaction.amount;
      if (transaction.toAccountId === account.id) {
        return balance + (transaction.targetAmount ?? transaction.amount);
      }
    }
    return balance;
  }, account.initialBalance);
}

export function netWorth(data: WealthDockData): number {
  return data.accounts
    .filter((account) => !account.archived)
    .reduce(
      (total, account) =>
        total +
        accountBalance(account, data.transactions) * account.exchangeRateToBase,
      0,
    );
}

export function monthSummary(data: WealthDockData, month: string) {
  const monthTransactions = data.transactions.filter((transaction) =>
    transaction.date.startsWith(month),
  );
  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = monthTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  return { income, expenses, savings: income - expenses };
}

export function expensesByCategory(data: WealthDockData, month: string) {
  const grouped = new Map<string, number>();
  data.transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && transaction.date.startsWith(month),
    )
    .forEach((transaction) => {
      grouped.set(
        transaction.category,
        (grouped.get(transaction.category) ?? 0) + transaction.amount,
      );
    });
  return [...grouped.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function monthlyCashflow(data: WealthDockData, months = 6) {
  const formatter = new Intl.DateTimeFormat("en", { month: "short" });
  const now = new Date();
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (months - index - 1),
        1,
      ),
    );
    const month = date.toISOString().slice(0, 7);
    const summary = monthSummary(data, month);
    return { month: formatter.format(date), ...summary };
  });
}

export function budgetProgress(data: WealthDockData, month: string) {
  const expenses = expensesByCategory(data, month);
  return data.budgets
    .filter((budget) => budget.month === month)
    .map((budget) => {
      const spent =
        expenses.find((item) => item.name === budget.category)?.value ?? 0;
      return {
        ...budget,
        spent,
        percentage: Math.min((spent / budget.limit) * 100, 100),
      };
    });
}

export function money(
  value: number,
  currency: string,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
