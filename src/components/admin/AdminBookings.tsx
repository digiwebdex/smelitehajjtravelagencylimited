import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Eye, CheckCircle, XCircle, Clock, AlertCircle, Download, CalendarIcon, X, CreditCard, Banknote, Wallet, MapPin, Calculator, Building, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AdminTrackingStatus from "./AdminTrackingStatus";
import AdminEMIManagement from "./AdminEMIManagement";
import AdminBankTransferVerification from "./AdminBankTransferVerification";

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
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [trackingBooking, setTrackingBooking] = useState<Booking | null>(null);
  const [emiBooking, setEmiBooking] = useState<Booking | null>(null);
  const [verifyBankTransferBooking, setVerifyBankTransferBooking] = useState<Booking | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchBookings();
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
      // Fetch profiles separately for registered users
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

  // Helper to get customer display info (profile or guest)
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
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Booking status updated to ${newStatus}`,
      });
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
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Payment status updated to ${newStatus}`,
      });
      fetchBookings();
      onUpdate();
    }
  };

  const markCashAsPaid = async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ 
        payment_status: "paid",
        transaction_id: `CASH-${Date.now()}`
      })
      .eq("id", bookingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to mark payment as received",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Received",
        description: "Cash payment has been marked as received",
      });
      fetchBookings();
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

    // Date range filter
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

  const exportToCSV = () => {
    const headers = [
      "Booking ID",
      "Customer Name",
      "Email",
      "Phone",
      "Customer Type",
      "Package",
      "Package Type",
      "Passengers",
      "Travel Date",
      "Total Amount",
      "Status",
      "Booking Date",
      "Notes"
    ];

    const csvData = filteredBookings.map((booking) => {
      const customerInfo = getCustomerInfo(booking);
      return [
        booking.id.slice(0, 8).toUpperCase(),
        customerInfo.name,
        customerInfo.email,
        customerInfo.phone,
        customerInfo.isGuest ? "Guest" : "Registered",
        booking.packages.title,
        booking.packages.type,
        booking.passenger_count,
        booking.travel_date ? new Date(booking.travel_date).toLocaleDateString() : "Not set",
        booking.total_price,
        booking.status,
        new Date(booking.created_at).toLocaleDateString(),
        booking.notes || ""
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => 
        row.map(cell => {
          const cellStr = String(cell);
          // Escape quotes and wrap in quotes if contains comma or quote
          if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bookings-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `${filteredBookings.length} bookings exported to CSV`,
    });
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
            <Button 
              onClick={exportToCSV} 
              variant="outline" 
              size="sm"
              disabled={filteredBookings.length === 0}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
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
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !dateFrom && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">to</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[160px] justify-start text-left font-normal",
                        !dateTo && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearDateFilter}
                    className="h-9 w-9"
                  >
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
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  const customerInfo = getCustomerInfo(booking);
                  return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      {format(new Date(booking.created_at), "MMM dd, yyyy")}
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
                        <p className="font-medium">{booking.packages.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {booking.packages.type}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{booking.passenger_count}</TableCell>
                    <TableCell className="font-bold">
                      {formatCurrency(Number(booking.total_price))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getPaymentStatusBadge(booking.payment_status, booking.payment_method)}
                        {booking.payment_status === "pending_cash" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs gap-1 mt-1"
                            onClick={() => markCashAsPaid(booking.id)}
                          >
                            <Banknote className="w-3 h-3" />
                            Mark Paid
                          </Button>
                        )}
                        {/* Bank Transfer Verification Button */}
                        {booking.payment_status === "pending_verification" && booking.payment_method === "bank_transfer" && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-6 text-xs gap-1 mt-1"
                            onClick={() => setVerifyBankTransferBooking(booking)}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Verify Payment
                          </Button>
                        )}
                        {/* Installment Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs gap-1 mt-1"
                          onClick={() => setEmiBooking(booking)}
                        >
                          <Calculator className="w-3 h-3" />
                          Installment
                        </Button>
                        {booking.transaction_id && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {booking.transaction_id.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-7 text-xs"
                        onClick={() => setTrackingBooking(booking)}
                      >
                        <MapPin className="w-3 h-3" />
                        {trackingStatusLabels[booking.tracking_status]}
                      </Button>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Select
                          value={booking.status}
                          onValueChange={(value) => updateBookingStatus(booking.id, value as "pending" | "confirmed" | "completed" | "cancelled")}
                        >
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
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

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              ID: {selectedBooking?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (() => {
            const customerInfo = getCustomerInfo(selectedBooking);
            return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">Customer</p>
                    {customerInfo.isGuest && (
                      <Badge variant="outline" className="text-xs">Guest</Badge>
                    )}
                  </div>
                  <p className="font-medium">{customerInfo.name}</p>
                  {customerInfo.email && <p className="text-sm">{customerInfo.email}</p>}
                  {customerInfo.phone && <p className="text-sm">{customerInfo.phone}</p>}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-medium">{selectedBooking.packages.title}</p>
                  <p className="text-sm capitalize">{selectedBooking.packages.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Passengers</p>
                  <p className="font-medium">{selectedBooking.passenger_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Travel Date</p>
                  <p className="font-medium">
                    {selectedBooking.travel_date
                      ? new Date(selectedBooking.travel_date).toLocaleDateString()
                      : "Not set"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Passenger Details</p>
                {selectedBooking.passenger_details && (
                  <div className="bg-muted/50 rounded p-3 mt-1">
                    {Object.entries(selectedBooking.passenger_details).map(([key, value]) => (
                      <p key={key} className="text-sm">
                        <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}: </span>
                        <span className="font-medium">{value}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted/50 rounded p-3 mt-1">{selectedBooking.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <div className="mt-1">
                    {getPaymentStatusBadge(selectedBooking.payment_status, selectedBooking.payment_method)}
                  </div>
                  {selectedBooking.transaction_id && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      TX: {selectedBooking.transaction_id}
                    </p>
                  )}
                  {selectedBooking.payment_status === "pending_cash" && (
                    <Button
                      size="sm"
                      className="mt-2 gap-1"
                      onClick={() => {
                        markCashAsPaid(selectedBooking.id);
                        setSelectedBooking(null);
                      }}
                    >
                      <Banknote className="w-4 h-4" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Booking Status</p>
                  <div className="mt-1">{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(selectedBooking.total_price))}
                  </p>
                </div>
              </div>
            </motion.div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Tracking Status Update Modal */}
      {trackingBooking && (
        <AdminTrackingStatus
          isOpen={!!trackingBooking}
          onClose={() => setTrackingBooking(null)}
          bookingId={trackingBooking.id}
          currentStatus={trackingBooking.tracking_status}
          onUpdate={() => {
            fetchBookings();
            onUpdate();
          }}
        />
      )}

      {/* EMI Management Modal */}
      {emiBooking && (
        <AdminEMIManagement
          isOpen={!!emiBooking}
          onClose={() => setEmiBooking(null)}
          bookingId={emiBooking.id}
          totalAmount={Number(emiBooking.total_price)}
          onUpdate={() => {
            fetchBookings();
            onUpdate();
          }}
        />
      )}

      {/* Bank Transfer Verification Modal */}
      <AdminBankTransferVerification
        isOpen={!!verifyBankTransferBooking}
        onClose={() => setVerifyBankTransferBooking(null)}
        booking={verifyBankTransferBooking}
        onVerified={() => {
          fetchBookings();
          onUpdate();
        }}
      />
    </>
  );
};

export default AdminBookings;
