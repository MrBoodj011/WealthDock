"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  BellRing,
  Bot,
  Check,
  ChevronRight,
  CircleDollarSign,
  CloudOff,
  Download,
  Eye,
  EyeOff,
  FileJson,
  FileSpreadsheet,
  Fingerprint,
  Goal as GoalIcon,
  LayoutDashboard,
  Lock,
  LockKeyhole,
  Menu,
  Moon,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  categoryOptions,
  currencies,
  type TransactionType,
} from "@/domain/types";
import { useWealthDock } from "@/hooks/use-wealthdock";
import {
  accountBalance,
  budgetProgress,
  expensesByCategory,
  money,
  monthSummary,
  monthlyCashflow,
  netWorth,
} from "@/lib/finance";
import {
  downloadText,
  exportTransactionsCsv,
  importTransactionsCsv,
  parseWealthDockJson,
} from "@/lib/import-export";
import { encryptJson } from "@/lib/crypto";
import { generateFinanceReport } from "@/lib/report";
import { Logo } from "./logo";

type View =
  "overview" | "transactions" | "planning" | "automations" | "settings";
type Modal =
  "transaction" | "account" | "budget" | "goal" | "debt" | "recurring" | null;

const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: ReceiptText },
  { id: "planning", label: "Plan", icon: Target },
  { id: "automations", label: "Recurring", icon: RefreshCcw },
  { id: "settings", label: "Settings", icon: Settings },
];

const chartColors = [
  "#8b7cff",
  "#2dd4bf",
  "#f59e0b",
  "#fb7185",
  "#60a5fa",
  "#a78bfa",
];

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function visibleMoney(
  value: number,
  currency: string,
  hidden: boolean,
  locale = "en-US",
) {
  return hidden ? "••••••" : money(value, currency, locale);
}

export default function WealthDockApp() {
  const controller = useWealthDock();
  const [view, setView] = useState<View>("overview");
  const [modal, setModal] = useState<Modal>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (controller.status === "loading") return <LoadingScreen />;
  if (controller.status === "locked")
    return <UnlockScreen controller={controller} />;
  if (!controller.data)
    return (
      <ErrorScreen message={controller.error} onReset={controller.reset} />
    );

  const titles: Record<View, [string, string]> = {
    overview: [
      "Financial command center",
      "A private snapshot of everything that matters.",
    ],
    transactions: [
      "Transactions",
      "Search, filter and understand every movement.",
    ],
    planning: [
      "Plans that stay on course",
      "Budgets, savings goals and debts in one place.",
    ],
    automations: [
      "Recurring money",
      "See what is coming before it reaches your balance.",
    ],
    settings: [
      "Privacy and data",
      "Control storage, encryption, backups and preferences.",
    ],
  };

  const data = controller.data;
  const hidden = data.settings.privacyMode;

  return (
    <div className="app-frame">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <Logo />
          <button
            className="icon-button mobile-only"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="local-badge">
          <ShieldCheck size={16} />
          <div>
            <strong>Local-first vault</strong>
            <span>No bank login. No tracking.</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => {
                setView(item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {view === item.id && (
                <ChevronRight size={16} className="nav-arrow" />
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <Fingerprint size={18} />
            <div>
              <strong>Your data is yours</strong>
              <span>Stored only on this device</span>
            </div>
          </div>
          <a
            href="https://github.com/MrBoodj011/WealthDock"
            target="_blank"
            rel="noreferrer"
            className="version-pill"
          >
            Open source · v1.0.2
          </a>
        </div>
      </aside>

      <main className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="page-title">
            <p>{titles[view][0]}</p>
            <span>{titles[view][1]}</span>
          </div>
          <div className="top-actions">
            <button
              className="icon-button"
              onClick={controller.togglePrivacy}
              aria-label={hidden ? "Show balances" : "Hide balances"}
            >
              {hidden ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
            <button
              className="primary-button"
              onClick={() => setModal("transaction")}
            >
              <Plus size={17} /> Add transaction
            </button>
          </div>
        </header>

        <div className="view-content">
          {controller.error && (
            <div className="toast error-toast">
              <span>{controller.error}</span>
              <button onClick={() => controller.setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <Overview
              data={data}
              hidden={hidden}
              onAddAccount={() => setModal("account")}
              onViewTransactions={() => setView("transactions")}
            />
          )}
          {view === "transactions" && (
            <Transactions
              data={data}
              hidden={hidden}
              onDelete={controller.deleteTransaction}
            />
          )}
          {view === "planning" && (
            <Planning
              data={data}
              hidden={hidden}
              onModal={setModal}
              onGoalUpdate={controller.updateGoal}
              onSettleDebt={controller.settleDebt}
            />
          )}
          {view === "automations" && (
            <Automations
              data={data}
              hidden={hidden}
              onAdd={() => setModal("recurring")}
              onApply={controller.applyDueRecurring}
            />
          )}
          {view === "settings" && <DataSettings controller={controller} />}
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            className={view === item.id ? "active" : ""}
            onClick={() => setView(item.id)}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {modal && (
        <EditorModal
          kind={modal}
          data={data}
          close={() => setModal(null)}
          controller={controller}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="center-screen">
      <div className="loading-mark">
        <Logo compact />
        <span />
      </div>
      <p>Opening your private vault…</p>
    </div>
  );
}

function ErrorScreen({
  message,
  onReset,
}: {
  message: string;
  onReset: () => Promise<void>;
}) {
  return (
    <div className="center-screen">
      <div className="error-card">
        <CloudOff size={36} />
        <h1>WealthDock could not open</h1>
        <p>{message || "The local vault is unavailable."}</p>
        <button className="primary-button" onClick={() => void onReset()}>
          Start with clean demo data
        </button>
      </div>
    </div>
  );
}

function UnlockScreen({
  controller,
}: {
  controller: ReturnType<typeof useWealthDock>;
}) {
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    await controller.unlock(passphrase);
    setBusy(false);
  }
  return (
    <div className="unlock-screen">
      <div className="unlock-panel">
        <Logo />
        <div className="lock-orbit">
          <LockKeyhole size={32} />
        </div>
        <p className="eyebrow">Encrypted local vault</p>
        <h1>Welcome back</h1>
        <p>
          Your financial data is encrypted on this device. Enter your passphrase
          to unlock it.
        </p>
        <form onSubmit={submit}>
          <label>
            Vault passphrase
            <input
              type="password"
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              autoFocus
              required
            />
          </label>
          {controller.error && (
            <span className="form-error">{controller.error}</span>
          )}
          <button className="primary-button full" disabled={busy}>
            {busy ? "Decrypting…" : "Unlock WealthDock"}
          </button>
        </form>
        <small>We never store or recover your passphrase.</small>
      </div>
    </div>
  );
}

function Overview({
  data,
  hidden,
  onAddAccount,
  onViewTransactions,
}: {
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  hidden: boolean;
  onAddAccount: () => void;
  onViewTransactions: () => void;
}) {
  const month = currentMonth();
  const summary = monthSummary(data, month);
  const cashflow = monthlyCashflow(data);
  const categories = expensesByCategory(data, month);
  const budgets = budgetProgress(data, month);
  const currency = data.settings.baseCurrency;
  const locale = data.settings.locale;
  const worth = netWorth(data);

  return (
    <div className="dashboard-grid">
      <section className="hero-balance panel span-8">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="status-dot" /> Total net worth
          </div>
          <h1>{visibleMoney(worth, currency, hidden, locale)}</h1>
          <p>
            Across {data.accounts.filter((account) => !account.archived).length}{" "}
            accounts · updated locally
          </p>
        </div>
        <div className="hero-signal">
          <Sparkles size={18} />
          <span>
            {summary.savings >= 0
              ? "Positive cashflow this month"
              : "Expenses are above income"}
          </span>
          <strong>
            {hidden
              ? "•••"
              : `${summary.income ? Math.round((summary.savings / summary.income) * 100) : 0}%`}
          </strong>
        </div>
      </section>
      <MetricCard
        icon={TrendingUp}
        label="Income"
        value={visibleMoney(summary.income, currency, hidden, locale)}
        tone="green"
        note="This month"
      />
      <MetricCard
        icon={TrendingDown}
        label="Expenses"
        value={visibleMoney(summary.expenses, currency, hidden, locale)}
        tone="red"
        note="This month"
      />
      <section className="panel span-8 chart-panel">
        <PanelTitle
          title="Cashflow"
          subtitle="Income and expenses over six months"
        />
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cashflow}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb7185" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#fb7185" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#202637"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#697085"
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: "#151a27",
                  border: "1px solid #2a3042",
                  borderRadius: 12,
                }}
                formatter={(value) => money(Number(value), currency, locale)}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke="#2dd4bf"
                strokeWidth={2}
                fill="url(#income)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stroke="#fb7185"
                strokeWidth={2}
                fill="url(#expense)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel span-4 category-panel">
        <PanelTitle title="Spending" subtitle="By category this month" />
        <div className="donut-wrap">
          {categories.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  dataKey="value"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={4}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#151a27",
                    border: "1px solid #2a3042",
                    borderRadius: 12,
                  }}
                  formatter={(value) => money(Number(value), currency, locale)}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyMini text="No expenses this month" />
          )}
        </div>
        <div className="legend-list">
          {categories.slice(0, 4).map((item, index) => (
            <div key={item.name}>
              <span
                className="legend-dot"
                style={{ background: chartColors[index % chartColors.length] }}
              />
              <span>{item.name}</span>
              <strong>
                {hidden ? "•••" : money(item.value, currency, locale)}
              </strong>
            </div>
          ))}
        </div>
      </section>
      <section className="panel span-7">
        <PanelTitle
          title="Accounts"
          subtitle="Balances in their native currency"
          action={
            <button className="text-button" onClick={onAddAccount}>
              <Plus size={15} /> Add account
            </button>
          }
        />
        <div className="account-list">
          {data.accounts
            .filter((account) => !account.archived)
            .map((account) => (
              <div className="account-row" key={account.id}>
                <span
                  className="account-icon"
                  style={{
                    color: account.color,
                    background: `${account.color}18`,
                  }}
                >
                  <WalletCards size={19} />
                </span>
                <div>
                  <strong>{account.name}</strong>
                  <span>
                    {account.type} · {account.currency}
                  </span>
                </div>
                <b>
                  {visibleMoney(
                    accountBalance(account, data.transactions),
                    account.currency,
                    hidden,
                    locale,
                  )}
                </b>
              </div>
            ))}
        </div>
      </section>
      <section className="panel span-5">
        <PanelTitle
          title="Budget pulse"
          subtitle={`${budgets.length} active limits`}
          action={
            <button className="text-button" onClick={() => {}}>
              This month
            </button>
          }
        />
        <div className="progress-list">
          {budgets.length ? (
            budgets.slice(0, 4).map((budget) => (
              <div key={budget.id}>
                <div>
                  <span>{budget.category}</span>
                  <strong>
                    {hidden
                      ? "•••"
                      : `${money(budget.spent, currency, locale)} / ${money(budget.limit, currency, locale)}`}
                  </strong>
                </div>
                <div className="progress-track">
                  <span
                    style={{ width: `${budget.percentage}%` }}
                    className={budget.percentage > 85 ? "danger" : ""}
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyMini text="No budgets for this month" />
          )}
        </div>
      </section>
      <section className="panel span-12">
        <PanelTitle
          title="Recent activity"
          subtitle="Latest movements across every account"
          action={
            <button className="text-button" onClick={onViewTransactions}>
              View all <ChevronRight size={15} />
            </button>
          }
        />
        <TransactionRows data={data} hidden={hidden} limit={5} />
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  note,
  tone,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  note: string;
  tone: "green" | "red";
}) {
  return (
    <section className="panel metric-card span-2">
      <span className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </span>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{note}</span>
    </section>
  );
}

function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="empty-mini">
      <Activity size={22} />
      <span>{text}</span>
    </div>
  );
}

function TransactionRows({
  data,
  hidden,
  limit,
  transactions = data.transactions,
  onDelete,
}: {
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  hidden: boolean;
  limit?: number;
  transactions?: typeof data.transactions;
  onDelete?: (id: string) => void;
}) {
  const accounts = new Map(
    data.accounts.map((account) => [account.id, account]),
  );
  return (
    <div className="transaction-list">
      {transactions
        .slice(0, limit ?? transactions.length)
        .map((transaction) => {
          const Icon =
            transaction.type === "income"
              ? ArrowDownLeft
              : transaction.type === "expense"
                ? ArrowUpRight
                : ArrowRightLeft;
          const account = accounts.get(transaction.accountId);
          return (
            <div className="transaction-row" key={transaction.id}>
              <span className={`transaction-icon ${transaction.type}`}>
                <Icon size={18} />
              </span>
              <div className="transaction-main">
                <strong>{transaction.note || transaction.category}</strong>
                <span>
                  {transaction.category} · {account?.name ?? "Unknown account"}
                </span>
              </div>
              <div className="transaction-date">
                <strong>
                  {new Date(`${transaction.date}T12:00:00`).toLocaleDateString(
                    "en",
                    { month: "short", day: "numeric" },
                  )}
                </strong>
                <span>
                  {transaction.tags.slice(0, 2).join(" · ") || "untagged"}
                </span>
              </div>
              <b className={transaction.type}>
                {hidden
                  ? "•••"
                  : `${transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}${money(transaction.amount, account?.currency ?? data.settings.baseCurrency, data.settings.locale)}`}
              </b>
              {onDelete && (
                <button
                  className="row-delete"
                  onClick={() => onDelete(transaction.id)}
                  aria-label="Delete transaction"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      {!transactions.length && <EmptyMini text="No matching transactions" />}
    </div>
  );
}

function Transactions({
  data,
  hidden,
  onDelete,
}: {
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  hidden: boolean;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const filtered = useMemo(
    () =>
      data.transactions.filter((transaction) => {
        const haystack =
          `${transaction.note} ${transaction.category} ${transaction.tags.join(" ")}`.toLowerCase();
        return (
          (type === "all" || transaction.type === type) &&
          haystack.includes(query.toLowerCase())
        );
      }),
    [data.transactions, query, type],
  );
  return (
    <section className="panel full-panel">
      <div className="toolbar">
        <div className="search-box">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search note, category or tag…"
          />
        </div>
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
          <option value="transfer">Transfers</option>
        </select>
        <span className="result-count">{filtered.length} results</span>
      </div>
      <TransactionRows
        data={data}
        hidden={hidden}
        transactions={filtered}
        onDelete={(id) => {
          if (window.confirm("Delete this transaction?")) onDelete(id);
        }}
      />
    </section>
  );
}

function Planning({
  data,
  hidden,
  onModal,
  onGoalUpdate,
  onSettleDebt,
}: {
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  hidden: boolean;
  onModal: (modal: Modal) => void;
  onGoalUpdate: (id: string, saved: number) => void;
  onSettleDebt: (id: string) => void;
}) {
  const budgets = budgetProgress(data, currentMonth());
  const currency = data.settings.baseCurrency;
  const locale = data.settings.locale;
  return (
    <div className="planning-grid">
      <section className="panel planning-section">
        <PanelTitle
          title="Monthly budgets"
          subtitle="Limits reset by month"
          action={
            <button className="text-button" onClick={() => onModal("budget")}>
              <Plus size={15} /> New budget
            </button>
          }
        />
        <div className="budget-cards">
          {budgets.map((budget) => (
            <div className="budget-card" key={budget.id}>
              <div
                className="budget-ring"
                style={{
                  background: `conic-gradient(${budget.percentage > 85 ? "#fb7185" : "#8b7cff"} ${budget.percentage * 3.6}deg, #252b3a 0deg)`,
                }}
              >
                <span>{Math.round(budget.percentage)}%</span>
              </div>
              <div>
                <strong>{budget.category}</strong>
                <span>
                  {hidden
                    ? "Hidden"
                    : `${money(budget.spent, currency, locale)} spent`}
                </span>
                <small>
                  {hidden
                    ? "•••"
                    : `${money(Math.max(budget.limit - budget.spent, 0), currency, locale)} remaining`}
                </small>
              </div>
            </div>
          ))}
          {!budgets.length && (
            <EmptyMini text="Create your first monthly budget" />
          )}
        </div>
      </section>
      <section className="panel planning-section">
        <PanelTitle
          title="Savings goals"
          subtitle="Make progress visible"
          action={
            <button className="text-button" onClick={() => onModal("goal")}>
              <Plus size={15} /> New goal
            </button>
          }
        />
        <div className="goal-list">
          {data.goals.map((goal) => {
            const progress = Math.min((goal.saved / goal.target) * 100, 100);
            return (
              <div className="goal-card" key={goal.id}>
                <div className="goal-head">
                  <span
                    className="goal-icon"
                    style={{ color: goal.color, background: `${goal.color}18` }}
                  >
                    <GoalIcon size={20} />
                  </span>
                  <div>
                    <strong>{goal.name}</strong>
                    <span>
                      {goal.deadline
                        ? `Target ${new Date(`${goal.deadline}T12:00:00`).toLocaleDateString("en", { month: "short", year: "numeric" })}`
                        : "No deadline"}
                    </span>
                  </div>
                  <b>{Math.round(progress)}%</b>
                </div>
                <div className="progress-track">
                  <span
                    style={{ width: `${progress}%`, background: goal.color }}
                  />
                </div>
                <div className="goal-footer">
                  <span>
                    {hidden ? "•••" : money(goal.saved, currency, locale)}
                  </span>
                  <button
                    onClick={() => {
                      const next = window.prompt(
                        "New saved amount",
                        String(goal.saved),
                      );
                      if (next && Number(next) >= 0)
                        onGoalUpdate(goal.id, Number(next));
                    }}
                  >
                    Update
                  </button>
                  <span>
                    {hidden ? "•••" : money(goal.target, currency, locale)}
                  </span>
                </div>
              </div>
            );
          })}
          {!data.goals.length && (
            <EmptyMini text="Create a goal to start saving with intent" />
          )}
        </div>
      </section>
      <section className="panel planning-section wide">
        <PanelTitle
          title="Debts and receivables"
          subtitle="Track both sides without spreadsheets"
          action={
            <button className="text-button" onClick={() => onModal("debt")}>
              <Plus size={15} /> Add record
            </button>
          }
        />
        <div className="debt-grid">
          {data.debts.map((debt) => (
            <div
              className={`debt-card ${debt.settled ? "settled" : ""}`}
              key={debt.id}
            >
              <span className={`debt-direction ${debt.direction}`}>
                <CircleDollarSign size={19} />
              </span>
              <div>
                <strong>{debt.person}</strong>
                <span>
                  {debt.direction === "owed-to-me" ? "Owes you" : "You owe"}
                  {debt.dueDate ? ` · due ${debt.dueDate}` : ""}
                </span>
              </div>
              <b>{hidden ? "•••" : money(debt.amount, currency, locale)}</b>
              <button onClick={() => onSettleDebt(debt.id)}>
                {debt.settled ? (
                  "Reopen"
                ) : (
                  <>
                    <Check size={15} /> Settle
                  </>
                )}
              </button>
            </div>
          ))}
          {!data.debts.length && (
            <EmptyMini text="Nothing owed. That is a good place to be." />
          )}
        </div>
      </section>
    </div>
  );
}

function Automations({
  data,
  hidden,
  onAdd,
  onApply,
}: {
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  hidden: boolean;
  onAdd: () => void;
  onApply: () => number;
}) {
  const [notice, setNotice] = useState("");
  return (
    <section className="panel full-panel">
      {notice && (
        <div className="toast success-toast">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <PanelTitle
        title="Recurring rules"
        subtitle="A forward view of repeating income and costs"
        action={
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => {
                const count = onApply();
                setNotice(
                  count
                    ? `${count} due transaction${count === 1 ? "" : "s"} posted.`
                    : "Nothing is due today.",
                );
              }}
            >
              <Check size={16} /> Post due
            </button>
            <button className="primary-button small" onClick={onAdd}>
              <Plus size={16} /> Add rule
            </button>
          </div>
        }
      />
      <div className="automation-summary">
        <div>
          <BellRing size={22} />
          <span>Next 30 days</span>
          <strong>
            {data.recurring.filter((rule) => rule.active).length} active rules
          </strong>
        </div>
        <div>
          <Bot size={22} />
          <span>Local automation</span>
          <strong>No server required</strong>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>Review first</span>
          <strong>Nothing posts silently</strong>
        </div>
      </div>
      <div className="automation-list">
        {data.recurring.map((rule) => (
          <div className="automation-row" key={rule.id}>
            <span className={`transaction-icon ${rule.type}`}>
              {rule.type === "income" ? (
                <ArrowDownLeft size={18} />
              ) : (
                <ArrowUpRight size={18} />
              )}
            </span>
            <div>
              <strong>{rule.name}</strong>
              <span>
                {rule.category} · {rule.frequency}
              </span>
            </div>
            <div>
              <strong>
                {hidden
                  ? "•••"
                  : money(
                      rule.amount,
                      data.settings.baseCurrency,
                      data.settings.locale,
                    )}
              </strong>
              <span>Next: {rule.nextDate}</span>
            </div>
            <span className={`rule-status ${rule.active ? "active" : ""}`}>
              {rule.active ? "Active" : "Paused"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataSettings({
  controller,
}: {
  controller: ReturnType<typeof useWealthDock>;
}) {
  const data = controller.data!;
  const fileInput = useRef<HTMLInputElement>(null);
  const csvInput = useRef<HTMLInputElement>(null);
  const [vaultPassphrase, setVaultPassphrase] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [notice, setNotice] = useState("");
  async function importFile(file: File, mode: "json" | "csv") {
    const text = await file.text();
    try {
      if (mode === "json")
        await controller.importData(parseWealthDockJson(text));
      else {
        const result = importTransactionsCsv(text, data.accounts);
        controller.importTransactions(result.transactions);
        if (result.errors.length)
          setNotice(
            `Imported ${result.transactions.length} rows. ${result.errors.length} rows were skipped.`,
          );
      }
      setNotice((current) => current || "Import completed successfully.");
    } catch (reason) {
      controller.setError(
        reason instanceof Error ? reason.message : "Import failed.",
      );
    }
  }
  async function secureBackup() {
    try {
      const encrypted = await encryptJson(data, backupPassphrase);
      downloadText(
        `wealthdock-backup-${currentMonth()}.wdock`,
        JSON.stringify(encrypted, null, 2),
        "application/json",
      );
      setBackupPassphrase("");
      setNotice("Encrypted backup downloaded.");
    } catch (reason) {
      controller.setError(
        reason instanceof Error ? reason.message : "Backup failed.",
      );
    }
  }
  return (
    <div className="settings-grid">
      {notice && (
        <div className="toast success-toast span-all">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <section className="panel settings-card">
        <PanelTitle title="Preferences" subtitle="Display and base currency" />
        <label className="field-label">
          Base currency
          <select
            value={data.settings.baseCurrency}
            onChange={(event) =>
              controller.setBaseCurrency(
                event.target.value as (typeof currencies)[number],
              )
            }
          >
            {currencies.map((currency) => (
              <option key={currency}>{currency}</option>
            ))}
          </select>
        </label>
        <div className="setting-line">
          <span className="setting-icon">
            <Moon size={19} />
          </span>
          <div>
            <strong>Dark interface</strong>
            <span>Optimized for low-light clarity</span>
          </div>
          <span className="static-toggle on">
            <i />
          </span>
        </div>
        <div className="setting-line">
          <span className="setting-icon">
            <EyeOff size={19} />
          </span>
          <div>
            <strong>Privacy mode</strong>
            <span>Hide balances in shared spaces</span>
          </div>
          <button
            className={`toggle ${data.settings.privacyMode ? "on" : ""}`}
            onClick={controller.togglePrivacy}
          >
            <i />
          </button>
        </div>
      </section>
      <section className="panel settings-card">
        <PanelTitle
          title="Encrypted vault"
          subtitle="AES-256-GCM, locked with your passphrase"
        />
        {data.settings.encryptionEnabled ? (
          <div className="secure-state">
            <span>
              <ShieldCheck size={24} />
            </span>
            <div>
              <strong>Encryption is enabled</strong>
              <p>
                Your IndexedDB vault is encrypted at rest. WealthDock asks for
                your passphrase after a restart.
              </p>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => void controller.lock()}
              >
                <Lock size={16} /> Lock now
              </button>
              <button
                className="danger-button"
                onClick={() => void controller.disableEncryption()}
              >
                Disable
              </button>
            </div>
          </div>
        ) : (
          <div className="encryption-form">
            <p>
              Enable encryption before using real financial data. Your
              passphrase never leaves this device and cannot be recovered.
            </p>
            <label className="field-label">
              New passphrase
              <input
                type="password"
                minLength={10}
                value={vaultPassphrase}
                onChange={(event) => setVaultPassphrase(event.target.value)}
                placeholder="At least 10 characters"
              />
            </label>
            <button
              className="primary-button full"
              disabled={vaultPassphrase.length < 10}
              onClick={() =>
                void controller.enableEncryption(vaultPassphrase).then(() => {
                  setVaultPassphrase("");
                  setNotice("Local vault encryption enabled.");
                })
              }
            >
              <LockKeyhole size={16} /> Encrypt local vault
            </button>
          </div>
        )}
      </section>
      <section className="panel settings-card">
        <PanelTitle
          title="Portable data"
          subtitle="Open formats, no vendor lock-in"
        />
        <div className="data-actions">
          <button
            onClick={() =>
              downloadText(
                `wealthdock-${currentMonth()}.json`,
                JSON.stringify(data, null, 2),
                "application/json",
              )
            }
          >
            <FileJson size={20} />
            <span>
              <strong>JSON backup</strong>
              <small>Full editable dataset</small>
            </span>
            <Download size={16} />
          </button>
          <button onClick={() => generateFinanceReport(data)}>
            <ReceiptText size={20} />
            <span>
              <strong>PDF report</strong>
              <small>Readable financial snapshot</small>
            </span>
            <Download size={16} />
          </button>
          <button
            onClick={() =>
              downloadText(
                `wealthdock-transactions-${currentMonth()}.csv`,
                exportTransactionsCsv(data),
                "text/csv",
              )
            }
          >
            <FileSpreadsheet size={20} />
            <span>
              <strong>CSV export</strong>
              <small>Spreadsheet compatible</small>
            </span>
            <Download size={16} />
          </button>
          <button onClick={() => fileInput.current?.click()}>
            <Upload size={20} />
            <span>
              <strong>Import JSON</strong>
              <small>Validated before replace</small>
            </span>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => csvInput.current?.click()}>
            <Upload size={20} />
            <span>
              <strong>Import CSV</strong>
              <small>Appends valid rows</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
        <input
          ref={fileInput}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={(event) =>
            event.target.files?.[0] &&
            void importFile(event.target.files[0], "json")
          }
        />
        <input
          ref={csvInput}
          hidden
          type="file"
          accept="text/csv,.csv"
          onChange={(event) =>
            event.target.files?.[0] &&
            void importFile(event.target.files[0], "csv")
          }
        />
      </section>
      <section className="panel settings-card">
        <PanelTitle
          title="Encrypted backup"
          subtitle="Safe to store in any cloud drive"
        />
        <div className="encryption-form">
          <p>
            The backup uses a fresh salt and IV. Keep the passphrase somewhere
            safe.
          </p>
          <label className="field-label">
            Backup passphrase
            <input
              type="password"
              minLength={10}
              value={backupPassphrase}
              onChange={(event) => setBackupPassphrase(event.target.value)}
              placeholder="Different from your account passwords"
            />
          </label>
          <button
            className="secondary-button full"
            disabled={backupPassphrase.length < 10}
            onClick={() => void secureBackup()}
          >
            <Download size={16} /> Download secure backup
          </button>
        </div>
      </section>
      <section className="panel settings-card danger-zone span-all">
        <div>
          <strong>Reset local workspace</strong>
          <span>Delete this device vault and reload safe demo data.</span>
        </div>
        <button
          className="danger-button"
          onClick={() => {
            if (
              window.confirm("Delete all local WealthDock data on this device?")
            )
              void controller.reset();
          }}
        >
          <Trash2 size={16} /> Reset data
        </button>
      </section>
    </div>
  );
}

function EditorModal({
  kind,
  data,
  close,
  controller,
}: {
  kind: Exclude<Modal, null>;
  data: NonNullable<ReturnType<typeof useWealthDock>["data"]>;
  close: () => void;
  controller: ReturnType<typeof useWealthDock>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<TransactionType>("expense");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (name: string) => String(form.get(name) ?? "").trim();
    if (kind === "transaction")
      controller.addTransaction({
        type,
        amount: Number(value("amount")),
        accountId: value("accountId"),
        toAccountId: type === "transfer" ? value("toAccountId") : undefined,
        category: value("category") || "Other",
        note: value("note"),
        tags: value("tags")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20),
        date: value("date"),
      });
    if (kind === "account")
      controller.addAccount({
        name: value("name"),
        type: value("accountType") as
          "cash" | "checking" | "savings" | "credit",
        currency: value("currency") as (typeof currencies)[number],
        initialBalance: Number(value("initialBalance")),
        exchangeRateToBase: Number(value("exchangeRate")) || 1,
        color: value("color"),
      });
    if (kind === "budget")
      controller.addBudget({
        category: value("category"),
        limit: Number(value("limit")),
        month: value("month"),
      });
    if (kind === "goal")
      controller.addGoal({
        name: value("name"),
        target: Number(value("target")),
        saved: Number(value("saved")) || 0,
        deadline: value("deadline") || undefined,
        color: value("color"),
      });
    if (kind === "debt")
      controller.addDebt({
        person: value("person"),
        amount: Number(value("amount")),
        direction: value("direction") as "owed-to-me" | "i-owe",
        dueDate: value("dueDate") || undefined,
        settled: false,
      });
    if (kind === "recurring")
      controller.addRecurring({
        name: value("name"),
        type: value("ruleType") as "income" | "expense",
        amount: Number(value("amount")),
        accountId: value("accountId"),
        category: value("category"),
        frequency: value("frequency") as "weekly" | "monthly" | "yearly",
        nextDate: value("nextDate"),
        active: true,
      });
    close();
  }
  const labels: Record<typeof kind, string> = {
    transaction: "Add transaction",
    account: "Add account",
    budget: "Create budget",
    goal: "Create savings goal",
    debt: "Add debt record",
    recurring: "Add recurring rule",
  };
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        className="editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">WealthDock workspace</span>
            <h2 id="modal-title">{labels[kind]}</h2>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X size={19} />
          </button>
        </div>
        <form onSubmit={submit} className="form-grid">
          {kind === "transaction" && (
            <>
              <div className="type-switch span-2">
                {(["expense", "income", "transfer"] as TransactionType[]).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      className={type === item ? "active" : ""}
                      onClick={() => setType(item)}
                    >
                      {item === "expense" ? (
                        <ArrowUpRight size={16} />
                      ) : item === "income" ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowRightLeft size={16} />
                      )}{" "}
                      {item}
                    </button>
                  ),
                )}
              </div>
              <Field
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
              <SelectField
                label="Account"
                name="accountId"
                options={data.accounts.map((account) => [
                  account.id,
                  account.name,
                ])}
              />
              {type === "transfer" && (
                <SelectField
                  label="To account"
                  name="toAccountId"
                  options={data.accounts.map((account) => [
                    account.id,
                    account.name,
                  ])}
                />
              )}
              <SelectField
                label="Category"
                name="category"
                options={categoryOptions.map((category) => [
                  category,
                  category,
                ])}
              />
              <Field
                label="Date"
                name="date"
                type="date"
                defaultValue={today}
                required
              />
              <Field
                label="Note"
                name="note"
                placeholder="What was this for?"
              />
              <Field
                label="Tags"
                name="tags"
                placeholder="work, fixed, essential"
              />
            </>
          )}
          {kind === "account" && (
            <>
              <Field
                label="Account name"
                name="name"
                placeholder="Everyday checking"
                required
              />
              <SelectField
                label="Type"
                name="accountType"
                options={[
                  ["checking", "Checking"],
                  ["savings", "Savings"],
                  ["cash", "Cash"],
                  ["credit", "Credit"],
                ]}
              />
              <SelectField
                label="Currency"
                name="currency"
                options={currencies.map((currency) => [currency, currency])}
              />
              <Field
                label="Opening balance"
                name="initialBalance"
                type="number"
                step="0.01"
                defaultValue="0"
                required
              />
              <Field
                label="Rate to base currency"
                name="exchangeRate"
                type="number"
                step="0.0001"
                defaultValue="1"
                required
              />
              <Field
                label="Color"
                name="color"
                type="color"
                defaultValue="#8b7cff"
                required
              />
            </>
          )}
          {kind === "budget" && (
            <>
              <SelectField
                label="Category"
                name="category"
                options={categoryOptions.map((category) => [
                  category,
                  category,
                ])}
              />
              <Field
                label="Monthly limit"
                name="limit"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
              <Field
                label="Month"
                name="month"
                type="month"
                defaultValue={currentMonth()}
                required
              />
            </>
          )}
          {kind === "goal" && (
            <>
              <Field
                label="Goal name"
                name="name"
                placeholder="Emergency fund"
                required
              />
              <Field
                label="Target amount"
                name="target"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
              <Field
                label="Already saved"
                name="saved"
                type="number"
                step="0.01"
                min="0"
                defaultValue="0"
              />
              <Field label="Deadline" name="deadline" type="date" />
              <Field
                label="Color"
                name="color"
                type="color"
                defaultValue="#2dd4bf"
              />
            </>
          )}
          {kind === "debt" && (
            <>
              <Field label="Person or organization" name="person" required />
              <Field
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
              <SelectField
                label="Direction"
                name="direction"
                options={[
                  ["owed-to-me", "They owe me"],
                  ["i-owe", "I owe them"],
                ]}
              />
              <Field label="Due date" name="dueDate" type="date" />
            </>
          )}
          {kind === "recurring" && (
            <>
              <Field
                label="Rule name"
                name="name"
                placeholder="Rent"
                required
              />
              <SelectField
                label="Type"
                name="ruleType"
                options={[
                  ["expense", "Expense"],
                  ["income", "Income"],
                ]}
              />
              <Field
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
              />
              <SelectField
                label="Account"
                name="accountId"
                options={data.accounts.map((account) => [
                  account.id,
                  account.name,
                ])}
              />
              <SelectField
                label="Category"
                name="category"
                options={categoryOptions.map((category) => [
                  category,
                  category,
                ])}
              />
              <SelectField
                label="Frequency"
                name="frequency"
                options={[
                  ["weekly", "Weekly"],
                  ["monthly", "Monthly"],
                  ["yearly", "Yearly"],
                ]}
              />
              <Field
                label="Next date"
                name="nextDate"
                type="date"
                defaultValue={today}
                required
              />
            </>
          )}
          <div className="modal-actions span-2">
            <button type="button" className="secondary-button" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Save to vault
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <label className="field-label">
      {label}
      <input name={name} {...props} />
    </label>
  );
}
function SelectField({
  label,
  name,
  options,
}: {
  label: string;
  name: string;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <label className="field-label">
      {label}
      <select name={name}>
        {options.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
