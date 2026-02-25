import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Package, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MapPin,
  FileText,
  FileCheck,
  Search,
  Settings,
  PackageCheck,
  Upload,
  Plane,
  Globe,
  CreditCard,
  Download,
  Wallet,
  TrendingUp,
  Receipt,
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import BookingDocumentUpload from "@/components/BookingDocumentUpload";
import InstallmentDetails from "@/components/InstallmentDetails";
import { generateBookingPDF } from "@/utils/generateBookingPDF";
import { getGuestBookingInfo } from "@/utils/guestBookingStorage";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TrackingStatus = 'order_submitted' | 'documents_received' | 'under_review' | 'approved' | 'processing' | 'completed';

interface Booking {
  id: string;
  status: string;
  tracking_status: TrackingStatus;
  admin_notes: string | null;
  total_price: number;
  passenger_count: number;
  travel_date: string | null;
  created_at: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  payment_status?: string;
  user_id?: string | null;
  packages: {
    title: string;
    type: string;
    duration_days: number;
    price?: number;
  };
}

interface VisaApplication {
  id: string;
  status: string;
  payment_status: string;
  total_price: number;
  applicant_count: number;
  travel_date: string | null;
  created_at: string;
  admin_notes: string | null;
  visa_countries: {
    country_name: string;
    flag_emoji: string;
    processing_time: string;
  };
}

interface Transaction {
  id: string;
  amount: number;
  payment_method: string;
  gateway_name: string;
  status: string;
  transaction_id: string | null;
  created_at: string;
  booking_id: string | null;
  currency: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  confirmed: { color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" />, label: "Confirmed" },
  cancelled: { color: "bg-red-500", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
  completed: { color: "bg-blue-500", icon: <AlertCircle className="w-4 h-4" />, label: "Completed" },
};

const visaStatusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  processing: { color: "bg-blue-500", icon: <Settings className="w-4 h-4" />, label: "Processing" },
  approved: { color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" />, label: "Approved" },
  rejected: { color: "bg-red-500", icon: <XCircle className="w-4 h-4" />, label: "Rejected" },
  completed: { color: "bg-emerald-500", icon: <PackageCheck className="w-4 h-4" />, label: "Completed" },
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", label: "Payment Pending" },
  pending_cash: { color: "bg-orange-500/20 text-orange-700 border-orange-500/30", label: "Cash on Arrival" },
  pending_verification: { color: "bg-blue-500/20 text-blue-700 border-blue-500/30", label: "Verifying Payment" },
  paid: { color: "bg-green-500/20 text-green-700 border-green-500/30", label: "Paid" },
  failed: { color: "bg-red-500/20 text-red-700 border-red-500/30", label: "Failed" },
};

const txnStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", label: "Pending" },
  success: { color: "bg-green-500/20 text-green-700 border-green-500/30", label: "Success" },
  completed: { color: "bg-green-500/20 text-green-700 border-green-500/30", label: "Completed" },
  failed: { color: "bg-red-500/20 text-red-700 border-red-500/30", label: "Failed" },
  cancelled: { color: "bg-muted text-muted-foreground border-muted", label: "Cancelled" },
};

const trackingSteps: { status: TrackingStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'order_submitted', label: 'Submitted', icon: FileText },
  { status: 'documents_received', label: 'Documents', icon: FileCheck },
  { status: 'under_review', label: 'Review', icon: Search },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Settings },
  { status: 'completed', label: 'Completed', icon: PackageCheck },
];

const visaTrackingSteps = [
  { status: 'pending', label: 'Submitted', icon: FileText },
  { status: 'processing', label: 'Processing', icon: Settings },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'completed', label: 'Completed', icon: PackageCheck },
];

const getStatusIndex = (status: TrackingStatus): number => {
  return trackingSteps.findIndex(step => step.status === status);
};

const getVisaStatusIndex = (status: string): number => {
  if (status === 'rejected') return -1;
  return visaTrackingSteps.findIndex(step => step.status === status);
};

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [visaApplications, setVisaApplications] = useState<VisaApplication[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [documentUploadBooking, setDocumentUploadBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isGuestMode, setIsGuestMode] = useState(false);

  useEffect(() => {
    const guestInfo = getGuestBookingInfo();
    
    if (!authLoading) {
      if (user) {
        setIsGuestMode(false);
        fetchBookings();
        fetchVisaApplications();
        fetchTransactions();
        subscribeToUpdates();
      } else if (guestInfo && guestInfo.bookingIds.length > 0) {
        setIsGuestMode(true);
        fetchGuestBookings(guestInfo.bookingIds);
      } else {
        navigate("/auth");
      }
    }
  }, [user, authLoading, navigate]);

  const fetchGuestBookings = async (bookingIds: string[]) => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, status, tracking_status, admin_notes, total_price, passenger_count,
        travel_date, created_at, guest_name, guest_email, guest_phone, payment_status, user_id,
        packages (title, type, duration_days, price)
      `)
      .in("id", bookingIds)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id, status, tracking_status, admin_notes, total_price, passenger_count,
        travel_date, created_at, guest_name, guest_email, guest_phone, payment_status, user_id,
        packages (title, type, duration_days, price)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const fetchVisaApplications = async () => {
    const { data, error } = await supabase
      .from("visa_applications")
      .select(`
        id, status, payment_status, total_price, applicant_count,
        travel_date, created_at, admin_notes,
        visa_countries (country_name, flag_emoji, processing_time)
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVisaApplications(data as VisaApplication[]);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("transactions")
      .select("id, amount, payment_method, gateway_name, status, transaction_id, created_at, booking_id, currency")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const bookingsChannel = supabase
      .channel('my-bookings')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchBookings(); })
      .subscribe();

    const visaChannel = supabase
      .channel('my-visa-applications')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'visa_applications',
        filter: `user_id=eq.${user.id}`,
      }, () => { fetchVisaApplications(); })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(visaChannel);
    };
  };

  // Dashboard summary
  const summary = useMemo(() => {
    const totalSpent = bookings
      .filter(b => b.status === "confirmed" || b.status === "completed")
      .reduce((s, b) => s + Number(b.total_price), 0)
      + visaApplications
        .filter(v => v.status === "approved" || v.status === "completed")
        .reduce((s, v) => s + Number(v.total_price), 0);

    const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending").length;
    const pendingPayments = bookings.filter(b => 
      b.payment_status === "pending" || b.payment_status === "pending_cash" || b.payment_status === "pending_verification"
    ).length;
    const completedBookings = bookings.filter(b => b.status === "completed").length;
    const successfulTxns = transactions.filter(t => t.status === "success" || t.status === "completed").length;

    return { totalSpent, activeBookings, pendingPayments, completedBookings, successfulTxns };
  }, [bookings, visaApplications, transactions]);

  // Find booking title for a transaction
  const getBookingTitle = (bookingId: string | null) => {
    if (!bookingId) return "—";
    const booking = bookings.find(b => b.id === bookingId);
    return booking ? booking.packages.title : bookingId.slice(0, 8).toUpperCase();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasNoData = bookings.length === 0 && visaApplications.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-40 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-3xl font-bold">My Dashboard</h1>
            <p className="text-muted-foreground">Your bookings, payments, and visa applications in one place</p>
          </div>
        </div>

        {/* Summary Cards */}
        {!hasNoData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold mt-1">{formatCurrency(summary.totalSpent)}</p>
                    </div>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Bookings</p>
                      <p className="text-xl font-bold mt-1">{summary.activeBookings}</p>
                    </div>
                    <div className="p-2.5 bg-green-500/10 rounded-xl">
                      <Package className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Pending Payments</p>
                      <p className="text-xl font-bold mt-1">{summary.pendingPayments}</p>
                    </div>
                    <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="text-xl font-bold mt-1">{summary.completedBookings}</p>
                    </div>
                    <div className="p-2.5 bg-blue-500/10 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {hasNoData ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings or visa applications yet. Explore our packages to get started!
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/#hajj">
                  <Button className="bg-gradient-primary">Browse Packages</Button>
                </Link>
                <Link to="/#visa">
                  <Button variant="outline">Apply for Visa</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className={cn(
              "grid w-full max-w-lg mb-6",
              isGuestMode ? "grid-cols-1" : "grid-cols-3"
            )}>
              <TabsTrigger value="overview" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Bookings ({bookings.length})
              </TabsTrigger>
              {!isGuestMode && (
                <>
                  <TabsTrigger value="payments" className="gap-2">
                    <Receipt className="w-4 h-4" />
                    Payments ({transactions.length})
                  </TabsTrigger>
                  <TabsTrigger value="visa" className="gap-2">
                    <Globe className="w-4 h-4" />
                    Visa ({visaApplications.length})
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="overview">
              {bookings.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Package Bookings</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't booked any Hajj or Umrah packages yet.
                    </p>
                    <Link to="/#hajj">
                      <Button className="bg-gradient-primary">Browse Packages</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {bookings.map((booking, index) => {
                    const currentIndex = getStatusIndex(booking.tracking_status);
                    
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-elegant transition-shadow overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="font-heading text-xl">
                                  {booking.packages.title}
                                </CardTitle>
                                <CardDescription className="capitalize">
                                  {booking.packages.type} Package • {booking.packages.duration_days} Days
                                </CardDescription>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  className={`${statusConfig[booking.status]?.color} text-white flex items-center gap-1`}
                                >
                                  {statusConfig[booking.status]?.icon}
                                  {statusConfig[booking.status]?.label}
                                </Badge>
                                {booking.payment_status && (
                                  <Badge 
                                    variant="outline"
                                    className={paymentStatusConfig[booking.payment_status]?.color}
                                  >
                                    <CreditCard className="w-3 h-3 mr-1" />
                                    {paymentStatusConfig[booking.payment_status]?.label}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Progress Tracker */}
                            <div className="mb-6 pt-4">
                              <div className="flex items-center justify-between relative">
                                <div className="absolute left-0 right-0 top-4 h-1 bg-muted rounded-full" />
                                <div 
                                  className="absolute left-0 top-4 h-1 bg-primary rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${(currentIndex / (trackingSteps.length - 1)) * 100}%` 
                                  }}
                                />
                                
                                {trackingSteps.map((step, stepIndex) => {
                                  const isCompleted = stepIndex <= currentIndex;
                                  const isCurrent = stepIndex === currentIndex;
                                  const Icon = step.icon;

                                  return (
                                    <div 
                                      key={step.status} 
                                      className="relative z-10 flex flex-col items-center"
                                    >
                                      <div
                                        className={cn(
                                          "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                          isCompleted
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground",
                                          isCurrent && "ring-4 ring-primary/20 scale-110"
                                        )}
                                      >
                                        <Icon className="w-4 h-4" />
                                      </div>
                                      <span className={cn(
                                        "text-xs mt-2 text-center max-w-[60px]",
                                        isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                                      )}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Booking ID</p>
                                <p className="font-medium">{booking.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Passengers</p>
                                <p className="font-medium">{booking.passenger_count} person(s)</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Travel Date</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {booking.travel_date 
                                    ? new Date(booking.travel_date).toLocaleDateString()
                                    : "To be confirmed"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Amount</p>
                                <p className="font-bold text-primary text-lg">
                                  {formatCurrency(booking.total_price)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Installment Details */}
                            <InstallmentDetails bookingId={booking.id} />

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                Booked on {new Date(booking.created_at).toLocaleDateString()}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => generateBookingPDF(booking)}
                                >
                                  <Download className="w-4 h-4" />
                                  Receipt
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => setDocumentUploadBooking(booking)}
                                >
                                  <Upload className="w-4 h-4" />
                                  Documents
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="gap-2"
                                  onClick={() => setSelectedBooking(booking)}
                                >
                                  <MapPin className="w-4 h-4" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payments">
              {transactions.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Payment History</h3>
                    <p className="text-muted-foreground">
                      Your payment transactions will appear here once you make a booking.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {transactions.map((txn, index) => {
                    const statusCfg = txnStatusConfig[txn.status] || txnStatusConfig.pending;
                    return (
                      <motion.div
                        key={txn.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card>
                          <CardContent className="py-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  "p-2 rounded-lg",
                                  txn.status === "success" || txn.status === "completed" 
                                    ? "bg-green-500/10" : "bg-muted"
                                )}>
                                  <CreditCard className={cn(
                                    "w-5 h-5",
                                    txn.status === "success" || txn.status === "completed"
                                      ? "text-green-500" : "text-muted-foreground"
                                  )} />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{getBookingTitle(txn.booking_id)}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {txn.gateway_name} • {txn.payment_method}
                                  </p>
                                  {txn.transaction_id && (
                                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                      TXN: {txn.transaction_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 sm:text-right">
                                <div>
                                  <p className="font-bold text-primary">{formatCurrency(txn.amount)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(txn.created_at), "dd MMM yyyy, hh:mm a")}
                                  </p>
                                </div>
                                <Badge variant="outline" className={statusCfg.color}>
                                  {statusCfg.label}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Visa Tab */}
            <TabsContent value="visa">
              {visaApplications.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Visa Applications</h3>
                    <p className="text-muted-foreground mb-4">
                      You haven't applied for any visa yet.
                    </p>
                    <Link to="/#visa">
                      <Button className="bg-gradient-primary">Apply for Visa</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {visaApplications.map((visa, index) => {
                    const currentIndex = getVisaStatusIndex(visa.status);
                    const isRejected = visa.status === 'rejected';
                    
                    return (
                      <motion.div
                        key={visa.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={cn(
                          "hover:shadow-elegant transition-shadow overflow-hidden",
                          isRejected && "border-red-200 bg-red-50/30"
                        )}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <span className="text-4xl">{visa.visa_countries.flag_emoji}</span>
                                <div>
                                  <CardTitle className="font-heading text-xl">
                                    {visa.visa_countries.country_name} Visa
                                  </CardTitle>
                                  <CardDescription>
                                    Processing Time: {visa.visa_countries.processing_time}
                                  </CardDescription>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge 
                                  className={`${visaStatusConfig[visa.status]?.color} text-white flex items-center gap-1`}
                                >
                                  {visaStatusConfig[visa.status]?.icon}
                                  {visaStatusConfig[visa.status]?.label}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={paymentStatusConfig[visa.payment_status]?.color}
                                >
                                  <CreditCard className="w-3 h-3 mr-1" />
                                  {paymentStatusConfig[visa.payment_status]?.label}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {!isRejected && (
                              <div className="mb-6 pt-4">
                                <div className="flex items-center justify-between relative">
                                  <div className="absolute left-0 right-0 top-4 h-1 bg-muted rounded-full" />
                                  <div 
                                    className="absolute left-0 top-4 h-1 bg-primary rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${(currentIndex / (visaTrackingSteps.length - 1)) * 100}%` 
                                    }}
                                  />
                                  
                                  {visaTrackingSteps.map((step, stepIndex) => {
                                    const isCompleted = stepIndex <= currentIndex;
                                    const isCurrent = stepIndex === currentIndex;
                                    const Icon = step.icon;

                                    return (
                                      <div 
                                        key={step.status} 
                                        className="relative z-10 flex flex-col items-center"
                                      >
                                        <div
                                          className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                                            isCompleted
                                              ? "bg-primary text-primary-foreground"
                                              : "bg-muted text-muted-foreground",
                                            isCurrent && "ring-4 ring-primary/20 scale-110"
                                          )}
                                        >
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={cn(
                                          "text-xs mt-2 text-center max-w-[60px]",
                                          isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                                        )}>
                                          {step.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {isRejected && (
                              <div className="mb-4 p-4 bg-red-100 border border-red-200 rounded-lg flex items-start gap-3">
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                <div>
                                  <p className="font-medium text-red-800">Application Rejected</p>
                                  {visa.admin_notes && (
                                    <p className="text-sm text-red-700 mt-1">{visa.admin_notes}</p>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Application ID</p>
                                <p className="font-medium">{visa.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Applicants</p>
                                <p className="font-medium">{visa.applicant_count} person(s)</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Travel Date</p>
                                <p className="font-medium flex items-center gap-1">
                                  <Plane className="w-4 h-4" />
                                  {visa.travel_date 
                                    ? new Date(visa.travel_date).toLocaleDateString()
                                    : "Not specified"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total Amount</p>
                                <p className="font-bold text-primary text-lg">
                                  {formatCurrency(visa.total_price)}
                                </p>
                              </div>
                            </div>

                            {!isRejected && visa.admin_notes && (
                              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                  <span className="font-medium">Note:</span> {visa.admin_notes}
                                </p>
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                              <p className="text-xs text-muted-foreground">
                                Applied on {new Date(visa.created_at).toLocaleDateString()}
                              </p>
                              <Link to={`/track-visa?id=${visa.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Search className="w-4 h-4" />
                                  Track Application
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
      <Footer />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
      />

      {/* Document Upload Modal */}
      {documentUploadBooking && (user || documentUploadBooking.user_id) && (
        <BookingDocumentUpload
          isOpen={!!documentUploadBooking}
          onClose={() => setDocumentUploadBooking(null)}
          bookingId={documentUploadBooking.id}
          userId={user?.id || documentUploadBooking.user_id || ''}
          packageTitle={documentUploadBooking.packages.title}
        />
      )}
    </div>
  );
};

export default MyBookings;
