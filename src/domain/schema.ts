import { z } from "zod";

const currencySchema = z.enum(["USD", "EUR", "GBP", "CAD", "MAD"]);

export const wealthDockDataSchema = z.object({
  schemaVersion: z.literal(1),
  accounts: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(80),
      type: z.enum(["cash", "checking", "savings", "credit"]),
      currency: currencySchema,
      initialBalance: z.number().finite(),
      exchangeRateToBase: z.number().positive().finite(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      archived: z.boolean().optional(),
    }),
  ),
  transactions: z.array(
    z.object({
      id: z.string().min(1),
      type: z.enum(["income", "expense", "transfer"]),
      amount: z.number().positive().finite(),
      accountId: z.string().min(1),
      toAccountId: z.string().min(1).optional(),
      targetAmount: z.number().positive().finite().optional(),
      category: z.string().min(1).max(80),
      note: z.string().max(300),
      tags: z.array(z.string().max(30)).max(20),
      date: z.iso.date(),
      createdAt: z.iso.datetime(),
    }),
  ),
  budgets: z.array(
    z.object({
      id: z.string().min(1),
      category: z.string().min(1).max(80),
      limit: z.number().positive().finite(),
      month: z.string().regex(/^\d{4}-\d{2}$/),
    }),
  ),
  goals: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(100),
      target: z.number().positive().finite(),
      saved: z.number().min(0).finite(),
      deadline: z.iso.date().optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }),
  ),
  debts: z.array(
    z.object({
      id: z.string().min(1),
      person: z.string().min(1).max(100),
      amount: z.number().positive().finite(),
      direction: z.enum(["owed-to-me", "i-owe"]),
      dueDate: z.iso.date().optional(),
      settled: z.boolean(),
    }),
  ),
  recurring: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string().min(1).max(100),
      type: z.enum(["income", "expense"]),
      amount: z.number().positive().finite(),
      accountId: z.string().min(1),
      category: z.string().min(1).max(80),
      frequency: z.enum(["weekly", "monthly", "yearly"]),
      nextDate: z.iso.date(),
      active: z.boolean(),
    }),
  ),
  settings: z.object({
    baseCurrency: currencySchema,
    locale: z.string().min(2).max(20),
    privacyMode: z.boolean(),
    encryptionEnabled: z.boolean(),
  }),
  updatedAt: z.iso.datetime(),
});
