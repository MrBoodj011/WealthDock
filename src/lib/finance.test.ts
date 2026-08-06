import { describe, expect, it } from "vitest";
import { starterData } from "@/domain/demo-data";
import {
  accountBalance,
  budgetProgress,
  monthSummary,
  netWorth,
} from "./finance";

describe("finance engine", () => {
  it("calculates account balances including transfers", () => {
    const everyday = starterData.accounts.find(
      (account) => account.id === "acc_everyday",
    )!;
    const savings = starterData.accounts.find(
      (account) => account.id === "acc_savings",
    )!;

    expect(accountBalance(everyday, starterData.transactions)).toBeCloseTo(
      4893.6,
    );
    expect(accountBalance(savings, starterData.transactions)).toBeCloseTo(
      13150,
    );
    expect(netWorth(starterData)).toBeCloseTo(18283.6);
  });

  it("separates income, expenses and savings", () => {
    expect(monthSummary(starterData, "2026-08")).toEqual({
      income: 4200,
      expenses: 1406.4,
      savings: 2793.6,
    });
  });

  it("tracks budget progress by category", () => {
    const food = budgetProgress(starterData, "2026-08").find(
      (budget) => budget.category === "Food",
    );
    expect(food?.spent).toBe(86.4);
    expect(food?.percentage).toBeCloseTo(15.709, 2);
  });
});
