import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePaymentProcessing } from "@/hooks/usePaymentProcessing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Home, Phone, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

type PaymentStatus = "success" | "failed" | "cancelled" | "processing" | "pending_cash";

interface BookingDetails {
  id: string;
  total_price: number;
  guest_name: string | null;
  payment_status: string;
  transaction_id: string | null;
  package: {
    title: string;
    type: string;
  } | null;
}

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment, processing } = usePaymentProcessing();
  const [status, setStatus] = useState<PaymentStatus>("processing");
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const gateway = searchParams.get("gateway");
  const bookingId = searchParams.get("bookingId");
  const paymentId = searchParams.get("paymentID") || searchParams.get("val_id") || searchParams.get("payment_ref_id");
  const paymentStatus = searchParams.get("status");

  useEffect(() => {
    const processPaymentResult = async () => {
      // Determine initial status from URL path
      const path = window.location.pathname;
      if (path.includes("/success")) {
        setStatus("success");
      } else if (path.includes("/failed")) {
        setStatus("failed");
      } else if (path.includes("/cancelled")) {
        setStatus("cancelled");
      }

      // Fetch booking details if we have bookingId
      if (bookingId) {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select(`
            id,
            total_price,
            guest_name,
            payment_status,
            transaction_id,
            package:packages(title, type)
          `)
          .eq("id", bookingId)
          .single();

        if (bookingData) {
          setBooking(bookingData as BookingDetails);
          
          // Check payment status from booking
          if (bookingData.payment_status === "paid") {
            setStatus("success");
          } else if (bookingData.payment_status === "pending_cash") {
            setStatus("pending_cash");
          } else if (bookingData.payment_status === "failed") {
            setStatus("failed");
          }
        }
      }

      // If we have callback data, verify the payment
      if (gateway && paymentId && bookingId && !verificationAttempted) {
        setVerificationAttempted(true);
        setStatus("processing");

        const result = await verifyPayment(gateway, paymentId, bookingId);
        
        if (result.success) {
          setStatus("success");
          // Refresh booking data
          const { data: updatedBooking } = await supabase
            .from("bookings")
            .select(`
              id,
              total_price,
              guest_name,
              payment_status,
              transaction_id,
              package:packages(title, type)
            `)
            .eq("id", bookingId)
            .single();
          
          if (updatedBooking) {
            setBooking(updatedBooking as BookingDetails);
          }
        } else {
          setStatus("failed");
        }
      }
    };

    processPaymentResult();
  }, [gateway, bookingId, paymentId, paymentStatus, verifyPayment, verificationAttempted]);

  const statusConfig = {
    success: {
      icon: CheckCircle,
      title: "Payment Successful!",
      description: "Your booking has been confirmed and payment received.",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    failed: {
      icon: XCircle,
      title: "Payment Failed",
      description: "Unfortunately, your payment could not be processed.",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    cancelled: {
      icon: XCircle,
      title: "Payment Cancelled",
      description: "You cancelled the payment. Your booking is on hold.",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    processing: {
      icon: Loader2,
      title: "Processing Payment...",
      description: "Please wait while we verify your payment.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    pending_cash: {
      icon: Clock,
      title: "Booking Confirmed!",
      description: "Please visit our office to complete the cash payment.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={`w-20 h-20 mx-auto rounded-full ${config.bgColor} flex items-center justify-center mb-4`}
            >
              <Icon className={`w-10 h-10 ${config.color} ${status === "processing" ? "animate-spin" : ""}`} />
            </motion.div>
            <CardTitle className="text-2xl">{config.title}</CardTitle>
            <CardDescription className="text-base">
              {config.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {booking && (
              <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span className="font-medium">{booking.package?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{booking.guest_name || "Guest"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">
                    {formatCurrency(booking.total_price)}
                  </span>
                </div>
                {booking.transaction_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID</span>
                    <span className="font-mono text-sm">{booking.transaction_id}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button asChild className="w-full bg-gradient-primary">
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Link>
              </Button>

              {(status === "failed" || status === "cancelled") && (
                <Button variant="outline" asChild className="w-full">
                  <Link to="/#packages">
                    Try Again
                  </Link>
                </Button>
              )}

              {status === "pending_cash" && (
                <Button variant="outline" asChild className="w-full">
                  <a href="tel:+8801234567890">
                    <Phone className="w-4 h-4 mr-2" />
                    Contact Us
                  </a>
                </Button>
              )}
            </div>

            {status === "success" && (
              <p className="text-sm text-muted-foreground">
                A confirmation has been sent to your phone/email. 
                Thank you for choosing us!
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default PaymentResult;
