import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Upload
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import BookingDocumentUpload from "@/components/BookingDocumentUpload";
import InstallmentDetails from "@/components/InstallmentDetails";
import { cn } from "@/lib/utils";

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
  packages: {
    title: string;
    type: string;
    duration_days: number;
  };
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  confirmed: { color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" />, label: "Confirmed" },
  cancelled: { color: "bg-red-500", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
  completed: { color: "bg-blue-500", icon: <AlertCircle className="w-4 h-4" />, label: "Completed" },
};

const trackingSteps: { status: TrackingStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: 'order_submitted', label: 'Submitted', icon: FileText },
  { status: 'documents_received', label: 'Documents', icon: FileCheck },
  { status: 'under_review', label: 'Review', icon: Search },
  { status: 'approved', label: 'Approved', icon: CheckCircle },
  { status: 'processing', label: 'Processing', icon: Settings },
  { status: 'completed', label: 'Completed', icon: PackageCheck },
];

const getStatusIndex = (status: TrackingStatus): number => {
  return trackingSteps.findIndex(step => step.status === status);
};

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [documentUploadBooking, setDocumentUploadBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      subscribeToUpdates();
    }
  }, [user]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        tracking_status,
        admin_notes,
        total_price,
        passenger_count,
        travel_date,
        created_at,
        packages (
          title,
          type,
          duration_days
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    if (!user) return;

    const channel = supabase
      .channel('my-bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <h1 className="font-heading text-3xl font-bold">My Bookings</h1>
            <p className="text-muted-foreground">Track and manage your travel bookings</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Bookings Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings yet. Explore our packages to get started!
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
                        <Badge 
                          className={`${statusConfig[booking.status]?.color} text-white flex items-center gap-1`}
                        >
                          {statusConfig[booking.status]?.icon}
                          {statusConfig[booking.status]?.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Progress Tracker */}
                      <div className="mb-6 pt-4">
                        <div className="flex items-center justify-between relative">
                          {/* Progress Line Background */}
                          <div className="absolute left-0 right-0 top-4 h-1 bg-muted rounded-full" />
                          {/* Progress Line Filled */}
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
                        <div className="flex gap-2">
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
      </main>
      <Footer />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        booking={selectedBooking}
      />

      {/* Document Upload Modal */}
      {documentUploadBooking && user && (
        <BookingDocumentUpload
          isOpen={!!documentUploadBooking}
          onClose={() => setDocumentUploadBooking(null)}
          bookingId={documentUploadBooking.id}
          userId={user.id}
          packageTitle={documentUploadBooking.packages.title}
        />
      )}
    </div>
  );
};

export default MyBookings;
