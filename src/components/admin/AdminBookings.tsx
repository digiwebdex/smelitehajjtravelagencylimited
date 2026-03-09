import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useViewerMode } from "@/contexts/ViewerModeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Search, Eye, CheckCircle, XCircle, Clock, AlertCircle, Download, CalendarIcon, X, CreditCard, Banknote, Wallet, MapPin, Calculator, Building, ShieldCheck, FileSpreadsheet, FileText, Lock, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AdminTrackingStatus from "./AdminTrackingStatus";
import AdminEMIManagement from "./AdminEMIManagement";
import AdminBankTransferVerification from "./AdminBankTransferVerification";
import AdminDocumentReview from "./AdminDocumentReview";
import { AdminActionButton } from "./AdminActionButton";

type TrackingStatus = 'order_submitted' | 'documents_received' | 'under_review' | 'approved' | 'processing' | 'completed';

interface Booking {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  tracking_status: TrackingStatus;
  admin_notes: string | null;
  payment_status: string;
  payment_method: string | null;
  transaction_id: string | null;
  total_price: number;
  passenger_count: number;
  travel_date: string | null;
  notes: string | null;
  passenger_details: Record<string, string> | null;
  created_at: string;
  user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  bank_transaction_number: string | null;
  bank_transfer_screenshot_url: string | null;
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  packages: {
    title: string;
    type: string;
  };
}

const trackingStatusLabels: Record<TrackingStatus, string> = {
  order_submitted: 'Order Submitted',
  documents_received: 'Documents Received',
  under_review: 'Under Review',
  approved: 'Approved',
  processing: 'Processing',
  completed: 'Completed',
};

const paymentStatusOptions = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "pending_cash", label: "Cash Pending", icon: Banknote, color: "bg-orange-500" },
  { value: "pending_verification", label: "Awaiting Verification", icon: Building, color: "bg-blue-500" },
  { value: "paid", label: "Paid", icon: CheckCircle, color: "bg-green-500" },
  { value: "partial", label: "Partial", icon: Calculator, color: "bg-blue-500" },
  { value: "emi_pending", label: "Installment Pending", icon: Calculator, color: "bg-purple-500" },
  { value: "failed", label: "Failed", icon: XCircle, color: "bg-red-500" },
  { value: "refunded", label: "Refunded", icon: Wallet, color: "bg-purple-500" },
];

const statusOptions = [
  { value: "pending", label: "Pending", icon: Clock, color: "bg-yellow-500" },
  { value: "confirmed", label: "Confirmed", icon: CheckCircle, color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", icon: XCircle, color: "bg-red-500" },
  { value: "completed", label: "Completed", icon: AlertCircle, color: "bg-blue-500" },
];

interface AdminBookingsProps {
  onUpdate: () => void;
}

const AdminBookings = ({ onUpdate }: AdminBookingsProps) => {
  const { toast } = useToast();
  const { isViewerMode } = useViewerMode();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [emiBooking, setEmiBooking] = useState<Booking | null>(null);
  const [verifyBankTransferBooking, setVerifyBankTransferBooking] = useState<Booking | null>(null);
  const [documentReviewBooking, setDocumentReviewBooking] = useState<Booking | null>(null);
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [emiPayments, setEmiPayments] = useState<Record<string, { advance_amount: number; remaining_amount: number; paid_emis: number; number_of_emis: number }>>({});
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  
  // Edit state
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    status: "" as string,
    payment_status: "",
    passenger_count: 1,
    travel_date: "",
    admin_notes: "",
    total_price: 0,
  });
  const [editSaving, setEditSaving] = useState(false);

  // Delete state
  const [deleteBooking, setDeleteBooking] = useState<Booking | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchDocumentCounts();
    fetchEmiPayments();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        tracking_status,
        admin_notes,
        payment_status,
        payment_method,
        transaction_id,
        total_price,
        passenger_count,
        travel_date,
        notes,
        passenger_details,
        created_at,
        user_id,
        guest_name,
        guest_email,
        guest_phone,
        bank_transaction_number,
        bank_transfer_screenshot_url,
        packages (
          title,
          type
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.filter(b => b.user_id).map(b => b.user_id))];
      const { data: profiles } = userIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .in("id", userIds)
        : { data: [] };

      const profileMap = new Map(profiles?.map(p => [p.id, p] as const) || []);
      
      const bookingsWithProfiles = data.map(booking => ({
        ...booking,
        profiles: booking.user_id ? profileMap.get(booking.user_id) || null : null,
      }));
      
      setBookings(bookingsWithProfiles as Booking[]);
    }
    setLoading(false);
  };

  const fetchDocumentCounts = async () => {
    const { data, error } = await supabase
      .from("booking_documents")
      .select("booking_id");

    if (!error && data) {
      const counts: Record<string, number> = {};
      data.forEach((doc) => {
        counts[doc.booking_id] = (counts[doc.booking_id] || 0) + 1;
      });
      setDocumentCounts(counts);
    }
  };

  const fetchEmiPayments = async () => {
    const { data, error } = await supabase
      .from("emi_payments")
      .select("booking_id, advance_amount, remaining_amount, paid_emis, number_of_emis");

    if (!error && data) {
      const emiMap: Record<string, { advance_amount: number; remaining_amount: number; paid_emis: number; number_of_emis: number }> = {};
      data.forEach((emi) => {
        emiMap[emi.booking_id] = {
          advance_amount: emi.advance_amount,
          remaining_amount: emi.remaining_amount,
          paid_emis: emi.paid_emis,
          number_of_emis: emi.number_of_emis,
        };
      });
      setEmiPayments(emiMap);
    }
  };

  const getCustomerInfo = (booking: Booking) => {
    if (booking.profiles) {
      return {
        name: booking.profiles.full_name || "N/A",
        email: booking.profiles.email || "",
        phone: booking.profiles.phone || "",
        isGuest: false,
      };
    }
    return {
      name: booking.guest_name || "Guest",
      email: booking.guest_email || "",
      phone: booking.guest_phone || "",
      isGuest: true,
    };
  };

  const updateBookingStatus = async (bookingId: string, newStatus: "pending" | "confirmed" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: "Failed to update booking status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Booking status updated to ${newStatus}` });
      fetchBookings();
      onUpdate();
    }
  };

  const updatePaymentStatus = async (bookingId: string, newStatus: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: newStatus })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: "Failed to update payment status", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Payment status updated to ${newStatus}` });
      fetchBookings();
      onUpdate();
    }
  };

  const markCashAsPaid = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "paid", transaction_id: `CASH-${Date.now()}` })
      .eq("id", bookingId);

    if (error) {
      toast({ title: "Error", description: "Failed to mark payment as received", variant: "destructive" });
    } else {
      toast({ title: "Payment Received", description: "Cash payment has been marked as received" });
      fetchBookings();
      onUpdate();
    }
  };

  // Edit booking
  const openEditDialog = (booking: Booking) => {
    setEditBooking(booking);
    setEditForm({
      status: booking.status,
      payment_status: booking.payment_status,
      passenger_count: booking.passenger_count,
      travel_date: booking.travel_date || "",
      admin_notes: booking.admin_notes || "",
      total_price: Number(booking.total_price),
    });
  };

  const handleEditSave = async () => {
    if (!editBooking) return;
    setEditSaving(true);
    const { error } = await supabase
      .from("bookings")
      .update({
        status: editForm.status as any,
        payment_status: editForm.payment_status,
        passenger_count: editForm.passenger_count,
        travel_date: editForm.travel_date || null,
        admin_notes: editForm.admin_notes || null,
        total_price: editForm.total_price,
      })
      .eq("id", editBooking.id);

    setEditSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Booking updated successfully" });
      setEditBooking(null);
      fetchBookings();
      onUpdate();
    }
  };

  // Delete booking
  const handleDelete = async () => {
    if (!deleteBooking) return;
    setDeleteLoading(true);

    // Delete related records first
    await supabase.from("booking_status_history").delete().eq("booking_id", deleteBooking.id);
    await supabase.from("booking_documents").delete().eq("booking_id", deleteBooking.id);
    await supabase.from("emi_installments").delete().in(
      "emi_payment_id",
      (await supabase.from("emi_payments").select("id").eq("booking_id", deleteBooking.id)).data?.map(e => e.id) || []
    );
    await supabase.from("emi_payments").delete().eq("booking_id", deleteBooking.id);

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", deleteBooking.id);

    setDeleteLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Booking deleted successfully" });
      setDeleteBooking(null);
      fetchBookings();
      fetchDocumentCounts();
      fetchEmiPayments();
      onUpdate();
    }
  };

  const getPaymentStatusBadge = (status: string, paymentMethod: string | null) => {
    const config = paymentStatusOptions.find((s) => s.value === status);
    if (!config) {
      return (
        <Badge className="bg-muted text-muted-foreground gap-1">
          <CreditCard className="w-3 h-3" />
          {status || "Unknown"}
        </Badge>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        <Badge className={`${config.color} text-white gap-1`}>
          <config.icon className="w-3 h-3" />
          {config.label}
        </Badge>
        {paymentMethod && (
          <span className="text-xs text-muted-foreground capitalize">
            {paymentMethod.replace(/_/g, " ")}
          </span>
        )}
      </div>
    );
  };

  const clearDateFilter = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const filteredBookings = bookings.filter((booking) => {
    const customerInfo = getCustomerInfo(booking);
    const matchesSearch =
      customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerInfo.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.packages.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    const bookingDate = new Date(booking.created_at);
    bookingDate.setHours(0, 0, 0, 0);
    
    let matchesDateRange = true;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && bookingDate >= fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && bookingDate <= toDate;
    }

    return matchesSearch && matchesStatus && matchesDateRange;
  });

  const getStatusBadge = (status: string) => {
    const config = statusOptions.find((s) => s.value === status);
    if (!config) return null;
    return (
      <Badge className={`${config.color} text-white gap-1`}>
        <config.icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getExportData = () => {
    return filteredBookings.map((booking) => {
      const customerInfo = getCustomerInfo(booking);
      return {
        "Booking Date": new Date(booking.created_at).toLocaleDateString(),
        "Booking ID": booking.id.slice(0, 8).toUpperCase(),
        "Customer Name": customerInfo.name,
        "Email": customerInfo.email,
        "Phone": customerInfo.phone,
        "Customer Type": customerInfo.isGuest ? "Guest" : "Registered",
        "Package": booking.packages.title,
        "Package Type": booking.packages.type,
        "Passengers": booking.passenger_count,
        "Travel Date": booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : "Not set",
        "Total Amount": booking.total_price,
        "Payment Status": booking.payment_status,
        "Tracking Status": trackingStatusLabels[booking.tracking_status] || booking.tracking_status,
        "Booking Status": booking.status,
        "Notes": booking.notes || ""
      };
    });
  };

  const exportToCSV = () => {
    const data = getExportData();
    const headers = Object.keys(data[0] || {});
    const csvData = data.map((row) => {
      return headers.map(header => {
        const cellStr = String(row[header as keyof typeof row]);
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return `"${cellStr}"`;
      });
    });
    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...csvData.map(row => row.join(","))
    ].join("\r\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: `${filteredBookings.length} bookings exported to CSV` });
  };

  const exportToExcel = () => {
    const data = getExportData();
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    const colWidths = [
      { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
      { wch: 12 }, { wch: 25 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
      { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 30 },
    ];
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `bookings-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Export Successful", description: `${filteredBookings.length} bookings exported to Excel` });
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Bookings ({bookings.length})</span>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm" disabled={filteredBookings.length === 0} className="gap-2">
                <FileText className="w-4 h-4" />
                CSV
              </Button>
              <Button onClick={exportToExcel} variant="outline" size="sm" disabled={filteredBookings.length === 0} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </Button>
            </div>
          </CardTitle>
          <div className="flex flex-col gap-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or booking ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Filter */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <Button variant="ghost" size="icon" onClick={clearDateFilter} className="h-9 w-9">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {(dateFrom || dateTo) && (
                <Badge variant="secondary" className="text-xs">
                  {dateFrom && dateTo
                    ? `${format(dateFrom, "MMM dd")} - ${format(dateTo, "MMM dd, yyyy")}`
                    : dateFrom
                    ? `From ${format(dateFrom, "MMM dd, yyyy")}`
                    : `Until ${format(dateTo!, "MMM dd, yyyy")}`}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Booking ID</TableHead>
                  <TableHead className="whitespace-nowrap">Customer</TableHead>
                  <TableHead className="whitespace-nowrap">Package</TableHead>
                  <TableHead className="whitespace-nowrap">Passengers</TableHead>
                  <TableHead className="whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Payment</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Tracking</TableHead>
                  <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const customerInfo = getCustomerInfo(booking);
                  return (
                  <TableRow key={booking.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(booking.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="font-mono text-xs p-0 h-auto text-primary hover:underline"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {booking.id.slice(0, 8).toUpperCase()}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{customerInfo.name}</p>
                          {customerInfo.isGuest && (
                            <Badge variant="outline" className="text-xs">Guest</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{customerInfo.email}</p>
                        {customerInfo.phone && (
                          <p className="text-xs text-muted-foreground">{customerInfo.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{booking.packages.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{booking.packages.type}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{booking.passenger_count}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{formatCurrency(Number(booking.total_price))}</span>
                        {emiPayments[booking.id] && (
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="text-green-600">Adv: {formatCurrency(emiPayments[booking.id].advance_amount)}</span>
                            <span className="mx-1">•</span>
                            <span>{emiPayments[booking.id].paid_emis}/{emiPayments[booking.id].number_of_emis} Paid</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(booking.payment_status, booking.payment_method)}
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {trackingStatusLabels[booking.tracking_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => setSelectedBooking(booking)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(booking)} disabled={isViewerMode}>
                            <Edit className="w-4 h-4 mr-2" /> Edit Booking
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setTrackingBooking(booking)}>
                            <MapPin className="w-4 h-4 mr-2" /> Update Tracking
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEmiBooking(booking)}>
                            <Calculator className="w-4 h-4 mr-2" /> Installments
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDocumentReviewBooking(booking)}>
                            <FileText className="w-4 h-4 mr-2" /> Documents ({documentCounts[booking.id] || 0})
                          </DropdownMenuItem>
                          {booking.payment_status === "pending_verification" && booking.payment_method === "bank_transfer" && (
                            <DropdownMenuItem onClick={() => setVerifyBankTransferBooking(booking)} disabled={isViewerMode}>
                              <ShieldCheck className="w-4 h-4 mr-2" /> Verify Payment
                            </DropdownMenuItem>
                          )}
                          {booking.payment_status === "pending_cash" && (
                            <DropdownMenuItem onClick={() => markCashAsPaid(booking.id)} disabled={isViewerMode}>
                              <Banknote className="w-4 h-4 mr-2" /> Mark Cash Paid
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteBooking(booking)}
                            disabled={isViewerMode}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No bookings found matching your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Booking Details
            </DialogTitle>
            <DialogDescription className="font-mono">
              ID: {selectedBooking?.id.slice(0, 8).toUpperCase()} • Created: {selectedBooking && format(new Date(selectedBooking.created_at), "MMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (() => {
            const customerInfo = getCustomerInfo(selectedBooking);
            const emiInfo = emiPayments[selectedBooking.id];
            return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm font-medium text-muted-foreground">Customer Information</p>
                    {customerInfo.isGuest && <Badge variant="outline" className="text-xs">Guest</Badge>}
                  </div>
                  <p className="font-semibold text-lg">{customerInfo.name}</p>
                  {customerInfo.email && <p className="text-sm text-muted-foreground">{customerInfo.email}</p>}
                  {customerInfo.phone && <p className="text-sm text-muted-foreground">{customerInfo.phone}</p>}
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Package</p>
                  <p className="font-semibold text-lg">{selectedBooking.packages.title}</p>
                  <p className="text-sm text-muted-foreground capitalize">{selectedBooking.packages.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Passengers</p>
                  <p className="text-xl font-bold">{selectedBooking.passenger_count}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Travel Date</p>
                  <p className="text-sm font-medium">
                    {selectedBooking.travel_date ? format(new Date(selectedBooking.travel_date), "MMM dd, yyyy") : "Not set"}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Tracking Status</p>
                  <p className="text-sm font-medium">{trackingStatusLabels[selectedBooking.tracking_status]}</p>
                </div>
              </div>

              {selectedBooking.passenger_details && Object.keys(selectedBooking.passenger_details).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Passenger Details</p>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedBooking.passenger_details).map(([key, value]) => (
                        <p key={key} className="text-sm">
                          <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                          <span className="font-medium">{value}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Customer Notes</p>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.admin_notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Admin Notes</p>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">{selectedBooking.admin_notes}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3">Payment Information</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Status</p>
                      <div className="mt-1">{getPaymentStatusBadge(selectedBooking.payment_status, selectedBooking.payment_method)}</div>
                    </div>
                    {selectedBooking.transaction_id && (
                      <div>
                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                        <p className="text-sm font-mono bg-muted/50 rounded px-2 py-1 mt-1">{selectedBooking.transaction_id}</p>
                      </div>
                    )}
                    {selectedBooking.bank_transaction_number && (
                      <div>
                        <p className="text-xs text-muted-foreground">Bank Transaction #</p>
                        <p className="text-sm font-mono bg-muted/50 rounded px-2 py-1 mt-1">{selectedBooking.bank_transaction_number}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Booking Status</p>
                    <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                  </div>
                </div>
              </div>

              {(emiInfo || selectedBooking.payment_method === "installment") && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Installment Plan</p>
                  {emiInfo ? (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Advance Paid</p>
                          <p className="text-lg font-bold text-green-600">{formatCurrency(emiInfo.advance_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="text-lg font-bold text-orange-600">{formatCurrency(emiInfo.remaining_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Installments</p>
                          <p className="text-lg font-bold">{emiInfo.paid_emis}/{emiInfo.number_of_emis}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Progress</p>
                          <p className="text-lg font-bold text-primary">
                            {Math.round(((emiInfo.advance_amount + (emiInfo.paid_emis * (emiInfo.remaining_amount / emiInfo.number_of_emis))) / Number(selectedBooking.total_price)) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Installment plan not set up
                    </Badge>
                  )}
                </div>
              )}

              <div className="border-t pt-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total Package Amount</p>
                  <p className="text-3xl font-bold text-primary">{formatCurrency(Number(selectedBooking.total_price))}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { openEditDialog(selectedBooking); setSelectedBooking(null); }} disabled={isViewerMode}>
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setEmiBooking(selectedBooking); setSelectedBooking(null); }}>
                    <Calculator className="w-4 h-4 mr-1" /> Installments
                  </Button>
                </div>
              </div>
            </motion.div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Edit Booking Dialog */}
      <Dialog open={!!editBooking} onOpenChange={() => setEditBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Booking
            </DialogTitle>
            <DialogDescription>
              ID: {editBooking?.id.slice(0, 8).toUpperCase()} — {editBooking?.packages.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Booking Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={editForm.payment_status} onValueChange={(v) => setEditForm({ ...editForm, payment_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentStatusOptions.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Passengers</Label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.passenger_count}
                  onChange={(e) => setEditForm({ ...editForm, passenger_count: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Price</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.total_price}
                  onChange={(e) => setEditForm({ ...editForm, total_price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Travel Date</Label>
              <Input
                type="date"
                value={editForm.travel_date}
                onChange={(e) => setEditForm({ ...editForm, travel_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={editForm.admin_notes}
                onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                placeholder="Internal notes about this booking..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBooking(null)}>Cancel</Button>
            <AdminActionButton onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? "Saving..." : "Save Changes"}
            </AdminActionButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteBooking} onOpenChange={() => setDeleteBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete booking <span className="font-mono font-bold">{deleteBooking?.id.slice(0, 8).toUpperCase()}</span>? 
              This will permanently remove the booking, all related documents, installments, and status history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tracking Status Update Modal */}
      {trackingBooking && (
        <AdminTrackingStatus
          isOpen={!!trackingBooking}
          onClose={() => setTrackingBooking(null)}
          bookingId={trackingBooking.id}
          currentStatus={trackingBooking.tracking_status}
          onUpdate={() => { fetchBookings(); onUpdate(); }}
        />
      )}

      {/* EMI Management Modal */}
      {emiBooking && (
        <AdminEMIManagement
          isOpen={!!emiBooking}
          onClose={() => setEmiBooking(null)}
          bookingId={emiBooking.id}
          totalAmount={Number(emiBooking.total_price)}
          onUpdate={() => { fetchBookings(); onUpdate(); }}
        />
      )}

      {/* Bank Transfer Verification Modal */}
      <AdminBankTransferVerification
        isOpen={!!verifyBankTransferBooking}
        onClose={() => setVerifyBankTransferBooking(null)}
        booking={verifyBankTransferBooking}
        onVerified={() => { fetchBookings(); onUpdate(); }}
      />

      {/* Document Review Modal */}
      {documentReviewBooking && (
        <AdminDocumentReview
          isOpen={!!documentReviewBooking}
          onClose={() => setDocumentReviewBooking(null)}
          bookingId={documentReviewBooking.id}
          customerName={getCustomerInfo(documentReviewBooking).name}
          packageTitle={documentReviewBooking.packages.title}
        />
      )}
    </>
  );
};

export default AdminBookings;
