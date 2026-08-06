import { jsPDF } from "jspdf";
import type { WealthDockData } from "@/domain/types";
import { accountBalance, money, monthSummary, netWorth } from "./finance";

export function generateFinanceReport(data: WealthDockData): void {
  const document = new jsPDF({ unit: "pt", format: "a4" });
  const month = new Date().toISOString().slice(0, 7);
  const summary = monthSummary(data, month);
  const currency = data.settings.baseCurrency;
  const locale = data.settings.locale;
  let y = 60;

  document.setFillColor(12, 15, 24);
  document.rect(0, 0, 595, 842, "F");
  document.setTextColor(245, 246, 250);
  document.setFont("helvetica", "bold");
  document.setFontSize(23);
  document.text("WealthDock", 46, y);
  document.setTextColor(139, 124, 255);
  document.setFontSize(9);
  document.text("PRIVATE FINANCIAL SNAPSHOT", 46, y + 22);
  document.setTextColor(139, 147, 167);
  document.text(
    `Generated locally on ${new Date().toLocaleString(locale)}`,
    46,
    y + 38,
  );

  y += 82;
  document.setFillColor(21, 25, 37);
  document.roundedRect(42, y, 511, 102, 12, 12, "F");
  document.setTextColor(150, 158, 178);
  document.setFontSize(9);
  document.text("TOTAL NET WORTH", 60, y + 28);
  document.setTextColor(245, 246, 250);
  document.setFontSize(25);
  document.text(money(netWorth(data), currency, locale), 60, y + 61);
  document.setFontSize(9);
  document.setTextColor(45, 212, 191);
  document.text(
    `Income ${money(summary.income, currency, locale)}`,
    330,
    y + 42,
  );
  document.setTextColor(251, 113, 133);
  document.text(
    `Expenses ${money(summary.expenses, currency, locale)}`,
    330,
    y + 62,
  );

  y += 135;
  document.setTextColor(245, 246, 250);
  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.text("Accounts", 46, y);
  y += 20;
  data.accounts
    .filter((account) => !account.archived)
    .forEach((account) => {
      document.setFillColor(16, 19, 28);
      document.roundedRect(42, y, 511, 42, 8, 8, "F");
      document.setTextColor(226, 229, 237);
      document.setFontSize(10);
      document.text(account.name, 58, y + 17);
      document.setTextColor(112, 120, 139);
      document.setFontSize(8);
      document.text(`${account.type} · ${account.currency}`, 58, y + 30);
      document.setTextColor(245, 246, 250);
      document.setFontSize(10);
      document.text(
        money(
          accountBalance(account, data.transactions),
          account.currency,
          locale,
        ),
        532,
        y + 24,
        { align: "right" },
      );
      y += 48;
    });

  y += 18;
  document.setTextColor(245, 246, 250);
  document.setFontSize(13);
  document.text("Recent transactions", 46, y);
  y += 20;
  data.transactions.slice(0, 10).forEach((transaction) => {
    if (y > 790) {
      document.addPage();
      document.setFillColor(12, 15, 24);
      document.rect(0, 0, 595, 842, "F");
      y = 52;
    }
    const account = data.accounts.find(
      (candidate) => candidate.id === transaction.accountId,
    );
    document.setTextColor(218, 221, 230);
    document.setFontSize(9);
    document.text(transaction.note || transaction.category, 48, y);
    document.setTextColor(111, 119, 138);
    document.text(`${transaction.date} · ${transaction.category}`, 48, y + 13);
    document.setTextColor(
      transaction.type === "income" ? 45 : 251,
      transaction.type === "income" ? 212 : 113,
      transaction.type === "income" ? 191 : 133,
    );
    document.text(
      `${transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}${money(transaction.amount, account?.currency ?? currency, locale)}`,
      532,
      y + 6,
      { align: "right" },
    );
    y += 34;
  });

  document.setTextColor(93, 101, 119);
  document.setFontSize(7);
  document.text(
    "Generated on-device. WealthDock never received this data.",
    297,
    820,
    { align: "center" },
  );
  document.save(`wealthdock-report-${month}.pdf`);
}
