import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  DollarSign, CreditCard, PiggyBank, Users, ShieldCheck, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const db = supabase as any;
const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)"];

interface FinancialSummary {
  total_sales: number;
  income_received: number;
  total_expense: number;
  net_profit: number;
  customer_due: number;
  commission: number;
  cash_balance: number;
  bank_balance: number;
  mobile_balance: number;
  receivable: number;
  payable: number;
  total_liquid: number;
}

const AccountingDashboard = () => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, incomeRes, expenseRes, ledgerRes] = await Promise.all([
        db.rpc("get_financial_summary"),
        db.from("income_transactions").select("amount, transaction_date, customer_name, description").order("transaction_date", { ascending: false }).limit(20),
        db.from("expense_transactions").select("amount, transaction_date, expense_category, description").order("transaction_date", { ascending: false }).limit(20),
        db.from("general_ledger").select("debit, credit, transaction_type, transaction_date, description").order("transaction_date", { ascending: false }).limit(10),
      ]);

      if (summaryRes.data) {
        setSummary(summaryRes.data as FinancialSummary);
      }

      // Monthly income vs expense from actual transactions
      const monthMap: Record<string, { income: number; expense: number }> = {};
      (incomeRes.data || []).forEach((t: any) => {
        const month = t.transaction_date?.substring(0, 7) || "";
        if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
        monthMap[month].income += Number(t.amount);
      });
      (expenseRes.data || []).forEach((t: any) => {
        const month = t.transaction_date?.substring(0, 7) || "";
        if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
        monthMap[month].expense += Number(t.amount);
      });
      setMonthlyData(Object.entries(monthMap).sort().slice(-6).map(([month, data]) => ({ month, ...data })));

      // Expense by category
      const catMap: Record<string, number> = {};
      (expenseRes.data || []).forEach((t: any) => {
        catMap[t.expense_category] = (catMap[t.expense_category] || 0) + Number(t.amount);
      });
      setExpenseByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Recent combined transactions
      const recent = [
        ...(incomeRes.data || []).slice(0, 5).map((t: any) => ({ ...t, type: "income" as const })),
        ...(expenseRes.data || []).slice(0, 5).map((t: any) => ({ ...t, type: "expense" as const })),
      ].sort((a, b) => (b.transaction_date || "").localeCompare(a.transaction_date || "")).slice(0, 10);
      setRecentTransactions(recent);
    } catch (err) {
      console.error("Error fetching accounting dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const summaryCards = [
    { title: "Total Sales", value: formatCurrency(summary.total_sales), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-500/10", desc: "Confirmed bookings" },
    { title: "Income Received", value: formatCurrency(summary.income_received), icon: TrendingUp, color: "text-green-600", bg: "bg-green-500/10", desc: "Recorded income" },
    { title: "Total Expense", value: formatCurrency(summary.total_expense), icon: TrendingDown, color: "text-red-600", bg: "bg-red-500/10", desc: "Recorded expenses" },
    { title: "Net Profit", value: formatCurrency(summary.net_profit), icon: Wallet, color: summary.net_profit >= 0 ? "text-green-600" : "text-red-600", bg: "bg-primary/10", desc: "Income - Expense" },
    { title: "Customer Due", value: formatCurrency(summary.customer_due), icon: Users, color: "text-orange-600", bg: "bg-orange-500/10", desc: "Unpaid booking amounts" },
    { title: "Commission Due", value: formatCurrency(summary.commission), icon: CreditCard, color: "text-purple-600", bg: "bg-purple-500/10", desc: "Agent pending commission" },
    { title: "Receivable", value: formatCurrency(summary.receivable), icon: ArrowUpRight, color: "text-blue-600", bg: "bg-blue-500/10", desc: "Accounts Receivable" },
    { title: "Payable", value: formatCurrency(summary.payable), icon: ArrowDownRight, color: "text-orange-600", bg: "bg-orange-500/10", desc: "Accounts Payable" },
    { title: "Cash + Bank + Mobile", value: formatCurrency(summary.total_liquid), icon: PiggyBank, color: "text-emerald-600", bg: "bg-emerald-500/10", desc: `Cash: ${formatCurrency(summary.cash_balance)} | Bank: ${formatCurrency(summary.bank_balance)}` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" />
          Accounting Dashboard
        </h2>
        <Button variant="outline" size="sm" onClick={fetchDashboardData} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <div className={`${card.bg} p-1.5 rounded-lg`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <p className="text-lg font-bold">{card.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debit/Credit Balance Check */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Double-Entry Balance Check</p>
              <p className="text-xs text-muted-foreground">All debits must equal all credits in the general ledger</p>
            </div>
            <BalanceChecker />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Income vs Expense</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Expense by Category</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No expense data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${t.type === "income" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {t.type === "income" ? <ArrowUpRight className="w-4 h-4 text-green-600" /> : <ArrowDownRight className="w-4 h-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.transaction_date} • {t.customer_name || t.expense_category || ""}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Sub-component to check debit/credit balance
const BalanceChecker = () => {
  const [balance, setBalance] = useState<{ debit: number; credit: number } | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await (supabase as any)
        .from("general_ledger")
        .select("debit, credit");
      if (data) {
        const debit = data.reduce((s: number, e: any) => s + Number(e.debit), 0);
        const credit = data.reduce((s: number, e: any) => s + Number(e.credit), 0);
        setBalance({ debit, credit });
      }
    };
    check();
  }, []);

  if (!balance) return <div className="animate-pulse w-20 h-6 bg-muted rounded" />;

  const isBalanced = Math.abs(balance.debit - balance.credit) < 0.01;

  return (
    <div className="text-right">
      <div className="flex items-center gap-4 text-sm">
        <span>Debit: <strong>{formatCurrency(balance.debit)}</strong></span>
        <span>Credit: <strong>{formatCurrency(balance.credit)}</strong></span>
      </div>
      <p className={`text-xs font-medium mt-1 ${isBalanced ? "text-green-600" : "text-red-600"}`}>
        {isBalanced ? "✓ Balanced" : `✗ Imbalance: ${formatCurrency(Math.abs(balance.debit - balance.credit))}`}
      </p>
    </div>
  );
};

export default AccountingDashboard;