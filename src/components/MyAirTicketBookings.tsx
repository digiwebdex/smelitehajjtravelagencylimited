import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plane, Eye, Download, Loader2, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AirTicketBooking {
  id: string;
  booking_id: string;
  from_city: string;
  to_city: string;
  travel_date: string;
  return_date: string | null;
  is_round_trip: boolean;
  trip_type: "one_way" | "round_trip" | "multi_city" | null;
  cabin_class: "economy" | "premium_economy" | "business" | "first" | null;
  passenger_count: number;
  contact_email: string;
  contact_phone: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  pnr_number: string | null;
  ticket_number: string | null;
  price: number | null;
  rejection_reason: string | null;
  ticket_file_url: string | null;
  created_at: string;
}

interface AirTicketRoute {
  id: string;
  booking_id: string;
  route_order: number;
  from_city: string;
  to_city: string;
  travel_date: string;
}

const tripTypeLabels: Record<string, string> = {
  one_way: "One Way",
  round_trip: "Round Trip",
  multi_city: "Multi-City",
};

const cabinClassLabels: Record<string, string> = {
  economy: "Economy",
  premium_economy: "Premium Economy",
  business: "Business",
  first: "First Class",
};

interface Passenger {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  special_service_request: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function MyAirTicketBookings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<AirTicketBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<AirTicketBooking | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("air_ticket_bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings((data as AirTicketBooking[]) || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPassengers = async (bookingId: string) => {
    try {
      const { data, error } = await supabase
        .from("air_ticket_passengers")
        .select("*")
        .eq("booking_id", bookingId);

      if (error) throw error;
      setPassengers((data as Passenger[]) || []);
    } catch (error: any) {
      console.error("Error fetching passengers:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const openDetails = async (booking: AirTicketBooking) => {
    setSelectedBooking(booking);
    await fetchPassengers(booking.id);
    setDetailsOpen(true);
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            My Air Ticket Bookings
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your flight booking requests and status
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? "No bookings match your search" : "You haven't made any air ticket bookings yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{booking.booking_id}</span>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{booking.from_city}</span>
                      <Plane className="w-4 h-4 text-primary" />
                      <span className="font-medium">{booking.to_city}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs">
                        {tripTypeLabels[booking.trip_type || "one_way"]}
                      </Badge>
                      {booking.cabin_class && (
                        <Badge variant="secondary" className="text-xs">
                          {cabinClassLabels[booking.cabin_class]}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Travel: {format(new Date(booking.travel_date), "PPP")} •{" "}
                      {booking.passenger_count} Passenger(s)
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    {booking.price && (
                      <div className="text-lg font-bold text-primary">
                        ৳{booking.price.toLocaleString()}
                      </div>
                    )}
                    {booking.pnr_number && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">PNR: </span>
                        <span className="font-medium">{booking.pnr_number}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openDetails(booking)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      {booking.status === "confirmed" && booking.ticket_file_url && (
                        <Button size="sm" asChild>
                          <a href={booking.ticket_file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            Download Ticket
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {booking.status === "rejected" && booking.rejection_reason && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">
                      <strong>Rejection Reason:</strong> {booking.rejection_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Booking Details - {selectedBooking?.booking_id}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Flight Details</TabsTrigger>
                <TabsTrigger value="passengers">Passengers ({passengers.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Route</Label>
                    <p className="font-medium">
                      {selectedBooking.from_city} → {selectedBooking.to_city}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedBooking.status]}>
                      {selectedBooking.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Travel Date</Label>
                    <p className="font-medium">
                      {format(new Date(selectedBooking.travel_date), "PPP")}
                    </p>
                  </div>
                  {selectedBooking.return_date && (
                    <div>
                      <Label className="text-muted-foreground">Return Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedBooking.return_date), "PPP")}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Trip Type</Label>
                    <p className="font-medium">
                      {tripTypeLabels[selectedBooking.trip_type || "one_way"]}
                    </p>
                  </div>
                  {selectedBooking.cabin_class && (
                    <div>
                      <Label className="text-muted-foreground">Cabin Class</Label>
                      <p className="font-medium">
                        {cabinClassLabels[selectedBooking.cabin_class]}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Passengers</Label>
                    <p className="font-medium">{selectedBooking.passenger_count}</p>
                  </div>
                  {selectedBooking.pnr_number && (
                    <div>
                      <Label className="text-muted-foreground">PNR</Label>
                      <p className="font-medium font-mono">{selectedBooking.pnr_number}</p>
                    </div>
                  )}
                  {selectedBooking.ticket_number && (
                    <div>
                      <Label className="text-muted-foreground">Ticket Number</Label>
                      <p className="font-medium font-mono">{selectedBooking.ticket_number}</p>
                    </div>
                  )}
                  {selectedBooking.price && (
                    <div>
                      <Label className="text-muted-foreground">Total Price</Label>
                      <p className="font-medium text-lg text-primary">
                        ৳{selectedBooking.price.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-muted-foreground">Booked On</Label>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.created_at), "PPP 'at' p")}
                  </p>
                </div>

                {selectedBooking.status === "confirmed" && selectedBooking.ticket_file_url && (
                  <Button asChild className="w-full">
                    <a href={selectedBooking.ticket_file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />
                      Download E-Ticket
                    </a>
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="passengers" className="space-y-4">
                {passengers.map((passenger, index) => (
                  <Card key={passenger.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Passenger {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-muted-foreground text-xs">Name</Label>
                        <p className="font-medium">
                          {passenger.first_name} {passenger.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Gender</Label>
                        <p className="font-medium capitalize">{passenger.gender}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Date of Birth</Label>
                        <p className="font-medium">
                          {format(new Date(passenger.date_of_birth), "PP")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nationality</Label>
                        <p className="font-medium">{passenger.nationality}</p>
                      </div>
                      {passenger.special_service_request && (
                        <div className="col-span-2">
                          <Label className="text-muted-foreground text-xs">Special Request</Label>
                          <p className="font-medium">{passenger.special_service_request}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
