import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { useViewerMode } from "@/contexts/ViewerModeContext";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  branch: string | null;
  account_type: string;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
}

const BankAccounts = () => {
  const { isViewerMode } = useViewerMode();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState({
    account_name: "", bank_name: "", account_number: "", branch: "",
    account_type: "current", opening_balance: "0",
  });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    const { data } = await supabase.from("bank_accounts").select("*").order("bank_name");
    if (data) setAccounts(data as BankAccount[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.account_name || !form.bank_name || !form.account_number) {
      toast.error("Name, bank, and account number are required");
      return;
    }
    const payload = {
      account_name: form.account_name,
      bank_name: form.bank_name,
      account_number: form.account_number,
      branch: form.branch || null,
      account_type: form.account_type,
      opening_balance: Number(form.opening_balance) || 0,
      current_balance: editing ? editing.current_balance : Number(form.opening_balance) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("bank_accounts").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Updated");
    } else {
      const { error } = await supabase.from("bank_accounts").insert([payload]);
      if (error) { toast.error(error.message); return; }
      toast.success("Bank account added");
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ account_name: "", bank_name: "", account_number: "", branch: "", account_type: "current", opening_balance: "0" });
    fetchAccounts();
  };

  const handleEdit = (acc: BankAccount) => {
    setEditing(acc);
    setForm({
      account_name: acc.account_name, bank_name: acc.bank_name, account_number: acc.account_number,
      branch: acc.branch || "", account_type: acc.account_type, opening_balance: String(acc.opening_balance),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bank account?")) return;
    await supabase.from("bank_accounts").delete().eq("id", id);
    toast.success("Deleted");
    fetchAccounts();
  };

  const totalBalance = accounts.filter(a => a.is_active).reduce((s, a) => s + Number(a.current_balance), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">Cash & Bank Management</h2>
          <p className="text-sm text-muted-foreground">Total Balance: <span className="font-bold text-foreground">{formatCurrency(totalBalance)}</span></p>
        </div>
        {!isViewerMode && (
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setForm({ account_name: "", bank_name: "", account_number: "", branch: "", account_type: "current", opening_balance: "0" }); } }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Account</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit" : "Add"} Bank Account</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Account Name</Label><Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="e.g. Main Business Account" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Bank Name</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
                  <div><Label>Account Number</Label><Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Branch</Label><Input value={form.branch} onChange={e => setForm(f => ({ ...f, branch: e.target.value }))} /></div>
                  <div><Label>Type</Label>
                    <Select value={form.account_type} onValueChange={v => setForm(f => ({ ...f, account_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} /></div>
                <Button onClick={handleSave} className="w-full">{editing ? "Update" : "Add"} Account</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Bank</TableHead>
                <TableHead>Account #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                {!isViewerMode && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : accounts.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bank accounts</TableCell></TableRow>
              ) : accounts.map(acc => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.account_name}</TableCell>
                  <TableCell>{acc.bank_name}</TableCell>
                  <TableCell className="font-mono text-sm">{acc.account_number}</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-xs">{acc.account_type.replace("_", " ")}</Badge></TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(acc.current_balance)}</TableCell>
                  {!isViewerMode && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(acc)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(acc.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default BankAccounts;
