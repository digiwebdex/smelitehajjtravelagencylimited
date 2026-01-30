import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Receipt, 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  Activity
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";

interface Transaction {
  id: string;
  booking_id: string;
  payment_method: string;
  gateway_name: string;
  transaction_id: string | null;
  gateway_transaction_id: string | null;
  amount: number;
  currency: string;
  status: string;
  is_live_mode: boolean;
  request_payload: any;
  response_payload: any;
  error_message: string | null;
  ip_address: string | null;
  verified_at: string | null;
  created_at: string;
}

interface PaymentLog {
  id: string;
  booking_id: string | null;
  gateway: string;
  action: string;
  status: string;
  request_data: any;
  response_data: any;
  error_message: string | null;
  duration_ms: number | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  paid: { icon: CheckCircle, color: "text-green-600 bg-green-100", label: "Paid" },
  initiated: { icon: Clock, color: "text-blue-600 bg-blue-100", label: "Initiated" },
  pending: { icon: Clock, color: "text-yellow-600 bg-yellow-100", label: "Pending" },
  failed: { icon: XCircle, color: "text-red-600 bg-red-100", label: "Failed" },
  cancelled: { icon: AlertTriangle, color: "text-gray-600 bg-gray-100", label: "Cancelled" },
};

const AdminTransactionLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [gatewayFilter, setGatewayFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedLog, setSelectedLog] = useState<PaymentLog | null>(null);

  const { data: transactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["admin-transactions", searchTerm, statusFilter, gatewayFilter],
    queryFn: async () => {
      let query = supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }
      if (gatewayFilter !== "all") {
        query = query.eq("payment_method", gatewayFilter);
      }
      if (searchTerm) {
        query = query.or(`transaction_id.ilike.%${searchTerm}%,gateway_transaction_id.ilike.%${searchTerm}%,booking_id.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const { data: paymentLogs, isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ["admin-payment-logs", gatewayFilter],
    queryFn: async () => {
      let query = supabase
        .from("payment_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (gatewayFilter !== "all") {
        query = query.eq("gateway", gatewayFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentLog[];
    },
  });

  const renderStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Transaction Logs
          </CardTitle>
          <CardDescription>
            View all payment transactions and debug logs for SSLCommerz, bKash, and Nagad
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="transactions" className="gap-2">
                <Receipt className="w-4 h-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="logs" className="gap-2">
                <Activity className="w-4 h-4" />
                Debug Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by transaction ID or booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="initiated">Initiated</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetchTransactions()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Transactions Table */}
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions?.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="text-sm">
                            {format(new Date(tx.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tx.gateway_name}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {tx.transaction_id?.slice(0, 20) || "-"}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(tx.amount)}
                          </TableCell>
                          <TableCell>{renderStatusBadge(tx.status)}</TableCell>
                          <TableCell>
                            <Badge variant={tx.is_live_mode ? "default" : "secondary"}>
                              {tx.is_live_mode ? "Live" : "Test"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(tx)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No transactions found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs">
              {/* Logs Filters */}
              <div className="flex gap-4 mb-6">
                <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Gateways</SelectItem>
                    <SelectItem value="sslcommerz">SSLCommerz</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={() => refetchLogs()}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {/* Logs Table */}
              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Gateway</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Error</TableHead>
                        <TableHead className="text-right">Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentLogs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {format(new Date(log.created_at), "HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.gateway}</Badge>
                          </TableCell>
                          <TableCell className="capitalize">{log.action}</TableCell>
                          <TableCell>{renderStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.duration_ms ? `${log.duration_ms}ms` : "-"}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-destructive text-xs">
                            {log.error_message || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paymentLogs?.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No logs found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.gateway_name} - {selectedTransaction?.transaction_id}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {renderStatusBadge(selectedTransaction.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-mono text-xs">{selectedTransaction.booking_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gateway Transaction ID</p>
                    <p className="font-mono text-xs">{selectedTransaction.gateway_transaction_id || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs">{selectedTransaction.ip_address || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verified At</p>
                    <p className="text-sm">
                      {selectedTransaction.verified_at 
                        ? format(new Date(selectedTransaction.verified_at), "MMM dd, yyyy HH:mm:ss")
                        : "-"
                      }
                    </p>
                  </div>
                </div>

                {selectedTransaction.error_message && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm text-destructive font-medium">Error Message</p>
                    <p className="text-sm">{selectedTransaction.error_message}</p>
                  </div>
                )}

                {selectedTransaction.request_payload && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Request Payload</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedTransaction.request_payload, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedTransaction.response_payload && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Response Payload</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedTransaction.response_payload, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog?.gateway} - {selectedLog?.action}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Action</p>
                    <p className="font-medium capitalize">{selectedLog.action}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {renderStatusBadge(selectedLog.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p>{selectedLog.duration_ms ? `${selectedLog.duration_ms}ms` : "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p>{format(new Date(selectedLog.created_at), "MMM dd, yyyy HH:mm:ss")}</p>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    <p className="text-sm text-destructive font-medium">Error Message</p>
                    <p className="text-sm">{selectedLog.error_message}</p>
                  </div>
                )}

                {selectedLog.request_data && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Request Data</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.request_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.response_data && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Response Data</p>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog.response_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionLogs;