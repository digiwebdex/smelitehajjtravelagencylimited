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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { useViewerMode } from "@/contexts/ViewerModeContext";

const db = supabase as any;

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  description: string | null;
  is_active: boolean;
  opening_balance: number;
  current_balance: number;
}

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset", color: "bg-blue-500/10 text-blue-700" },
  { value: "liability", label: "Liability", color: "bg-orange-500/10 text-orange-700" },
  { value: "income", label: "Income", color: "bg-green-500/10 text-green-700" },
  { value: "expense", label: "Expense", color: "bg-red-500/10 text-red-700" },
  { value: "equity", label: "Equity", color: "bg-purple-500/10 text-purple-700" },
];

const ChartOfAccounts = () => {
  const { isViewerMode } = useViewerMode();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ account_code: "", account_name: "", account_type: "asset", description: "", opening_balance: "0" });

  useEffect(() => { fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    const { data, error } = await db.from("chart_of_accounts").select("*").order("account_code");
    if (!error && data) setAccounts(data as Account[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.account_code || !form.account_name) { toast.error("Code and name are required"); return; }
    const payload = {
      account_code: form.account_code, account_name: form.account_name, account_type: form.account_type,
      description: form.description || null, opening_balance: Number(form.opening_balance) || 0,
      current_balance: editingAccount ? editingAccount.current_balance : Number(form.opening_balance) || 0,
    };
    if (editingAccount) {
      const { error } = await db.from("chart_of_accounts").update(payload).eq("id", editingAccount.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Account updated");
    } else {
      const { error } = await db.from("chart_of_accounts").insert([payload]);
      if (error) { toast.error(error.message); return; }
      toast.success("Account created");
    }
    setDialogOpen(false); setEditingAccount(null);
    setForm({ account_code: "", account_name: "", account_type: "asset", description: "", opening_balance: "0" });
    fetchAccounts();
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setForm({ account_code: account.account_code, account_name: account.account_name, account_type: account.account_type, description: account.description || "", opening_balance: String(account.opening_balance) });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return;
    const { error } = await db.from("chart_of_accounts").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Account deleted"); fetchAccounts();
  };

  const filtered = filterType === "all" ? accounts : accounts.filter(a => a.account_type === filterType);
  const getTypeStyle = (type: string) => ACCOUNT_TYPES.find(t => t.value === type)?.color || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">Chart of Accounts</h2>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {!isViewerMode && (
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingAccount(null); setForm({ account_code: "", account_name: "", account_type: "asset", description: "", opening_balance: "0" }); } }}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Account</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingAccount ? "Edit Account" : "Add Account"}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Account Code</Label><Input value={form.account_code} onChange={e => setForm(f => ({ ...f, account_code: e.target.value }))} placeholder="e.g. 1000" /></div>
                    <div><Label>Account Type</Label>
                      <Select value={form.account_type} onValueChange={v => setForm(f => ({ ...f, account_type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{ACCOUNT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>Account Name</Label><Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} /></div>
                  <div><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: e.target.value }))} /></div>
                  <Button onClick={handleSave} className="w-full">{editingAccount ? "Update" : "Create"} Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead><TableHead>Account Name</TableHead><TableHead>Type</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                {!isViewerMode && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No accounts found</TableCell></TableRow>
              ) : filtered.map(account => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono text-sm">{account.account_code}</TableCell>
                  <TableCell className="font-medium">{account.account_name}</TableCell>
                  <TableCell><Badge variant="secondary" className={getTypeStyle(account.account_type)}>{account.account_type}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(account.current_balance)}</TableCell>
                  {!isViewerMode && (
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(account)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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

export default ChartOfAccounts;
