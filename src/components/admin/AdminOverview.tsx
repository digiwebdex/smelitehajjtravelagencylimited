import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  ArrowUpRight
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'status_change' | 'document';
  title: string;
  description: string;
  timestamp: string;
  status?: string;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  pending: 'hsl(var(--chart-3))',
  confirmed: 'hsl(var(--chart-2))',
  completed: 'hsl(var(--chart-1))',
  cancelled: 'hsl(var(--chart-5))',
};

const AdminOverview = () => {
  const [bookingTrends, setBookingTrends] = useState<BookingTrend[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    weekRevenue: 0,
    pendingCount: 0,
    revenueChange: 0,
    bookingChange: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBookingTrends(),
        fetchRecentActivities(),
        fetchStatusDistribution(),
        fetchMonthlyRevenue(),
        fetchQuickStats(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingTrends = async () => {
    const endDate = new Date();
    const startDate = subDays(endDate, 30);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("created_at, total_price, status")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString());

    if (bookings) {
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      const trendData = dateRange.map(date => {
        const dateStr = format(date, "yyyy-MM-dd");
        const dayBookings = bookings.filter(b => 
          format(new Date(b.created_at), "yyyy-MM-dd") === dateStr
        );
        return {
          date: format(date, "MMM dd"),
          bookings: dayBookings.length,
          revenue: dayBookings
            .filter(b => b.status === "confirmed" || b.status === "completed")
            .reduce((sum, b) => sum + Number(b.total_price), 0),
        };
      });
      setBookingTrends(trendData);
    }
  };

  const fetchRecentActivities = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id, 
        created_at, 
        status, 
        tracking_status,
        guest_name,
        packages (title)
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (bookings) {
      const activities: RecentActivity[] = bookings.map(booking => ({
        id: booking.id,
        type: 'booking' as const,
        title: `New booking: ${booking.packages?.title || 'Package'}`,
        description: booking.guest_name || 'Customer',
        timestamp: booking.created_at,
        status: booking.status,
      }));
      setRecentActivities(activities);
    }
  };

  const fetchStatusDistribution = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("status");

    if (bookings) {
      const distribution = [
        { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, color: COLORS.pending },
        { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: COLORS.confirmed },
        { name: 'Completed', value: bookings.filter(b => b.status === 'completed').length, color: COLORS.completed },
        { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: COLORS.cancelled },
      ].filter(item => item.value > 0);
      setStatusDistribution(distribution);
    }
  };

  const fetchMonthlyRevenue = async () => {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("created_at, total_price, status")
      .in("status", ["confirmed", "completed"]);

    if (bookings) {
      const monthlyData: Record<string, number> = {};
      bookings.forEach(booking => {
        const month = format(new Date(booking.created_at), "MMM yyyy");
        monthlyData[month] = (monthlyData[month] || 0) + Number(booking.total_price);
      });

      const sortedMonths = Object.entries(monthlyData)
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-6);
      setMonthlyRevenue(sortedMonths);
    }
  };

  const fetchQuickStats = async () => {
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);
    const twoWeeksAgo = subDays(today, 14);

    const { data: allBookings } = await supabase
      .from("bookings")
      .select("created_at, total_price, status")
      .gte("created_at", twoWeeksAgo.toISOString());

    if (allBookings) {
      const todayBookings = allBookings.filter(b => 
        new Date(b.created_at) >= today
      ).length;

      const thisWeekBookings = allBookings.filter(b => 
        new Date(b.created_at) >= weekAgo
      );

      const lastWeekBookings = allBookings.filter(b => 
        new Date(b.created_at) >= twoWeeksAgo && new Date(b.created_at) < weekAgo
      );

      const thisWeekRevenue = thisWeekBookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_price), 0);

      const lastWeekRevenue = lastWeekBookings
        .filter(b => b.status === "confirmed" || b.status === "completed")
        .reduce((sum, b) => sum + Number(b.total_price), 0);

      const pendingCount = allBookings.filter(b => b.status === "pending").length;

      const revenueChange = lastWeekRevenue > 0 
        ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
        : 0;

      const bookingChange = lastWeekBookings.length > 0 
        ? ((thisWeekBookings.length - lastWeekBookings.length) / lastWeekBookings.length) * 100 
        : 0;

      setStats({
        todayBookings,
        weekBookings: thisWeekBookings.length,
        weekRevenue: thisWeekRevenue,
        pendingCount,
        revenueChange,
        bookingChange,
      });
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Today's Bookings</p>
                <p className="text-2xl font-bold">{stats.todayBookings}</p>
              </div>
              <div className="bg-primary/10 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{stats.weekBookings}</p>
                {stats.bookingChange !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs mt-1",
                    stats.bookingChange > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {stats.bookingChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(stats.bookingChange).toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="bg-blue-500/10 p-2 rounded-lg">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Week Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.weekRevenue)}</p>
                {stats.revenueChange !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-xs mt-1",
                    stats.revenueChange > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {stats.revenueChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(stats.revenueChange).toFixed(0)}%
                  </div>
                )}
              </div>
              <div className="bg-green-500/10 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
              </div>
              <div className="bg-yellow-500/10 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Trends</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bookingTrends}>
                  <defs>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorBookings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
            <CardDescription>Revenue breakdown by month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Latest bookings and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {recentActivities.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                recentActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="mt-0.5">
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.status}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.timestamp), "MMM dd, HH:mm")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
