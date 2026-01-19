import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
  Download,
  FileText,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
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

  const exportToCSV = () => {
    try {
      setExporting(true);
      
      // Summary section
      let csvContent = "INSTALLMENT REPORT\n";
      csvContent += `Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}\n\n`;
      
      csvContent += "SUMMARY\n";
      csvContent += `Total Installment Plans,${summary.totalEMIPlans}\n`;
      csvContent += `Total Expected,${summary.totalExpected}\n`;
      csvContent += `Total Collected,${summary.totalCollected}\n`;
      csvContent += `Pending Amount,${summary.totalPending}\n`;
      csvContent += `Overdue Amount,${summary.totalOverdue}\n`;
      csvContent += `Overdue Count,${summary.overdueCount}\n`;
      csvContent += `Collection Rate,${summary.collectionRate.toFixed(1)}%\n\n`;
      
      // Monthly trends
      csvContent += "MONTHLY COLLECTION TRENDS\n";
      csvContent += "Month,Expected,Collected\n";
      monthlyTrends.forEach(trend => {
        csvContent += `${trend.month},${trend.expected},${trend.collected}\n`;
      });
      csvContent += "\n";
      
      // Status distribution
      csvContent += "PAYMENT STATUS DISTRIBUTION\n";
      csvContent += "Status,Amount\n";
      statusDistribution.forEach(item => {
        csvContent += `${item.name},${item.value}\n`;
      });
      csvContent += "\n";
      
      // Overdue installments
      if (overdueInstallments.length > 0) {
        csvContent += "OVERDUE INSTALLMENTS\n";
        csvContent += "Customer,Package,Installment,Amount,Due Date,Days Overdue\n";
        overdueInstallments.forEach(item => {
          const daysOverdue = Math.floor(
            (new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          csvContent += `"${item.customer_name}","${item.package_name}",Installment #${item.installment_number},${item.amount},${format(new Date(item.due_date), "dd MMM yyyy")},${daysOverdue}\n`;
        });
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `installment-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
      link.click();
      
      toast({
        title: "Export Successful",
        description: "CSV report downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export CSV report.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    try {
      setExporting(true);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Installment Report", pageWidth / 2, 20, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pageWidth / 2, 28, { align: "center" });
      
      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Summary", 14, 42);
      
      autoTable(doc, {
        startY: 46,
        head: [["Metric", "Value"]],
        body: [
          ["Total Installment Plans", summary.totalEMIPlans.toString()],
          ["Total Expected", `৳${summary.totalExpected.toLocaleString()}`],
          ["Total Collected", `৳${summary.totalCollected.toLocaleString()}`],
          ["Pending Amount", `৳${summary.totalPending.toLocaleString()}`],
          ["Overdue Amount", `৳${summary.totalOverdue.toLocaleString()}`],
          ["Overdue Count", `${summary.overdueCount} installments`],
          ["Collection Rate", `${summary.collectionRate.toFixed(1)}%`],
        ],
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Monthly trends
      let yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Monthly Collection Trends", 14, yPos);
      
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Month", "Expected (৳)", "Collected (৳)"]],
        body: monthlyTrends.map(trend => [
          trend.month,
          trend.expected.toLocaleString(),
          trend.collected.toLocaleString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Status distribution
      yPos = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Payment Status Distribution", 14, yPos);
      
      autoTable(doc, {
        startY: yPos + 4,
        head: [["Status", "Amount (৳)"]],
        body: statusDistribution.map(item => [
          item.name,
          item.value.toLocaleString(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      // Overdue installments (new page if needed)
      if (overdueInstallments.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Overdue Installments", 14, 20);
        
        autoTable(doc, {
          startY: 24,
          head: [["Customer", "Package", "Installment", "Amount (৳)", "Due Date", "Days Overdue"]],
          body: overdueInstallments.map(item => {
            const daysOverdue = Math.floor(
              (new Date().getTime() - new Date(item.due_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            return [
              item.customer_name,
              item.package_name,
              `#${item.installment_number}`,
              item.amount.toLocaleString(),
              format(new Date(item.due_date), "dd MMM yyyy"),
              `${daysOverdue} days`,
            ];
          }),
          theme: "striped",
          headStyles: { fillColor: [239, 68, 68] },
        });
      }
      
      // Save PDF
      doc.save(`installment-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      
      toast({
        title: "Export Successful",
        description: "PDF report downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF report.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
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
      title: "Total Installment Plans",
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
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={exporting}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          onClick={exportToPDF}
          disabled={exporting}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

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
                        <TableCell>Installment #{item.installment_number}</TableCell>
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
