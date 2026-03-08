import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { 
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, 
  DollarSign, CreditCard, PiggyBank 
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(142 76% 36%)", "hsl(38 92% 50%)", "hsl(262 83% 58%)"];

const AccountingDashboard = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    receivable: 0,
    payable: 0,
    cashBalance: 0,
    bankBalance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [incomeRes, expenseRes, accountsRes, bankRes] = await Promise.all([
        supabase.from("income_transactions").select("amount, transaction_date, customer_name, description"),
        supabase.from("expense_transactions").select("amount, transaction_date, expense_category, description"),
        supabase.from("chart_of_accounts").select("account_type, current_balance, account_name"),
        supabase.from("bank_accounts").select("current_balance, account_name"),
      ]);

      const totalIncome = (incomeRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = (expenseRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
      
      const accounts = accountsRes.data || [];
      const receivable = accounts.filter(a => a.account_name === 'Accounts Receivable').reduce((s, a) => s + Number(a.current_balance), 0);
      const payable = accounts.filter(a => a.account_name === 'Accounts Payable').reduce((s, a) => s + Number(a.current_balance), 0);
      const cashBalance = accounts.filter(a => a.account_name === 'Cash').reduce((s, a) => s + Number(a.current_balance), 0);
      const bankBalance = (bankRes.data || []).reduce((s, b) => s + Number(b.current_balance), 0);

      setStats({ totalIncome, totalExpense, receivable, payable, cashBalance, bankBalance });

      // Monthly data for chart
      const monthMap: Record<string, { income: number; expense: number }> = {};
      (incomeRes.data || []).forEach(t => {
        const month = t.transaction_date?.substring(0, 7) || "";
        if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
        monthMap[month].income += Number(t.amount);
      });
      (expenseRes.data || []).forEach(t => {
        const month = t.transaction_date?.substring(0, 7) || "";
        if (!monthMap[month]) monthMap[month] = { income: 0, expense: 0 };
        monthMap[month].expense += Number(t.amount);
      });
      setMonthlyData(Object.entries(monthMap).sort().slice(-6).map(([month, data]) => ({ month, ...data })));

      // Expense by category
      const catMap: Record<string, number> = {};
      (expenseRes.data || []).forEach(t => {
        catMap[t.expense_category] = (catMap[t.expense_category] || 0) + Number(t.amount);
      });
      setExpenseByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));

      // Recent transactions (combine and sort)
      const recent = [
        ...(incomeRes.data || []).map(t => ({ ...t, type: "income" as const })),
        ...(expenseRes.data || []).map(t => ({ ...t, type: "expense" as const })),
      ].sort((a, b) => (b.transaction_date || "").localeCompare(a.transaction_date || "")).slice(0, 10);
      setRecentTransactions(recent);
    } catch (err) {
      console.error("Error fetching accounting dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const netBalance = stats.totalIncome - stats.totalExpense;
  const summaryCards = [
    { title: "Total Income", value: formatCurrency(stats.totalIncome), icon: TrendingUp, color: "text-green-600", bg: "bg-green-500/10", arrow: ArrowUpRight },
    { title: "Total Expense", value: formatCurrency(stats.totalExpense), icon: TrendingDown, color: "text-red-600", bg: "bg-red-500/10", arrow: ArrowDownRight },
    { title: "Net Balance", value: formatCurrency(netBalance), icon: Wallet, color: netBalance >= 0 ? "text-green-600" : "text-red-600", bg: "bg-primary/10", arrow: netBalance >= 0 ? ArrowUpRight : ArrowDownRight },
    { title: "Receivable", value: formatCurrency(stats.receivable), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-500/10", arrow: ArrowUpRight },
    { title: "Payable", value: formatCurrency(stats.payable), icon: CreditCard, color: "text-orange-600", bg: "bg-orange-500/10", arrow: ArrowDownRight },
    { title: "Cash + Bank", value: formatCurrency(stats.cashBalance + stats.bankBalance), icon: PiggyBank, color: "text-purple-600", bg: "bg-purple-500/10", arrow: ArrowUpRight },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Accounting Dashboard</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Income vs Expense</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="income" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="hsl(0 84% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No data yet. Add income and expense entries to see charts.</p>
            )}
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card>
          <CardHeader><CardTitle className="text-base">Expense by Category</CardTitle></CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={expenseByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
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
              {recentTransactions.map((t, i) => (
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

export default AccountingDashboard;
