import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { 
  Activity, 
  Search, 
  Filter, 
  User,
  Clock,
  FileText,
  ArrowRight,
  Eye,
  RefreshCw,
  Download
} from "lucide-react";
import { motion } from "framer-motion";

interface ActivityLog {
  id: string;
  staff_id: string | null;
  user_id: string | null;
  action_type: string;
  action_description: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  booking_ref: string | null;
  ip_address: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  };
}

const ACTION_TYPE_COLORS: Record<string, string> = {
  status_change: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  payment_update: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  booking_created: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  booking_deleted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  document_uploaded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  login: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  settings_changed: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  default: "bg-muted text-muted-foreground",
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("7days");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Calculate date filter
      const now = new Date();
      let dateFrom: string | null = null;
      
      if (dateFilter === "today") {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        dateFrom = startOfDay;
      } else if (dateFilter === "7days") {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        dateFrom = sevenDaysAgo;
      } else if (dateFilter === "30days") {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        dateFrom = thirtyDaysAgo;
      }

      // Fetch activity logs with date filter
      let query = supabase
        .from("staff_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      
      if (dateFrom) {
        query = query.gte("created_at", dateFrom);
      }

      const { data: logsData, error: logsError } = await query;

      if (logsError) throw logsError;

      // Fetch profiles for the user_ids
      const userIds = [...new Set((logsData || []).map(l => l.user_id).filter(Boolean))];
      let profiles: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        
        profilesData?.forEach(p => {
          profiles[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      // Combine data
      const combinedLogs = (logsData || []).map((log: any) => ({
        ...log,
        profile: log.user_id ? profiles[log.user_id] : undefined
      })) as ActivityLog[];
      
      setLogs(combinedLogs);
      
      // Extract unique action types
      const types = [...new Set(combinedLogs.map((log) => log.action_type))];
      setActionTypes(types);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.booking_ref?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action_type === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  const getActionBadgeColor = (actionType: string) => {
    return ACTION_TYPE_COLORS[actionType] || ACTION_TYPE_COLORS.default;
  };

  const formatActionType = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const exportToCSV = () => {
    const headers = ["Date/Time", "User", "Action", "Description", "Entity", "Booking Ref"];
    const rows = filteredLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.profile?.full_name || log.profile?.email || "System",
      formatActionType(log.action_type),
      log.action_description,
      log.entity_type || "-",
      log.booking_ref || "-",
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = {
    totalActions: filteredLogs.length,
    statusChanges: filteredLogs.filter((l) => l.action_type === "status_change").length,
    paymentUpdates: filteredLogs.filter((l) => l.action_type === "payment_update").length,
    uniqueUsers: new Set(filteredLogs.map((l) => l.user_id)).size,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Audit Log
          </h2>
          <p className="text-muted-foreground">
            Track all administrative actions and changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLogs} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold">{stats.totalActions}</p>
                </div>
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status Changes</p>
                  <p className="text-2xl font-bold">{stats.statusChanges}</p>
                </div>
                <ArrowRight className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Updates</p>
                  <p className="text-2xl font-bold">{stats.paymentUpdates}</p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
                </div>
                <User className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, action, booking..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {formatActionType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Period</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Detailed record of all administrative actions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date/Time</TableHead>
                  <TableHead className="whitespace-nowrap">User</TableHead>
                  <TableHead className="whitespace-nowrap">Action</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[300px]">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Booking Ref</TableHead>
                  <TableHead className="whitespace-nowrap">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">
                              {format(new Date(log.created_at), "MMM dd, yyyy")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "hh:mm a")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {log.profile?.full_name || "System"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {log.profile?.email || "Automated"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action_type)}>
                          {formatActionType(log.action_type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{log.action_description}</p>
                      </TableCell>
                      <TableCell>
                        {log.booking_ref ? (
                          <Badge variant="outline">{log.booking_ref}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Date/Time</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "PPpp")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p className="font-medium">
                    {selectedLog.profile?.full_name || selectedLog.profile?.email || "System"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action Type</Label>
                  <Badge className={getActionBadgeColor(selectedLog.action_type)}>
                    {formatActionType(selectedLog.action_type)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity Type</Label>
                  <p className="font-medium">{selectedLog.entity_type || "-"}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedLog.action_description}</p>
              </div>

              {selectedLog.booking_ref && (
                <div>
                  <Label className="text-muted-foreground">Booking Reference</Label>
                  <Badge variant="outline" className="mt-1">{selectedLog.booking_ref}</Badge>
                </div>
              )}

              {(selectedLog.old_value || selectedLog.new_value) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.old_value && (
                    <div>
                      <Label className="text-muted-foreground">Previous Value</Label>
                      <ScrollArea className="h-32 rounded-md border p-2 mt-1">
                        <pre className="text-xs">
                          {JSON.stringify(selectedLog.old_value, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                  {selectedLog.new_value && (
                    <div>
                      <Label className="text-muted-foreground">New Value</Label>
                      <ScrollArea className="h-32 rounded-md border p-2 mt-1">
                        <pre className="text-xs">
                          {JSON.stringify(selectedLog.new_value, null, 2)}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Additional Metadata</Label>
                  <ScrollArea className="h-32 rounded-md border p-2 mt-1">
                    <pre className="text-xs">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.ip_address && (
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono text-sm">{selectedLog.ip_address}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLog;
