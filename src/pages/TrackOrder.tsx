import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { 
  Search, 
  ArrowLeft,
  FileText,
  FileCheck,
  CheckCircle,
  Settings,
  PackageCheck,
  Calendar,
  Package,
  AlertCircle
} from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type TrackingStatus = 'order_submitted' | 'documents_received' | 'under_review' | 'approved' | 'processing' | 'completed';

interface GuestBooking {
  id: string;
  tracking_status: TrackingStatus;
  admin_notes: string | null;
  status: string;
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

const searchSchema = z.object({
  bookingId: z.string().min(6, "Booking ID must be at least 6 characters").max(50),
  contact: z.string().min(5, "Please enter a valid email or phone number").max(255),
});

const TrackOrder = () => {
  const { toast } = useToast();
  const [bookingId, setBookingId] = useState("");
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [searched, setSearched] = useState(false);
  const [errors, setErrors] = useState<{ bookingId?: string; contact?: string }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate inputs
    const validation = searchSchema.safeParse({ bookingId: bookingId.trim(), contact: contact.trim() });
    if (!validation.success) {
      const fieldErrors: { bookingId?: string; contact?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'bookingId') fieldErrors.bookingId = err.message;
        if (err.path[0] === 'contact') fieldErrors.contact = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setSearched(true);
    setBooking(null);

    try {
      // Search by booking ID (partial match on first 8 chars) and verify with email or phone
      const searchId = bookingId.trim().toLowerCase();
      const searchContact = contact.trim().toLowerCase();

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          tracking_status,
          admin_notes,
          status,
          total_price,
          passenger_count,
          travel_date,
          created_at,
          guest_email,
          guest_phone,
          packages (
            title,
            type,
            duration_days
          )
        `)
        .or(`guest_email.ilike.${searchContact},guest_phone.ilike.%${searchContact}%`)
        .is("user_id", null); // Only guest bookings

      if (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Find matching booking by ID
      const matchedBooking = data?.find(b => 
        b.id.toLowerCase().startsWith(searchId) || 
        b.id.slice(0, 8).toLowerCase() === searchId
      );

      if (matchedBooking) {
        // Remove sensitive data before setting state
        const { guest_email, guest_phone, ...safeBooking } = matchedBooking;
        setBooking(safeBooking as GuestBooking);
      } else {
        setBooking(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      toast({
        title: "Error",
        description: "Failed to search for booking.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setBooking(null);
    setSearched(false);
    setBookingId("");
    setContact("");
    setErrors({});
  };

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
            <h1 className="font-heading text-3xl font-bold">Track Your Order</h1>
            <p className="text-muted-foreground">Check your booking status without logging in</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find Your Booking
                </CardTitle>
                <CardDescription>
                  Enter your booking ID and the email or phone number used during booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bookingId">Booking ID</Label>
                    <Input
                      id="bookingId"
                      placeholder="e.g., A1B2C3D4"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                      className={errors.bookingId ? "border-destructive" : ""}
                    />
                    {errors.bookingId && (
                      <p className="text-sm text-destructive">{errors.bookingId}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      You can find this in your booking confirmation email
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Email or Phone Number</Label>
                    <Input
                      id="contact"
                      placeholder="Enter the email or phone used for booking"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className={errors.contact ? "border-destructive" : ""}
                    />
                    {errors.contact && (
                      <p className="text-sm text-destructive">{errors.contact}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Track Order
                        </>
                      )}
                    </Button>
                    {searched && (
                      <Button type="button" variant="outline" onClick={handleReset}>
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          {searched && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {booking ? (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-gradient-primary text-primary-foreground">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">
                          {booking.packages.title}
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/80 capitalize">
                          {booking.packages.type} Package • {booking.packages.duration_days} Days
                        </CardDescription>
                      </div>
                      <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {booking.id.slice(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {/* Progress Tracker */}
                    <div className="mb-8">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Order Progress
                      </h3>
                      <div className="relative pt-2">
                        <div className="flex items-center justify-between relative">
                          {/* Progress Line Background */}
                          <div className="absolute left-0 right-0 top-4 h-1 bg-muted rounded-full" />
                          {/* Progress Line Filled */}
                          <div 
                            className="absolute left-0 top-4 h-1 bg-primary rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(getStatusIndex(booking.tracking_status) / (trackingSteps.length - 1)) * 100}%` 
                            }}
                          />
                          
                          {trackingSteps.map((step, stepIndex) => {
                            const currentIndex = getStatusIndex(booking.tracking_status);
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
                    </div>

                    {/* Admin Notes */}
                    {booking.admin_notes && (
                      <div className="mb-6 p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <p className="text-sm font-medium mb-1">Latest Update</p>
                        <p className="text-sm text-muted-foreground">{booking.admin_notes}</p>
                      </div>
                    )}

                    {/* Booking Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                        <p className="text-muted-foreground">Booked On</p>
                        <p className="font-medium">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Amount</p>
                        <p className="font-bold text-primary text-lg">
                          {formatCurrency(booking.total_price)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Booking Not Found</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      We couldn't find a booking matching your details. Please check your booking ID and email/phone number and try again.
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Tips:</p>
                      <ul className="list-disc list-inside text-left max-w-xs mx-auto">
                        <li>The booking ID is 8 characters (e.g., A1B2C3D4)</li>
                        <li>Use the same email/phone from your booking</li>
                        <li>Guest tracking is only for bookings made without an account</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}

          {/* Info for logged in users */}
          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline">
                Log in
              </Link>
              {" "}to see all your bookings in one place.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
