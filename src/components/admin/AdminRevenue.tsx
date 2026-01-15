import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
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
  Legend,
} from "recharts";
import { TrendingUp, Package, Wallet } from "lucide-react";
import { formatCurrency, CURRENCY } from "@/lib/currency";

interface RevenueData {
  month: string;
  revenue: number;
  bookings: number;
}

interface PackageRevenue {
  name: string;
  revenue: number;
  bookings: number;
  type: string;
}

const COLORS = ["#006D5B", "#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B"];

const AdminRevenue = () => {
  const [monthlyData, setMonthlyData] = useState<RevenueData[]>([]);
  const [packageRevenue, setPackageRevenue] = useState<PackageRevenue[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    averageOrderValue: 0,
    hajjRevenue: 0,
    umrahRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Fetch all confirmed/completed bookings with package details
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          id,
          total_price,
          created_at,
          status,
          packages (
            title,
            type
          )
        `)
        .in("status", ["confirmed", "completed"]);

      if (error) throw error;

      if (bookings) {
        // Calculate totals
        const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
        const hajjBookings = bookings.filter(b => b.packages?.type === "hajj");
        const umrahBookings = bookings.filter(b => b.packages?.type === "umrah");

        setTotals({
          totalRevenue,
          totalBookings: bookings.length,
          averageOrderValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
          hajjRevenue: hajjBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
          umrahRevenue: umrahBookings.reduce((sum, b) => sum + Number(b.total_price), 0),
        });

        // Group by month
        const monthlyMap = new Map<string, { revenue: number; bookings: number }>();
        bookings.forEach((booking) => {
          const date = new Date(booking.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          const existing = monthlyMap.get(monthKey) || { revenue: 0, bookings: 0 };
          monthlyMap.set(monthKey, {
            revenue: existing.revenue + Number(booking.total_price),
            bookings: existing.bookings + 1,
          });
        });

        const monthlyArray: RevenueData[] = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({
            month: new Date(month + "-01").toLocaleDateString("en-US", {
              month: "short",
              year: "2-digit",
            }),
            ...data,
          }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setMonthlyData(monthlyArray);

        // Group by package
        const packageMap = new Map<string, { revenue: number; bookings: number; type: string }>();
        bookings.forEach((booking) => {
          const title = booking.packages?.title || "Unknown";
          const type = booking.packages?.type || "unknown";
          const existing = packageMap.get(title) || { revenue: 0, bookings: 0, type };
          packageMap.set(title, {
            revenue: existing.revenue + Number(booking.total_price),
            bookings: existing.bookings + 1,
            type,
          });
        });

        const packageArray: PackageRevenue[] = Array.from(packageMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.revenue - a.revenue);

        setPackageRevenue(packageArray);
      }
    } catch (error) {
      console.error("Error fetching revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  const pieData = [
    { name: "Hajj", value: totals.hajjRevenue },
    { name: "Umrah", value: totals.umrahRevenue },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(totals.totalRevenue)}
                  </p>
                </div>
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed Bookings</p>
                  <p className="text-3xl font-bold">{totals.totalBookings}</p>
                </div>
                <div className="bg-green-500/10 p-3 rounded-xl">
                  <Package className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(Math.round(totals.averageOrderValue))}
                  </p>
                </div>
                <div className="bg-secondary/10 p-3 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${CURRENCY.symbol}${value / 1000}k`} />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data available yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Package Type</CardTitle>
            <CardDescription>Hajj vs Umrah revenue distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Package Revenue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Package</CardTitle>
          <CardDescription>Breakdown of revenue per package</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packageRevenue.map((pkg) => (
                <TableRow key={pkg.name}>
                  <TableCell className="font-medium">{pkg.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {pkg.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{pkg.bookings}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(pkg.revenue)}</TableCell>
                  <TableCell>
                    {totals.totalRevenue > 0
                      ? ((pkg.revenue / totals.totalRevenue) * 100).toFixed(1)
                      : 0}
                    %
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {packageRevenue.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No revenue data available yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRevenue;
