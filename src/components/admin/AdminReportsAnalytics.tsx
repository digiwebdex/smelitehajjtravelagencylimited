import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTenantPackages } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AreaChart,
  Area,
} from "recharts";
import {
  TrendingUp,
  Package,
  Wallet,
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  Users,
  BarChart3,
  PieChartIcon,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, CURRENCY } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, getYear, getMonth } from "date-fns";

interface BookingData {
  id: string;
  created_at: string;
  total_price: number;
  passenger_count: number;
  payment_status: string;
  payment_method: string | null;
  status: string;
  guest_name: string | null;
  packages: {
    id: string;
    title: string;
    type: string;
  };
  profiles?: {
    full_name: string | null;
  } | null;
}

interface PackageStats {
  id: string;
  name: string;
  type: string;
  bookings: number;
  passengers: number;
  revenue: number;
  fullPayments: number;
  installments: number;
  partialPayments: number;
}

interface MonthlyStats {
  month: string;
  monthNum: number;
  year: number;
  bookings: number;
  revenue: number;
  passengers: number;
}

interface YearlyStats {
  year: number;
  bookings: number;
  revenue: number;
  passengers: number;
  packages: PackageStats[];
}

const COLORS = ["#006D5B", "#D4AF37", "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899"];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const AdminReportsAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [packages, setPackages] = useState<{ id: string; title: string; type: string }[]>([]);

  // Filters
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedPackage, setSelectedPackage] = useState<string>("all");

  // Available years for filter
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all bookings with package details
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          id,
          created_at,
          total_price,
          passenger_count,
          payment_status,
          payment_method,
          status,
          guest_name,
          user_id,
          packages (
            id,
            title,
            type
          )
        `)
        .order("created_at", { ascending: false });

      if (bookingError) throw bookingError;

      // Fetch profiles for registered users
      if (bookingData) {
        const userIds = [...new Set(bookingData.filter(b => b.user_id).map(b => b.user_id))];
        let profileMap = new Map();
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds);
          
          if (profiles) {
            profileMap = new Map(profiles.map(p => [p.id, p]));
          }
        }

        const enrichedBookings = bookingData.map(b => ({
          ...b,
          profiles: b.user_id ? profileMap.get(b.user_id) || null : null,
        }));

        setBookings(enrichedBookings as BookingData[]);

        // Extract available years
        const years = [...new Set(enrichedBookings.map(b => getYear(new Date(b.created_at))))].sort((a, b) => b - a);
        setAvailableYears(years);
      }

      // Fetch all packages
      const { data: packageData } = await getTenantPackages({
        select: "id, title, type",
        activeOnly: true,
        orderBy: { column: "title", ascending: true },
      });

      if (packageData) {
        setPackages(packageData);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on selections
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      const bookingYear = getYear(bookingDate);
      const bookingMonth = getMonth(bookingDate);

      // Year filter
      if (selectedYear !== "all" && bookingYear !== parseInt(selectedYear)) {
        return false;
      }

      // Month filter
      if (selectedMonth !== "all" && bookingMonth !== parseInt(selectedMonth)) {
        return false;
      }

      // Package filter
      if (selectedPackage !== "all" && booking.packages?.id !== selectedPackage) {
        return false;
      }

      return true;
    });
  }, [bookings, selectedYear, selectedMonth, selectedPackage]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const confirmedBookings = filteredBookings.filter(b => 
      b.status === "confirmed" || b.status === "completed"
    );

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
    const totalBookings = filteredBookings.length;
    const totalPassengers = filteredBookings.reduce((sum, b) => sum + b.passenger_count, 0);
    const avgOrderValue = confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0;

    // Payment breakdown
    const fullPayments = filteredBookings.filter(b => b.payment_status === "paid").length;
    const installments = filteredBookings.filter(b => 
      b.payment_status === "partial" || b.payment_status === "emi_pending"
    ).length;
    const pendingPayments = filteredBookings.filter(b => 
      b.payment_status === "pending" || b.payment_status === "pending_cash" || b.payment_status === "pending_verification"
    ).length;

    return {
      totalRevenue,
      totalBookings,
      totalPassengers,
      avgOrderValue,
      fullPayments,
      installments,
      pendingPayments,
      confirmedBookings: confirmedBookings.length,
    };
  }, [filteredBookings]);

  // Package-wise statistics
  const packageStats = useMemo(() => {
    const statsMap = new Map<string, PackageStats>();

    filteredBookings.forEach(booking => {
      if (!booking.packages) return;

      const pkgId = booking.packages.id;
      const existing = statsMap.get(pkgId) || {
        id: pkgId,
        name: booking.packages.title,
        type: booking.packages.type,
        bookings: 0,
        passengers: 0,
        revenue: 0,
        fullPayments: 0,
        installments: 0,
        partialPayments: 0,
      };

      existing.bookings += 1;
      existing.passengers += booking.passenger_count;
      
      if (booking.status === "confirmed" || booking.status === "completed") {
        existing.revenue += Number(booking.total_price);
      }

      if (booking.payment_status === "paid") {
        existing.fullPayments += 1;
      } else if (booking.payment_status === "partial" || booking.payment_status === "emi_pending") {
        existing.installments += 1;
      } else {
        existing.partialPayments += 1;
      }

      statsMap.set(pkgId, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [filteredBookings]);

  // Monthly statistics
  const monthlyStats = useMemo(() => {
    const statsMap = new Map<string, MonthlyStats>();

    filteredBookings.forEach(booking => {
      const date = new Date(booking.created_at);
      const year = getYear(date);
      const monthNum = getMonth(date);
      const key = `${year}-${monthNum}`;

      const existing = statsMap.get(key) || {
        month: MONTHS[monthNum],
        monthNum,
        year,
        bookings: 0,
        revenue: 0,
        passengers: 0,
      };

      existing.bookings += 1;
      existing.passengers += booking.passenger_count;
      
      if (booking.status === "confirmed" || booking.status === "completed") {
        existing.revenue += Number(booking.total_price);
      }

      statsMap.set(key, existing);
    });

    return Array.from(statsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthNum - b.monthNum;
    });
  }, [filteredBookings]);

  // Payment type distribution for pie chart
  const paymentDistribution = useMemo(() => {
    return [
      { name: "Full Payment", value: summaryStats.fullPayments, color: "#10B981" },
      { name: "Installment", value: summaryStats.installments, color: "#8B5CF6" },
      { name: "Pending", value: summaryStats.pendingPayments, color: "#F59E0B" },
    ].filter(d => d.value > 0);
  }, [summaryStats]);

  // Package type distribution
  const packageTypeDistribution = useMemo(() => {
    const hajjBookings = filteredBookings.filter(b => b.packages?.type === "hajj");
    const umrahBookings = filteredBookings.filter(b => b.packages?.type === "umrah");

    const hajjRevenue = hajjBookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + Number(b.total_price), 0);
    const umrahRevenue = umrahBookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + Number(b.total_price), 0);

    return [
      { name: "Hajj", bookings: hajjBookings.length, revenue: hajjRevenue },
      { name: "Umrah", bookings: umrahBookings.length, revenue: umrahRevenue },
    ];
  }, [filteredBookings]);

  // Export functions
  const getFilterDescription = () => {
    const parts = [];
    if (selectedYear !== "all") parts.push(`Year: ${selectedYear}`);
    if (selectedMonth !== "all") parts.push(`Month: ${MONTHS[parseInt(selectedMonth)]}`);
    if (selectedPackage !== "all") {
      const pkg = packages.find(p => p.id === selectedPackage);
      if (pkg) parts.push(`Package: ${pkg.title}`);
    }
    return parts.length > 0 ? parts.join(", ") : "All Data";
  };

  const exportToCSV = () => {
    try {
      setExporting(true);
      
      let csvContent = "S M ELITE HAJJ - BOOKING & REVENUE REPORT\r\n";
      csvContent += `"Generated on:","${format(new Date(), "dd MMM yyyy, hh:mm a")}"\r\n`;
      csvContent += `"Filter:","${getFilterDescription()}"\r\n\r\n`;

      // Summary
      csvContent += "SUMMARY\r\n";
      csvContent += `"Total Bookings","${summaryStats.totalBookings}"\r\n`;
      csvContent += `"Confirmed Bookings","${summaryStats.confirmedBookings}"\r\n`;
      csvContent += `"Total Passengers","${summaryStats.totalPassengers}"\r\n`;
      csvContent += `"Total Revenue","${summaryStats.totalRevenue}"\r\n`;
      csvContent += `"Average Order Value","${Math.round(summaryStats.avgOrderValue)}"\r\n`;
      csvContent += `"Full Payments","${summaryStats.fullPayments}"\r\n`;
      csvContent += `"Installment Payments","${summaryStats.installments}"\r\n`;
      csvContent += `"Pending Payments","${summaryStats.pendingPayments}"\r\n\r\n`;

      // Package-wise breakdown
      csvContent += "PACKAGE-WISE BREAKDOWN\r\n";
      csvContent += `"Package","Type","Bookings","Passengers","Revenue","Full Payments","Installments","Pending"\r\n`;
      packageStats.forEach(pkg => {
        csvContent += `"${pkg.name}","${pkg.type}","${pkg.bookings}","${pkg.passengers}","${pkg.revenue}","${pkg.fullPayments}","${pkg.installments}","${pkg.partialPayments}"\r\n`;
      });
      csvContent += "\r\n";

      // Monthly breakdown
      csvContent += "MONTHLY BREAKDOWN\r\n";
      csvContent += `"Month","Year","Bookings","Passengers","Revenue"\r\n`;
      monthlyStats.forEach(stat => {
        csvContent += `"${stat.month}","${stat.year}","${stat.bookings}","${stat.passengers}","${stat.revenue}"\r\n`;
      });
      csvContent += "\r\n";

      // Individual bookings
      csvContent += "BOOKING DETAILS\r\n";
      csvContent += `"Booking ID","Date","Customer","Package","Type","Passengers","Amount","Payment Type","Payment Status","Status"\r\n`;
      filteredBookings.forEach(booking => {
        const customerName = booking.profiles?.full_name || booking.guest_name || "Guest";
        const paymentType = booking.payment_status === "paid" ? "Full" : 
          (booking.payment_status === "partial" || booking.payment_status === "emi_pending") ? "Installment" : "Pending";
        csvContent += `"${booking.id.slice(0, 8).toUpperCase()}","${format(new Date(booking.created_at), "dd MMM yyyy")}","${customerName}","${booking.packages?.title || 'N/A'}","${booking.packages?.type || 'N/A'}","${booking.passenger_count}","${booking.total_price}","${paymentType}","${booking.payment_status}","${booking.status}"\r\n`;
      });

      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `booking-revenue-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
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

  const exportToExcel = () => {
    try {
      setExporting(true);
      
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["S M ELITE HAJJ - BOOKING & REVENUE REPORT"],
        ["Generated on:", format(new Date(), "dd MMM yyyy, hh:mm a")],
        ["Filter:", getFilterDescription()],
        [],
        ["SUMMARY"],
        ["Total Bookings", summaryStats.totalBookings],
        ["Confirmed Bookings", summaryStats.confirmedBookings],
        ["Total Passengers", summaryStats.totalPassengers],
        ["Total Revenue", summaryStats.totalRevenue],
        ["Average Order Value", Math.round(summaryStats.avgOrderValue)],
        ["Full Payments", summaryStats.fullPayments],
        ["Installment Payments", summaryStats.installments],
        ["Pending Payments", summaryStats.pendingPayments],
      ];
      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      summaryWs["!cols"] = [{ wch: 25 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

      // Package-wise Sheet
      const packageData = [
        ["Package", "Type", "Bookings", "Passengers", "Revenue", "Full Payments", "Installments", "Pending"],
        ...packageStats.map(pkg => [
          pkg.name, pkg.type, pkg.bookings, pkg.passengers, pkg.revenue, pkg.fullPayments, pkg.installments, pkg.partialPayments
        ])
      ];
      const packageWs = XLSX.utils.aoa_to_sheet(packageData);
      packageWs["!cols"] = [{ wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, packageWs, "Package Revenue");

      // Monthly Sheet
      const monthlyData = [
        ["Month", "Year", "Bookings", "Passengers", "Revenue"],
        ...monthlyStats.map(stat => [stat.month, stat.year, stat.bookings, stat.passengers, stat.revenue])
      ];
      const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
      monthlyWs["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Trends");

      // Bookings Sheet
      const bookingsData = [
        ["Booking ID", "Date", "Customer", "Package", "Type", "Passengers", "Amount", "Payment Type", "Payment Status", "Status"],
        ...filteredBookings.map(booking => {
          const customerName = booking.profiles?.full_name || booking.guest_name || "Guest";
          const paymentType = booking.payment_status === "paid" ? "Full" : 
            (booking.payment_status === "partial" || booking.payment_status === "emi_pending") ? "Installment" : "Pending";
          return [
            booking.id.slice(0, 8).toUpperCase(),
            format(new Date(booking.created_at), "dd MMM yyyy"),
            customerName,
            booking.packages?.title || "N/A",
            booking.packages?.type || "N/A",
            booking.passenger_count,
            booking.total_price,
            paymentType,
            booking.payment_status,
            booking.status
          ];
        })
      ];
      const bookingsWs = XLSX.utils.aoa_to_sheet(bookingsData);
      bookingsWs["!cols"] = [{ wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, bookingsWs, "All Bookings");

      XLSX.writeFile(wb, `booking-revenue-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);

      toast({
        title: "Export Successful",
        description: "Excel report downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export Excel report.",
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
      doc.setFontSize(18);
      doc.setTextColor(0, 109, 91);
      doc.text("S M ELITE HAJJ", pageWidth / 2, 15, { align: "center" });
      
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Booking & Revenue Report", pageWidth / 2, 23, { align: "center" });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pageWidth / 2, 30, { align: "center" });
      doc.text(`Filter: ${getFilterDescription()}`, pageWidth / 2, 36, { align: "center" });

      // Summary Table
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text("Summary", 14, 48);

      autoTable(doc, {
        startY: 52,
        head: [["Metric", "Value"]],
        body: [
          ["Total Bookings", summaryStats.totalBookings.toString()],
          ["Confirmed Bookings", summaryStats.confirmedBookings.toString()],
          ["Total Passengers", summaryStats.totalPassengers.toString()],
          ["Total Revenue", `${CURRENCY.symbol}${summaryStats.totalRevenue.toLocaleString()}`],
          ["Average Order Value", `${CURRENCY.symbol}${Math.round(summaryStats.avgOrderValue).toLocaleString()}`],
          ["Full Payments", summaryStats.fullPayments.toString()],
          ["Installment Payments", summaryStats.installments.toString()],
          ["Pending Payments", summaryStats.pendingPayments.toString()],
        ],
        theme: "striped",
        headStyles: { fillColor: [0, 109, 91] },
        columnStyles: { 0: { fontStyle: "bold" } },
      });

      // Package Revenue Table
      let yPos = (doc as any).lastAutoTable.finalY + 12;
      doc.text("Package-wise Revenue", 14, yPos);

      autoTable(doc, {
        startY: yPos + 4,
        head: [["Package", "Type", "Bookings", "Revenue", "% Share"]],
        body: packageStats.map(pkg => [
          pkg.name.length > 25 ? pkg.name.substring(0, 25) + "..." : pkg.name,
          pkg.type.toUpperCase(),
          pkg.bookings.toString(),
          `${CURRENCY.symbol}${pkg.revenue.toLocaleString()}`,
          summaryStats.totalRevenue > 0 
            ? `${((pkg.revenue / summaryStats.totalRevenue) * 100).toFixed(1)}%`
            : "0%"
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 109, 91] },
        columnStyles: { 
          0: { cellWidth: 50 },
          3: { halign: "right" },
          4: { halign: "right" }
        },
      });

      // Monthly Trends (new page if needed)
      yPos = (doc as any).lastAutoTable.finalY + 12;
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.text("Monthly Trends", 14, yPos);

      autoTable(doc, {
        startY: yPos + 4,
        head: [["Month", "Year", "Bookings", "Passengers", "Revenue"]],
        body: monthlyStats.map(stat => [
          stat.month,
          stat.year.toString(),
          stat.bookings.toString(),
          stat.passengers.toString(),
          `${CURRENCY.symbol}${stat.revenue.toLocaleString()}`
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 109, 91] },
      });

      doc.save(`booking-revenue-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);

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

  const resetFilters = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
    setSelectedPackage("all");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading report data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Filters
              </CardTitle>
              <CardDescription>Filter data by year, month, or package</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                disabled={exporting || filteredBookings.length === 0}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={exporting || filteredBookings.length === 0}
                className="gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                disabled={exporting || filteredBookings.length === 0}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {MONTHS.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Package</label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Packages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packages</SelectItem>
                  {packages.map(pkg => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.title} ({pkg.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {(selectedYear !== "all" || selectedMonth !== "all" || selectedPackage !== "all") && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Active Filter:</strong> {getFilterDescription()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-xl lg:text-2xl font-bold text-primary">
                    {formatCurrency(summaryStats.totalRevenue)}
                  </p>
                </div>
                <div className="bg-primary/10 p-2 lg:p-3 rounded-xl">
                  <Wallet className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Total Bookings</p>
                  <p className="text-xl lg:text-2xl font-bold">{summaryStats.totalBookings}</p>
                </div>
                <div className="bg-blue-500/10 p-2 lg:p-3 rounded-xl">
                  <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Total Passengers</p>
                  <p className="text-xl lg:text-2xl font-bold">{summaryStats.totalPassengers}</p>
                </div>
                <div className="bg-green-500/10 p-2 lg:p-3 rounded-xl">
                  <Users className="w-5 h-5 lg:w-6 lg:h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Avg. Order Value</p>
                  <p className="text-xl lg:text-2xl font-bold">
                    {formatCurrency(Math.round(summaryStats.avgOrderValue))}
                  </p>
                </div>
                <div className="bg-secondary/10 p-2 lg:p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 lg:w-6 lg:h-6 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="revenue" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <Calendar className="w-4 h-4" />
            Monthly
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <PieChartIcon className="w-4 h-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Package Revenue Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Package</CardTitle>
                <CardDescription>Top performing packages by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {packageStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={packageStats.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `${CURRENCY.symbol}${v / 1000}k`} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={120}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => v.length > 15 ? v.substring(0, 15) + "..." : v}
                      />
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
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available for selected filters
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Type Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hajj vs Umrah</CardTitle>
                <CardDescription>Revenue distribution by package type</CardDescription>
              </CardHeader>
              <CardContent>
                {packageTypeDistribution.some(d => d.revenue > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={packageTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="revenue"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {packageTypeDistribution.map((entry, index) => (
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
        </TabsContent>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
              <CardDescription>Booking and revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monthlyStats}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(v, i) => monthlyStats[i] ? `${v.substring(0, 3)} '${String(monthlyStats[i].year).slice(-2)}` : v}
                    />
                    <YAxis tickFormatter={(value) => `${CURRENCY.symbol}${value / 1000}k`} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? formatCurrency(value) : value,
                        name === "revenue" ? "Revenue" : name === "bookings" ? "Bookings" : "Passengers"
                      ]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No data available for selected filters
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Type Distribution</CardTitle>
                <CardDescription>Breakdown by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={paymentDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {paymentDistribution.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
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
                    No payment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary Cards */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
                <CardDescription>Overview of payment statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="font-medium">Full Payments</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{summaryStats.fullPayments}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <span className="font-medium">Installment Plans</span>
                  </div>
                  <span className="text-xl font-bold text-purple-600">{summaryStats.installments}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="font-medium">Pending Payments</span>
                  </div>
                  <span className="text-xl font-bold text-yellow-600">{summaryStats.pendingPayments}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Package Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Package Performance</CardTitle>
          <CardDescription>Detailed breakdown by package</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead className="text-center">Passengers</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">% Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packageStats.length > 0 ? (
                packageStats.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {pkg.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{pkg.bookings}</TableCell>
                    <TableCell className="text-center">{pkg.passengers}</TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(pkg.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      {summaryStats.totalRevenue > 0
                        ? ((pkg.revenue / summaryStats.totalRevenue) * 100).toFixed(1)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No data available for selected filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details ({filteredBookings.length})</CardTitle>
          <CardDescription>Individual booking records based on filters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-center">Passengers</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.slice(0, 20).map((booking) => {
                  const customerName = booking.profiles?.full_name || booking.guest_name || "Guest";
                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(booking.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>{customerName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{booking.packages?.title || "N/A"}</span>
                          <Badge variant="outline" className="w-fit capitalize text-xs mt-1">
                            {booking.packages?.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{booking.passenger_count}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(booking.total_price)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "capitalize",
                            booking.payment_status === "paid" && "bg-green-500",
                            booking.payment_status === "partial" && "bg-purple-500",
                            booking.payment_status === "emi_pending" && "bg-purple-500",
                            booking.payment_status === "pending" && "bg-yellow-500",
                            booking.payment_status === "pending_cash" && "bg-orange-500",
                            booking.payment_status === "failed" && "bg-red-500"
                          )}
                        >
                          {booking.payment_status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={cn(
                            "capitalize",
                            booking.status === "confirmed" && "border-green-500 text-green-600",
                            booking.status === "completed" && "border-blue-500 text-blue-600",
                            booking.status === "pending" && "border-yellow-500 text-yellow-600",
                            booking.status === "cancelled" && "border-red-500 text-red-600"
                          )}
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length > 20 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing 20 of {filteredBookings.length} bookings. Export to view all.
            </div>
          )}

          {filteredBookings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No bookings found for selected filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReportsAnalytics;
