import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

const db = supabase as any;

interface LedgerEntry {
  id: string; transaction_date: string; account_id: string; transaction_type: string;
  description: string; debit: number; credit: number; running_balance: number;
  reference_type: string | null; created_at: string;
}
interface Account { id: string; account_code: string; account_name: string; account_type: string; }

const GeneralLedger = () => {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ from: "", to: "", account_id: "all", type: "all" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [ledgerRes, accRes] = await Promise.all([
      db.from("general_ledger").select("*").order("transaction_date", { ascending: false }).order("created_at", { ascending: false }),
      db.from("chart_of_accounts").select("id, account_code, account_name, account_type").eq("is_active", true).order("account_code"),
    ]);
    if (ledgerRes.data) {
      const sorted = [...(ledgerRes.data as LedgerEntry[])].reverse();
      let balance = 0;
      sorted.forEach(e => { balance += Number(e.debit) - Number(e.credit); e.running_balance = balance; });
      setEntries(sorted.reverse());
    }
    if (accRes.data) setAccounts(accRes.data as Account[]);
    setLoading(false);
  };

  const filtered = entries.filter(e => {
    if (filters.from && e.transaction_date < filters.from) return false;
    if (filters.to && e.transaction_date > filters.to) return false;
    if (filters.account_id !== "all" && e.account_id !== filters.account_id) return false;
    if (filters.type !== "all" && e.transaction_type !== filters.type) return false;
    return true;
  });

  const totalDebit = filtered.reduce((s, e) => s + Number(e.debit), 0);
  const totalCredit = filtered.reduce((s, e) => s + Number(e.credit), 0);
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.account_name || "—";
  const getAccountCode = (id: string) => accounts.find(a => a.id === id)?.account_code || "";

  const typeColor = (type: string) => {
    switch (type) {
      case "income": return "bg-green-500/10 text-green-700";
      case "expense": return "bg-red-500/10 text-red-700";
      case "adjustment": return "bg-yellow-500/10 text-yellow-700";
      case "transfer": return "bg-blue-500/10 text-blue-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const exportCSV = () => {
    const headers = "Date,Type,Account Code,Account,Description,Debit,Credit,Balance\n";
    const rows = filtered.map(e => `${e.transaction_date},${e.transaction_type},${getAccountCode(e.account_id)},"${getAccountName(e.account_id)}","${e.description}",${e.debit},${e.credit},${e.running_balance}`).join("\n");
    const blob = new Blob(["\ufeff" + headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `general_ledger_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl font-bold">General Ledger</h2>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-4 h-4 mr-1" /> Export</Button>
      </div>
      <div className="flex gap-2 items-end flex-wrap">
        <div><Label className="text-xs">From</Label><Input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="w-[160px]" /></div>
        <div><Label className="text-xs">To</Label><Input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="w-[160px]" /></div>
        <div><Label className="text-xs">Account</Label>
          <Select value={filters.account_id} onValueChange={v => setFilters(f => ({ ...f, account_id: v }))}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_code} - {a.account_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Type</Label>
          <Select value={filters.type} onValueChange={v => setFilters(f => ({ ...f, type: v }))}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem><SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-4 flex-wrap">
        <Badge variant="secondary" className="h-9 px-3 text-sm">Total Debit: {formatCurrency(totalDebit)}</Badge>
        <Badge variant="secondary" className="h-9 px-3 text-sm">Total Credit: {formatCurrency(totalCredit)}</Badge>
        <Badge variant="secondary" className={`h-9 px-3 text-sm ${totalCredit - totalDebit >= 0 ? "text-green-700" : "text-red-700"}`}>
          Net: {formatCurrency(totalCredit - totalDebit)}
        </Badge>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Account</TableHead>
                <TableHead>Description</TableHead><TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead><TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No ledger entries</TableCell></TableRow>
              ) : filtered.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-sm">{e.transaction_date}</TableCell>
                  <TableCell><Badge variant="secondary" className={`text-xs capitalize ${typeColor(e.transaction_type)}`}>{e.transaction_type}</Badge></TableCell>
                  <TableCell className="text-sm">{getAccountCode(e.account_id)} - {getAccountName(e.account_id)}</TableCell>
                  <TableCell className="text-sm">{e.description}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(e.debit) > 0 ? formatCurrency(Number(e.debit)) : "—"}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(e.credit) > 0 ? formatCurrency(Number(e.credit)) : "—"}</TableCell>
                  <TableCell className={`text-right text-sm font-bold ${e.running_balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(e.running_balance)}</TableCell>
                </TableRow>
              ))}
              {filtered.length > 0 && (
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={4} className="text-right">Totals:</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalCredit - totalDebit)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralLedger;
