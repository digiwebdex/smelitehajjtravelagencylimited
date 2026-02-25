import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Search,
  Download,
  FileSpreadsheet,
  Loader2,
  TrendingUp,
  Wallet,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { format, getYear } from "date-fns";
import * as XLSX from "xlsx";

interface BookingRow {
  id: string;
  created_at: string;
  total_price: number;
  passenger_count: number;
  payment_status: string;
  status: string;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  user_id: string | null;
  passenger_details: Record<string, string> | null;
  packages: {
    id: string;
    title: string;
    type: string;
  } | null;
}

interface HajjiRecord {
  name: string;
  phone: string;
  email: string;
  totalBookings: number;
  totalRevenue: number;
  totalPassengers: number;
  packages: string[];
  lastBookingDate: string;
  paymentStatuses: string[];
}

const COLORS = ["#006D5B", "#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

const AdminHajjiReports = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("revenue");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, created_at, total_price, passenger_count, payment_status, status,
          guest_name, guest_phone, guest_email, user_id, passenger_details,
          packages (id, title, type)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with profile names
      if (data) {
        const userIds = [...new Set(data.filter(b => b.user_id).map(b => b.user_id))];
        let profileMap = new Map<string, { full_name: string | null; email: string | null; phone: string | null }>();

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", userIds);
          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, p]));
          }
        }

        const enriched = data.map(b => {
          if (b.user_id && profileMap.has(b.user_id)) {
            const profile = profileMap.get(b.user_id)!;
            return {
              ...b,
              guest_name: b.guest_name || profile.full_name || "Unknown",
              guest_email: b.guest_email || profile.email || "",
              guest_phone: b.guest_phone || profile.phone || "",
            };
          }
          return b;
        });

        setBookings(enriched as BookingRow[]);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = [...new Set(bookings.map(b => getYear(new Date(b.created_at))))].sort((a, b) => b - a);
    return years;
  }, [bookings]);

  // Group bookings by Hajji (customer name + phone as key)
  const hajjiRecords = useMemo(() => {
    const filtered = selectedYear === "all"
      ? bookings
      : bookings.filter(b => getYear(new Date(b.created_at)) === parseInt(selectedYear));

    const map = new Map<string, HajjiRecord>();

    filtered.forEach(b => {
      const name = (b.guest_name || "Unknown Guest").trim();
      const phone = (b.guest_phone || "").trim();
      const key = `${name.toLowerCase()}_${phone}`;

      const existing = map.get(key) || {
        name,
        phone,
        email: b.guest_email || "",
        totalBookings: 0,
        totalRevenue: 0,
        totalPassengers: 0,
        packages: [],
        lastBookingDate: b.created_at,
        paymentStatuses: [],
      };

      existing.totalBookings += 1;
      existing.totalPassengers += b.passenger_count;

      if (b.status === "confirmed" || b.status === "completed") {
        existing.totalRevenue += Number(b.total_price);
      }

      if (b.packages?.title && !existing.packages.includes(b.packages.title)) {
        existing.packages.push(b.packages.title);
      }

      existing.paymentStatuses.push(b.payment_status);

      if (new Date(b.created_at) > new Date(existing.lastBookingDate)) {
        existing.lastBookingDate = b.created_at;
      }

      if (!existing.email && b.guest_email) {
        existing.email = b.guest_email;
      }

      map.set(key, existing);
    });

    let records = Array.from(map.values());

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      records = records.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortBy === "revenue") records.sort((a, b) => b.totalRevenue - a.totalRevenue);
    else if (sortBy === "bookings") records.sort((a, b) => b.totalBookings - a.totalBookings);
    else if (sortBy === "passengers") records.sort((a, b) => b.totalPassengers - a.totalPassengers);
    else if (sortBy === "recent") records.sort((a, b) => new Date(b.lastBookingDate).getTime() - new Date(a.lastBookingDate).getTime());
    else if (sortBy === "name") records.sort((a, b) => a.name.localeCompare(b.name));

    return records;
  }, [bookings, selectedYear, searchQuery, sortBy]);

  // Summary stats
  const summary = useMemo(() => {
    return {
      totalHajjis: hajjiRecords.length,
      totalRevenue: hajjiRecords.reduce((s, r) => s + r.totalRevenue, 0),
      totalBookings: hajjiRecords.reduce((s, r) => s + r.totalBookings, 0),
      totalPassengers: hajjiRecords.reduce((s, r) => s + r.totalPassengers, 0),
      avgRevenuePerHajji: hajjiRecords.length > 0
        ? hajjiRecords.reduce((s, r) => s + r.totalRevenue, 0) / hajjiRecords.length
        : 0,
    };
  }, [hajjiRecords]);

  // Top 10 Hajjis by revenue for chart
  const topHajjisChart = useMemo(() => {
    return hajjiRecords.slice(0, 10).map(r => ({
      name: r.name.length > 15 ? r.name.slice(0, 15) + "…" : r.name,
      revenue: r.totalRevenue,
      bookings: r.totalBookings,
    }));
  }, [hajjiRecords]);

  // Booking frequency distribution
  const frequencyDistribution = useMemo(() => {
    const freq = { "1 Booking": 0, "2 Bookings": 0, "3+ Bookings": 0 };
    hajjiRecords.forEach(r => {
      if (r.totalBookings === 1) freq["1 Booking"]++;
      else if (r.totalBookings === 2) freq["2 Bookings"]++;
      else freq["3+ Bookings"]++;
    });
    return Object.entries(freq).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [hajjiRecords]);

  const getPaymentBadge = (statuses: string[]) => {
    if (statuses.every(s => s === "paid")) return <Badge className="bg-green-500/10 text-green-600 border-green-200">Fully Paid</Badge>;
    if (statuses.some(s => s === "paid")) return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">Partial</Badge>;
    if (statuses.some(s => s === "partial" || s === "emi_pending")) return <Badge className="bg-purple-500/10 text-purple-600 border-purple-200">EMI</Badge>;
    return <Badge variant="secondary">Pending</Badge>;
  };

  const exportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      const data = [
        ["Hajji Name", "Phone", "Email", "Total Bookings", "Total Passengers", "Total Revenue (BDT)", "Packages", "Last Booking", "Payment Status"],
        ...hajjiRecords.map(r => [
          r.name,
          r.phone,
          r.email,
          r.totalBookings,
          r.totalPassengers,
          r.totalRevenue,
          r.packages.join(", "),
          format(new Date(r.lastBookingDate), "dd MMM yyyy"),
          r.paymentStatuses.every(s => s === "paid") ? "Fully Paid" : r.paymentStatuses.some(s => s === "paid") ? "Partial" : "Pending",
        ]),
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      ws["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 35 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, "Hajji Report");

      XLSX.writeFile(wb, `hajji-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      toast({ title: "Export Successful", description: "Hajji report downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "Failed to export report.", variant: "destructive" });
    }
  };

  const exportToCSV = () => {
    try {
      let csv = "\uFEFF";
      csv += "HAJJI-WISE REPORT\r\n";
      csv += `"Generated:","${format(new Date(), "dd MMM yyyy")}"\r\n\r\n`;
      csv += `"Hajji Name","Phone","Email","Total Bookings","Total Passengers","Revenue","Packages","Last Booking","Payment"\r\n`;

      hajjiRecords.forEach(r => {
        const payment = r.paymentStatuses.every(s => s === "paid") ? "Fully Paid" : "Pending";
        csv += `"${r.name}","${r.phone}","${r.email}","${r.totalBookings}","${r.totalPassengers}","${r.totalRevenue}","${r.packages.join("; ")}","${format(new Date(r.lastBookingDate), "dd MMM yyyy")}","${payment}"\r\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `hajji-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      toast({ title: "Export Successful", description: "CSV report downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "Failed to export.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Hajji-wise Reports
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Revenue and booking analytics by individual Hajji
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hajjis</p>
                <p className="text-3xl font-bold">{summary.totalHajjis}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Bookings</p>
                <p className="text-3xl font-bold">{summary.totalBookings}</p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Package className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Passengers</p>
                <p className="text-3xl font-bold">{summary.totalPassengers}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Users className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Revenue/Hajji</p>
                <p className="text-2xl font-bold">{formatCurrency(Math.round(summary.avgRevenuePerHajji))}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Hajjis by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {topHajjisChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topHajjisChart} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                    <YAxis dataKey="name" type="category" className="text-xs" width={120} />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Booking Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {frequencyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={frequencyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {frequencyDistribution.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hajji Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(y => (
                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Highest Revenue</SelectItem>
                <SelectItem value="bookings">Most Bookings</SelectItem>
                <SelectItem value="passengers">Most Passengers</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">#</TableHead>
                  <TableHead>Hajji Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Bookings</TableHead>
                  <TableHead className="text-center">Passengers</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Packages</TableHead>
                  <TableHead>Last Booking</TableHead>
                  <TableHead>Payment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hajjiRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No Hajji records found
                    </TableCell>
                  </TableRow>
                ) : (
                  hajjiRecords.map((record, index) => (
                    <TableRow key={`${record.name}_${record.phone}_${index}`}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell className="text-sm">{record.phone || "—"}</TableCell>
                      <TableCell className="text-center">{record.totalBookings}</TableCell>
                      <TableCell className="text-center">{record.totalPassengers}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(record.totalRevenue)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {record.packages.slice(0, 2).map(p => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                          {record.packages.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{record.packages.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(record.lastBookingDate), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{getPaymentBadge(record.paymentStatuses)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground mt-2">
            Showing {hajjiRecords.length} Hajji(s) • Revenue calculated from confirmed/completed bookings only
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHajjiReports;
