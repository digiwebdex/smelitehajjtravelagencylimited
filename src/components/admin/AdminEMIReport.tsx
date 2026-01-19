import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  Users,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EMISummary {
  totalEMIPlans: number;
  totalExpected: number;
  totalCollected: number;
  totalPending: number;
  totalOverdue: number;
  overdueCount: number;
  collectionRate: number;
}

interface MonthlyTrend {
  month: string;
  collected: number;
  expected: number;
}

interface OverdueInstallment {
  id: string;
  booking_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  customer_name: string;
  package_name: string;
}

interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

const AdminEMIReport = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EMISummary>({
    totalEMIPlans: 0,
    totalExpected: 0,
    totalCollected: 0,
    totalPending: 0,
    totalOverdue: 0,
    overdueCount: 0,
    collectionRate: 0,
  });
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [overdueInstallments, setOverdueInstallments] = useState<OverdueInstallment[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([]);

  useEffect(() => {
    fetchEMIData();
  }, []);

  const fetchEMIData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSummary(),
        fetchMonthlyTrends(),
        fetchOverdueInstallments(),
        fetchStatusDistribution(),
      ]);
    } catch (error) {
      console.error("Error fetching EMI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    const { data: emiPayments } = await supabase
      .from("emi_payments")
      .select("*");

    const { data: installments } = await supabase
      .from("emi_installments")
      .select("*");

    if (emiPayments && installments) {
      const totalExpected = emiPayments.reduce((sum, p) => sum + Number(p.total_amount) - Number(p.advance_amount), 0);
      const paidInstallments = installments.filter(i => i.status === "paid");
      const totalCollected = paidInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
      const pendingInstallments = installments.filter(i => i.status === "pending");
      const totalPending = pendingInstallments.reduce((sum, i) => sum + Number(i.amount), 0);
      
      const today = new Date();
      const overdueItems = installments.filter(i => 
        i.status === "pending" && i.due_date && new Date(i.due_date) < today
      );
      const totalOverdue = overdueItems.reduce((sum, i) => sum + Number(i.amount), 0);

      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      setSummary({
        totalEMIPlans: emiPayments.length,
        totalExpected,
        totalCollected,
        totalPending,
        totalOverdue,
        overdueCount: overdueItems.length,
        collectionRate,
      });
    }
  };

  const fetchMonthlyTrends = async () => {
    const trends: MonthlyTrend[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const { data: paidInstallments } = await supabase
        .from("emi_installments")
        .select("amount, paid_date")
        .eq("status", "paid")
        .gte("paid_date", monthStart.toISOString())
        .lte("paid_date", monthEnd.toISOString());

      const { data: dueInstallments } = await supabase
        .from("emi_installments")
        .select("amount, due_date")
        .gte("due_date", format(monthStart, "yyyy-MM-dd"))
        .lte("due_date", format(monthEnd, "yyyy-MM-dd"));

      const collected = paidInstallments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const expected = dueInstallments?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      trends.push({
        month: format(monthDate, "MMM yyyy"),
        collected,
        expected,
      });
    }

    setMonthlyTrends(trends);
  };

  const fetchOverdueInstallments = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    
    const { data: overdue } = await supabase
      .from("emi_installments")
      .select(`
        id,
        installment_number,
        amount,
        due_date,
        emi_payment_id
      `)
      .eq("status", "pending")
      .lt("due_date", today)
      .order("due_date", { ascending: true })
      .limit(10);

    if (overdue && overdue.length > 0) {
      const emiPaymentIds = [...new Set(overdue.map(o => o.emi_payment_id))];
      
      const { data: emiPayments } = await supabase
        .from("emi_payments")
        .select("id, booking_id")
        .in("id", emiPaymentIds);

      if (emiPayments) {
        const bookingIds = [...new Set(emiPayments.map(e => e.booking_id))];
        
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, guest_name, user_id, package_id")
          .in("id", bookingIds);

        const { data: packages } = await supabase
          .from("packages")
          .select("id, title");

        const enrichedOverdue: OverdueInstallment[] = overdue.map(item => {
          const emiPayment = emiPayments.find(e => e.id === item.emi_payment_id);
          const booking = bookings?.find(b => b.id === emiPayment?.booking_id);
          const pkg = packages?.find(p => p.id === booking?.package_id);

          return {
            id: item.id,
            booking_id: emiPayment?.booking_id || "",
            installment_number: item.installment_number,
            amount: Number(item.amount),
            due_date: item.due_date || "",
            customer_name: booking?.guest_name || "Unknown",
            package_name: pkg?.title || "Unknown Package",
          };
        });

        setOverdueInstallments(enrichedOverdue);
      }
    }
  };

  const fetchStatusDistribution = async () => {
    const { data: installments } = await supabase
      .from("emi_installments")
      .select("status, amount");

    if (installments) {
      const paid = installments.filter(i => i.status === "paid").reduce((sum, i) => sum + Number(i.amount), 0);
      const pending = installments.filter(i => i.status === "pending").reduce((sum, i) => sum + Number(i.amount), 0);
      const overdue = installments.filter(i => i.status === "overdue").reduce((sum, i) => sum + Number(i.amount), 0);

      setStatusDistribution([
        { name: "Paid", value: paid, color: "hsl(var(--chart-2))" },
        { name: "Pending", value: pending, color: "hsl(var(--chart-4))" },
        { name: "Overdue", value: overdue, color: "hsl(var(--chart-1))" },
      ]);
    }
  };

  const chartConfig = {
    collected: {
      label: "Collected",
      color: "hsl(var(--chart-2))",
    },
    expected: {
      label: "Expected",
      color: "hsl(var(--chart-3))",
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      title: "Total EMI Plans",
      value: summary.totalEMIPlans,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Collected",
      value: formatCurrency(summary.totalCollected),
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Pending Amount",
      value: formatCurrency(summary.totalPending),
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Overdue Amount",
      value: formatCurrency(summary.totalOverdue),
      subtitle: `${summary.overdueCount} installments`,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                  {card.subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                  )}
                </div>
                <div className={`${card.bgColor} p-3 rounded-xl`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Collection Rate Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-4 rounded-xl">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-3xl font-bold">{summary.collectionRate.toFixed(1)}%</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Expected vs Collected</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summary.totalCollected)} / {formatCurrency(summary.totalExpected)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Monthly Collection Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => formatCurrency(Number(value))}
                    />} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="expected" 
                    fill="hsl(var(--chart-3))" 
                    name="Expected" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="collected" 
                    fill="hsl(var(--chart-2))" 
                    name="Collected" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Payment Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {statusDistribution.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Installments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Overdue Installments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueInstallments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No overdue installments! All payments are on track.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Installment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueInstallments.map((item) => {
                    const daysOverdue = Math.floor(
                      (new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customer_name}</TableCell>
                        <TableCell>{item.package_name}</TableCell>
                        <TableCell>EMI #{item.installment_number}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(item.amount)}</TableCell>
                        <TableCell>{format(new Date(item.due_date), "dd MMM yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{daysOverdue} days</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEMIReport;
