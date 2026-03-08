import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const FinancialReports = () => {
  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0"));

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [incRes, expRes, accRes] = await Promise.all([
      supabase.from("income_transactions").select("*"),
      supabase.from("expense_transactions").select("*"),
      supabase.from("chart_of_accounts").select("*").eq("is_active", true).order("account_code"),
    ]);
    if (incRes.data) setIncomeData(incRes.data);
    if (expRes.data) setExpenseData(expRes.data);
    if (accRes.data) setAccounts(accRes.data);
    setLoading(false);
  };

  // Filter by selected period
  const filterByPeriod = (data: any[], dateField = "transaction_date") => {
    return data.filter(d => {
      const date = d[dateField] || "";
      if (reportPeriod === "daily") return date === `${selectedYear}-${selectedMonth}-${format(new Date(), "dd")}`;
      if (reportPeriod === "monthly") return date.startsWith(`${selectedYear}-${selectedMonth}`);
      return date.startsWith(selectedYear);
    });
  };

  const filteredIncome = filterByPeriod(incomeData);
  const filteredExpense = filterByPeriod(expenseData);
  const totalIncome = filteredIncome.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const totalExpense = filteredExpense.reduce((s: number, t: any) => s + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;

  // Monthly P&L data for chart
  const monthlyPL = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0");
    const prefix = `${selectedYear}-${month}`;
    const inc = incomeData.filter(d => (d.transaction_date || "").startsWith(prefix)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    const exp = expenseData.filter(d => (d.transaction_date || "").startsWith(prefix)).reduce((s: number, t: any) => s + Number(t.amount), 0);
    return { month: `${month}/${selectedYear.slice(2)}`, income: inc, expense: exp, profit: inc - exp };
  });

  // Trial Balance
  const trialBalance = accounts.map(acc => {
    const debit = acc.account_type === "asset" || acc.account_type === "expense" ? Number(acc.current_balance) : 0;
    const credit = acc.account_type === "liability" || acc.account_type === "income" || acc.account_type === "equity" ? Number(acc.current_balance) : 0;
    return { ...acc, debit, credit };
  }).filter(a => a.debit !== 0 || a.credit !== 0);

  const totalTrialDebit = trialBalance.reduce((s, a) => s + a.debit, 0);
  const totalTrialCredit = trialBalance.reduce((s, a) => s + a.credit, 0);

  // Cash flow (simplified)
  const cashInflows = filteredIncome.filter(t => t.payment_method === "cash").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const cashOutflows = filteredExpense.filter(t => t.payment_method === "cash").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const bankInflows = filteredIncome.filter(t => t.payment_method === "bank").reduce((s: number, t: any) => s + Number(t.amount), 0);
  const bankOutflows = filteredExpense.filter(t => t.payment_method === "bank").reduce((s: number, t: any) => s + Number(t.amount), 0);

  const exportPDF = (reportName: string, headers: string[], rows: string[][]) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("S. M. Elite Hajj Limited", 14, 15);
    doc.setFontSize(12);
    doc.text(reportName, 14, 25);
    doc.setFontSize(9);
    doc.text(`Period: ${reportPeriod === "monthly" ? `${selectedMonth}/${selectedYear}` : selectedYear}`, 14, 32);

    autoTable(doc, {
      startY: 38,
      head: [headers],
      body: rows,
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 58, 95] },
    });

    doc.save(`${reportName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Financial Reports</h2>
        <div className="flex gap-2 items-end">
          <div><Label className="text-xs">Period</Label>
            <Select value={reportPeriod} onValueChange={setReportPeriod}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Year</Label><Input value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="w-[90px]" /></div>
          {reportPeriod !== "yearly" && (
            <div><Label className="text-xs">Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
                <SelectContent>{Array.from({ length: 12 }, (_, i) => <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>{format(new Date(2000, i), "MMM")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="profit-loss">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
          <TabsTrigger value="income-expense">Income & Expense</TabsTrigger>
        </TabsList>

        {/* Profit & Loss */}
        <TabsContent value="profit-loss" className="space-y-4">
          <div className="grid sm:grid-cols-3 gap-4">
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Income</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Total Expense</p><p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p></CardContent></Card>
            <Card><CardContent className="pt-4"><p className="text-xs text-muted-foreground">Net {netProfit >= 0 ? "Profit" : "Loss"}</p><p className={`text-2xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(Math.abs(netProfit))}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Monthly Trend</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportPDF("Profit & Loss Report", ["Month", "Income", "Expense", "Profit/Loss"], monthlyPL.map(m => [m.month, String(m.income), String(m.expense), String(m.profit)]))}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyPL}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="hsl(142 76% 36%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="expense" stroke="hsl(0 84% 60%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial Balance */}
        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Trial Balance</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportPDF("Trial Balance", ["Code", "Account", "Type", "Debit", "Credit"], trialBalance.map(a => [a.account_code, a.account_name, a.account_type, String(a.debit), String(a.credit)]))}>
                <Download className="w-4 h-4 mr-1" /> PDF
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No data</TableCell></TableRow>
                  ) : trialBalance.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-sm">{a.account_code}</TableCell>
                      <TableCell>{a.account_name}</TableCell>
                      <TableCell className="capitalize text-sm">{a.account_type}</TableCell>
                      <TableCell className="text-right">{a.debit > 0 ? formatCurrency(a.debit) : "—"}</TableCell>
                      <TableCell className="text-right">{a.credit > 0 ? formatCurrency(a.credit) : "—"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={3} className="text-right">Totals:</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalTrialDebit)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totalTrialCredit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Flow */}
        <TabsContent value="cash-flow" className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Cash Transactions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Cash Inflows</span><span className="font-medium text-green-600">{formatCurrency(cashInflows)}</span></div>
                <div className="flex justify-between"><span className="text-sm">Cash Outflows</span><span className="font-medium text-red-600">{formatCurrency(cashOutflows)}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Net Cash</span><span className={cashInflows - cashOutflows >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(cashInflows - cashOutflows)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Bank Transactions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-sm">Bank Inflows</span><span className="font-medium text-green-600">{formatCurrency(bankInflows)}</span></div>
                <div className="flex justify-between"><span className="text-sm">Bank Outflows</span><span className="font-medium text-red-600">{formatCurrency(bankOutflows)}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Net Bank</span><span className={bankInflows - bankOutflows >= 0 ? "text-green-600" : "text-red-600"}>{formatCurrency(bankInflows - bankOutflows)}</span></div>
              </CardContent>
            </Card>
          </div>
          <Button variant="outline" size="sm" onClick={() => exportPDF("Cash Flow Report", ["Category", "Inflows", "Outflows", "Net"], [["Cash", String(cashInflows), String(cashOutflows), String(cashInflows - cashOutflows)], ["Bank", String(bankInflows), String(bankOutflows), String(bankInflows - bankOutflows)]])}>
            <Download className="w-4 h-4 mr-1" /> Export PDF
          </Button>
        </TabsContent>

        {/* Income & Expense Detail */}
        <TabsContent value="income-expense" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Income Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredIncome.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No income</TableCell></TableRow>
                  ) : filteredIncome.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.transaction_date}</TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-sm">{t.customer_name || "—"}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">{formatCurrency(Number(t.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filteredExpense.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No expenses</TableCell></TableRow>
                  ) : filteredExpense.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.transaction_date}</TableCell>
                      <TableCell className="text-sm">{t.expense_category}</TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(Number(t.amount))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReports;
