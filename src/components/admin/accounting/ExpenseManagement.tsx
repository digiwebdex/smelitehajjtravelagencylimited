import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { useViewerMode } from "@/contexts/ViewerModeContext";
import { format } from "date-fns";

const db = supabase as any;

interface ExpenseTransaction {
  id: string; transaction_date: string; account_id: string; expense_category: string;
  description: string; amount: number; payment_method: string; vendor_supplier: string | null;
  reference_number: string | null; notes: string | null;
}
interface Account { id: string; account_code: string; account_name: string; }

const EXPENSE_CATEGORIES = ["Office Rent", "Utilities", "Salaries", "Marketing", "Travel & Transport", "Office Supplies", "Miscellaneous", "Commission", "Government Fee", "Food & Beverage"];

const ExpenseManagement = () => {
  const { isViewerMode } = useViewerMode();
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [form, setForm] = useState({
    transaction_date: format(new Date(), "yyyy-MM-dd"), account_id: "", expense_category: "",
    description: "", amount: "", payment_method: "cash", vendor_supplier: "", reference_number: "", notes: "",
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [txRes, accRes] = await Promise.all([
      db.from("expense_transactions").select("*").order("transaction_date", { ascending: false }),
      db.from("chart_of_accounts").select("id, account_code, account_name").eq("account_type", "expense").eq("is_active", true).order("account_code"),
    ]);
    if (txRes.data) setTransactions(txRes.data as ExpenseTransaction[]);
    if (accRes.data) setExpenseAccounts(accRes.data as Account[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.account_id || !form.description || !form.amount || !form.expense_category) {
      toast.error("Category, account, description, and amount are required"); return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      transaction_date: form.transaction_date, account_id: form.account_id,
      expense_category: form.expense_category, description: form.description,
      amount: Number(form.amount), payment_method: form.payment_method,
      vendor_supplier: form.vendor_supplier || null, reference_number: form.reference_number || null,
      notes: form.notes || null, created_by: userData?.user?.id || null,
    };
    const { error } = await db.from("expense_transactions").insert([payload]);
    if (error) { toast.error(error.message); return; }
    await db.from("general_ledger").insert([{
      transaction_date: form.transaction_date, account_id: form.account_id,
      transaction_type: "expense", description: form.description, debit: Number(form.amount),
      credit: 0, reference_type: "expense", created_by: userData?.user?.id || null,
    }]);
    toast.success("Expense recorded"); setDialogOpen(false);
    setForm({ transaction_date: format(new Date(), "yyyy-MM-dd"), account_id: "", expense_category: "", description: "", amount: "", payment_method: "cash", vendor_supplier: "", reference_number: "", notes: "" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense entry?")) return;
    const { error } = await db.from("expense_transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted"); fetchData();
  };

  const exportCSV = () => {
    const headers = "Date,Category,Description,Vendor,Payment Method,Amount,Reference\n";
    const rows = filtered.map(t => `${t.transaction_date},"${t.expense_category}","${t.description}","${t.vendor_supplier || ""}",${t.payment_method},${t.amount},"${t.reference_number || ""}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `expense_report_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const filtered = transactions.filter(t => {
    if (dateFilter.from && t.transaction_date < dateFilter.from) return false;
    if (dateFilter.to && t.transaction_date > dateFilter.to) return false;
    return true;
  });
  const totalFiltered = filtered.reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Expense Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
          {!isViewerMode && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Expense</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} /></div>
                    <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Category</Label>
                      <Select value={form.expense_category} onValueChange={v => setForm(f => ({ ...f, expense_category: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Expense Account</Label>
                      <Select value={form.account_id} onValueChange={v => setForm(f => ({ ...f, account_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                        <SelectContent>{expenseAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Payment Method</Label>
                      <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="mobile">Mobile Banking</SelectItem><SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Vendor/Supplier</Label><Input value={form.vendor_supplier} onChange={e => setForm(f => ({ ...f, vendor_supplier: e.target.value }))} /></div>
                  </div>
                  <div><Label>Reference #</Label><Input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} /></div>
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                  <Button onClick={handleSave} className="w-full">Save Expense</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-end flex-wrap">
        <div><Label className="text-xs">From</Label><Input type="date" value={dateFilter.from} onChange={e => setDateFilter(f => ({ ...f, from: e.target.value }))} className="w-[160px]" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={dateFilter.to} onChange={e => setDateFilter(f => ({ ...f, to: e.target.value }))} className="w-[160px]" /></div>
        <Badge variant="secondary" className="h-9 px-3">Total: {formatCurrency(totalFiltered)}</Badge>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead>
                <TableHead>Vendor</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead>
                {!isViewerMode && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No expense records</TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.transaction_date}</TableCell>
                  <TableCell className="text-sm">{t.expense_category}</TableCell>
                  <TableCell className="text-sm">{t.description}</TableCell>
                  <TableCell className="text-sm">{t.vendor_supplier || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{t.payment_method}</Badge></TableCell>
                  <TableCell className="text-right font-medium text-red-600">{formatCurrency(Number(t.amount))}</TableCell>
                  {!isViewerMode && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseManagement;
