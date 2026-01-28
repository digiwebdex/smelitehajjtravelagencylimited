import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  Home, 
  Package,
  Calendar,
  Users,
  CreditCard,
  MapPin,
  FileText,
  FileCheck,
  Search,
  Settings,
  PackageCheck,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  Upload
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { generateBookingPDF } from "@/utils/generateBookingPDF";
import { cn } from "@/lib/utils";
import BookingDocumentUploadInline from "@/components/BookingDocumentUploadInline";
import { useAuth } from "@/hooks/useAuth";

type TrackingStatus = 'order_submitted' | 'documents_received' | 'under_review' | 'approved' | 'processing' | 'completed';

interface BookingDetails {
  id: string;
  created_at: string;
  total_price: number;
  passenger_count: number;
  travel_date: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  payment_status: string;
  payment_method: string | null;
  tracking_status: TrackingStatus;
  user_id: string | null;
  packages: {
    title: string;
    type: string;
    duration_days: number;
    price: number;
  };
}

const trackingSteps: { status: TrackingStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'order_submitted', label: 'Submitted', icon: FileText },
  { status: 'documents_received', label: 'Documents', icon: FileCheck },
  { status: 'under_review', label: 'Review', icon: Search },
  { status: 'approved', label: 'Approved', icon: CheckCircle2 },
  { status: 'processing', label: 'Processing', icon: Settings },
  { status: 'completed', label: 'Completed', icon: PackageCheck },
];

const paymentMethodLabels: Record<string, string> = {
  sslcommerz: 'Online Payment (SSLCommerz)',
  bkash: 'bKash',
  nagad: 'Nagad',
  bank_transfer: 'Bank Transfer',
  cash: 'Cash Payment',
  installment: 'Installment Plan',
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", label: "Payment Pending" },
  pending_cash: { color: "bg-orange-500/20 text-orange-700 border-orange-500/30", label: "Cash on Arrival" },
  pending_verification: { color: "bg-blue-500/20 text-blue-700 border-blue-500/30", label: "Verifying Payment" },
  emi_pending: { color: "bg-purple-500/20 text-purple-700 border-purple-500/30", label: "EMI Plan Active" },
  paid: { color: "bg-green-500/20 text-green-700 border-green-500/30", label: "Paid" },
  failed: { color: "bg-red-500/20 text-red-700 border-red-500/30", label: "Failed" },
};

const getNextSteps = (paymentMethod: string | null, paymentStatus: string): string[] => {
  const steps: string[] = [];
  
  if (paymentStatus === 'pending_verification') {
    steps.push('Our team will verify your bank transfer within 24-48 hours.');
    steps.push('You will receive a confirmation once payment is verified.');
  } else if (paymentStatus === 'pending_cash') {
    steps.push('Please visit our office to complete the cash payment.');
    steps.push('Bring a valid ID and this booking reference.');
  } else if (paymentStatus === 'emi_pending') {
    steps.push('Your installment plan is active. Check "My Bookings" for payment schedule.');
    steps.push('Ensure timely payment of installments to avoid penalties.');
  } else if (paymentStatus === 'pending') {
    steps.push('Complete your payment to confirm the booking.');
  }
  
  steps.push('Upload required documents (passport copy, photos) from "My Bookings" page.');
  steps.push('Our team will contact you shortly with further details.');
  
  return steps;
};

const BookingConfirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          created_at,
          total_price,
          passenger_count,
          travel_date,
          guest_name,
          guest_email,
          guest_phone,
          payment_status,
          payment_method,
          tracking_status,
          user_id,
          packages (
            title,
            type,
            duration_days,
            price
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Booking not found");

      setBooking(data as BookingDetails);
    } catch (err: any) {
      console.error("Error fetching booking:", err);
      setError(err.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (booking) {
      generateBookingPDF(booking);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container pt-40 pb-20">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
              <p className="text-muted-foreground mb-6">{error || "The booking you're looking for doesn't exist."}</p>
              <Link to="/">
                <Button>Return Home</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentIndex = trackingSteps.findIndex(s => s.status === booking.tracking_status);
  const nextSteps = getNextSteps(booking.payment_method, booking.payment_status);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
              Booking Confirmed!
            </h1>
            <p className="text-muted-foreground">
              Thank you for booking with SM Elite Hajj Travel
            </p>
          </div>

          {/* Booking ID Card */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-sm text-muted-foreground">Booking Reference</p>
                  <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                    {booking.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Badge className={cn("text-sm", paymentStatusConfig[booking.payment_status]?.color)}>
                  {paymentStatusConfig[booking.payment_status]?.label || "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Progress Tracker */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Booking Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between relative py-4">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-muted rounded-full" />
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${(currentIndex / (trackingSteps.length - 1)) * 100}%` }}
                />
                
                {trackingSteps.map((step, idx) => {
                  const isCompleted = idx <= currentIndex;
                  const isCurrent = idx === currentIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="relative z-10 flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                          isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                          isCurrent && "ring-4 ring-primary/20 scale-110"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "text-xs mt-2 text-center max-w-[70px]",
                        isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Booking Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Booking Details
              </CardTitle>
              <CardDescription>
                {booking.packages.type.charAt(0).toUpperCase() + booking.packages.type.slice(1)} Package
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Package</p>
                  <p className="font-semibold">{booking.packages.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-semibold">{booking.packages.duration_days} Days</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-4 h-4" /> Passengers
                  </p>
                  <p className="font-semibold">{booking.passenger_count} person(s)</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Travel Date
                  </p>
                  <p className="font-semibold">
                    {booking.travel_date 
                      ? new Date(booking.travel_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : "To be confirmed"}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="w-4 h-4" /> Payment Method
                  </p>
                  <p className="font-medium">
                    {paymentMethodLabels[booking.payment_method || ''] || 'Not specified'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(booking.total_price)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6 border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-500">
                <Clock className="w-5 h-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {nextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-500 flex items-center justify-center text-sm font-medium">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground/80">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Document Upload Section */}
          {bookingId && (user || booking.user_id) && (
            <div className="mb-6">
              <BookingDocumentUploadInline 
                bookingId={bookingId}
                userId={user?.id || booking.user_id || ''}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center print:hidden">
            <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download Receipt
            </Button>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Link to="/my-bookings">
              <Button className="gap-2 w-full sm:w-auto bg-gradient-primary">
                <Package className="w-4 h-4" />
                My Bookings
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p className="mb-2">Need assistance? Contact us:</p>
            <div className="flex items-center justify-center gap-4">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> +880 1234 567890
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> info@smelitehajj.com
              </span>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingConfirmation;
