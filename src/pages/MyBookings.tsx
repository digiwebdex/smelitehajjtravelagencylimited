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
import { Calendar, Package, ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface Booking {
  id: string;
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

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-yellow-500", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  confirmed: { color: "bg-green-500", icon: <CheckCircle className="w-4 h-4" />, label: "Confirmed" },
  cancelled: { color: "bg-red-500", icon: <XCircle className="w-4 h-4" />, label: "Cancelled" },
  completed: { color: "bg-blue-500", icon: <AlertCircle className="w-4 h-4" />, label: "Completed" },
};

const MyBookings = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
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
            {bookings.map((booking, index) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-elegant transition-shadow">
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
                    <p className="text-xs text-muted-foreground mt-4">
                      Booked on {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
