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

interface IncomeTransaction {
  id: string;
  transaction_date: string;
  account_id: string;
  customer_name: string | null;
  description: string;
  payment_method: string;
  amount: number;
  reference_number: string | null;
  booking_id: string | null;
  notes: string | null;
  created_at: string;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
}

const IncomeManagement = () => {
  const { isViewerMode } = useViewerMode();
  const [transactions, setTransactions] = useState<IncomeTransaction[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [form, setForm] = useState({
    transaction_date: format(new Date(), "yyyy-MM-dd"),
    account_id: "",
    customer_name: "",
    description: "",
    payment_method: "cash",
    amount: "",
    reference_number: "",
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [txRes, accRes] = await Promise.all([
      supabase.from("income_transactions").select("*").order("transaction_date", { ascending: false }),
      supabase.from("chart_of_accounts").select("id, account_code, account_name").eq("account_type", "income").eq("is_active", true).order("account_code"),
    ]);
    if (txRes.data) setTransactions(txRes.data as IncomeTransaction[]);
    if (accRes.data) setIncomeAccounts(accRes.data as Account[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.account_id || !form.description || !form.amount) { toast.error("Account, description, and amount are required"); return; }
    
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      transaction_date: form.transaction_date,
      account_id: form.account_id,
      customer_name: form.customer_name || null,
      description: form.description,
      payment_method: form.payment_method,
      amount: Number(form.amount),
      reference_number: form.reference_number || null,
      notes: form.notes || null,
      created_by: userData?.user?.id || null,
    };

    const { error } = await supabase.from("income_transactions").insert([payload]);
    if (error) { toast.error(error.message); return; }

    // Add to general ledger
    await supabase.from("general_ledger").insert([{
      transaction_date: form.transaction_date,
      account_id: form.account_id,
      transaction_type: "income",
      description: form.description,
      debit: 0,
      credit: Number(form.amount),
      reference_type: "income",
      created_by: userData?.user?.id || null,
    }]);

    toast.success("Income recorded");
    setDialogOpen(false);
    setForm({ transaction_date: format(new Date(), "yyyy-MM-dd"), account_id: "", customer_name: "", description: "", payment_method: "cash", amount: "", reference_number: "", notes: "" });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income entry?")) return;
    const { error } = await supabase.from("income_transactions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    fetchData();
  };

  const exportCSV = () => {
    const headers = "Date,Customer,Description,Payment Method,Amount,Reference\n";
    const rows = filtered.map(t => `${t.transaction_date},"${t.customer_name || ""}","${t.description}",${t.payment_method},${t.amount},"${t.reference_number || ""}"`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `income_report_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  const filtered = transactions.filter(t => {
    if (dateFilter.from && t.transaction_date < dateFilter.from) return false;
    if (dateFilter.to && t.transaction_date > dateFilter.to) return false;
    return true;
  });

  const totalFiltered = filtered.reduce((s, t) => s + Number(t.amount), 0);
  const getAccountName = (id: string) => incomeAccounts.find(a => a.id === id)?.account_name || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Income Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
          {!isViewerMode && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Income</Button></DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Record Income</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Date</Label><Input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} /></div>
                    <div><Label>Amount (৳)</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" /></div>
                  </div>
                  <div><Label>Income Account</Label>
                    <Select value={form.account_id} onValueChange={v => setForm(f => ({ ...f, account_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>{incomeAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Customer Name</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                  <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Payment Method</Label>
                      <Select value={form.payment_method} onValueChange={v => setForm(f => ({ ...f, payment_method: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank">Bank</SelectItem>
                          <SelectItem value="mobile">Mobile Banking</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Reference #</Label><Input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} /></div>
                  </div>
                  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
                  <Button onClick={handleSave} className="w-full">Save Income</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
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
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {!isViewerMode && <TableHead className="text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No income records</TableCell></TableRow>
              ) : filtered.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="text-sm">{t.transaction_date}</TableCell>
                  <TableCell className="text-sm">{t.customer_name || "—"}</TableCell>
                  <TableCell className="text-sm">{t.description}</TableCell>
                  <TableCell className="text-sm">{getAccountName(t.account_id)}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{t.payment_method}</Badge></TableCell>
                  <TableCell className="text-right font-medium text-green-600">{formatCurrency(Number(t.amount))}</TableCell>
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

export default IncomeManagement;
