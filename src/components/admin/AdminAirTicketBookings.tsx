import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Plane,
  Search,
  Eye,
  Check,
  X,
  Download,
  Upload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
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
  country_code: string;
  remarks: string | null;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  pnr_number: string | null;
  ticket_number: string | null;
  price: number | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  ticket_file_url: string | null;
  guest_name: string | null;
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
  passport_number: string | null;
  frequent_flyer_number: string | null;
  special_service_request: string | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

export default function AdminAirTicketBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<AirTicketBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<AirTicketBooking | null>(null);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Action form state
  const [pnrNumber, setPnrNumber] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [price, setPrice] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("air_ticket_bookings")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "pending" | "confirmed" | "rejected" | "cancelled");
      }

      const { data, error } = await query;

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
    fetchBookings();
  }, [statusFilter]);

  const openDetails = async (booking: AirTicketBooking) => {
    setSelectedBooking(booking);
    setPnrNumber(booking.pnr_number || "");
    setTicketNumber(booking.ticket_number || "");
    setPrice(booking.price?.toString() || "");
    setAdminNotes(booking.admin_notes || "");
    setRejectionReason(booking.rejection_reason || "");
    await fetchPassengers(booking.id);
    setDetailsOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedBooking) return;
    if (!pnrNumber || !ticketNumber || !price) {
      toast({
        title: "Missing Information",
        description: "Please fill PNR, Ticket Number, and Price before approving.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("air_ticket_bookings")
        .update({
          status: "confirmed" as const,
          pnr_number: pnrNumber,
          ticket_number: ticketNumber,
          price: parseFloat(price),
          admin_notes: adminNotes,
          approved_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Approved",
        description: `Booking ${selectedBooking.booking_id} has been confirmed.`,
      });

      // Trigger notification
      try {
        await supabase.functions.invoke("send-air-ticket-notification", {
          body: { bookingId: selectedBooking.id, type: "confirmed" },
        });
      } catch (e) {
        console.log("Notification error:", e);
      }

      setDetailsOpen(false);
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedBooking) return;
    if (!rejectionReason) {
      toast({
        title: "Missing Reason",
        description: "Please provide a rejection reason.",
        variant: "destructive",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("air_ticket_bookings")
        .update({
          status: "rejected" as const,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes,
          rejected_at: new Date().toISOString(),
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Rejected",
        description: `Booking ${selectedBooking.booking_id} has been rejected.`,
      });

      // Trigger notification
      try {
        await supabase.functions.invoke("send-air-ticket-notification", {
          body: { bookingId: selectedBooking.id, type: "rejected" },
        });
      } catch (e) {
        console.log("Notification error:", e);
      }

      setDetailsOpen(false);
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.from_city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.to_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    rejected: bookings.filter((b) => b.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Rejected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by booking ID, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={fetchBookings}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Travel Date</TableHead>
                <TableHead>Passengers</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.booking_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{booking.from_city}</span>
                        <Plane className="w-3 h-3 text-muted-foreground" />
                        <span>{booking.to_city}</span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {tripTypeLabels[booking.trip_type || "one_way"]}
                        </Badge>
                        {booking.cabin_class && (
                          <Badge variant="secondary" className="text-xs">
                            {cabinClassLabels[booking.cabin_class]}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{format(new Date(booking.travel_date), "PP")}</TableCell>
                    <TableCell>{booking.passenger_count}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{booking.contact_email}</div>
                        <div className="text-muted-foreground">
                          {booking.country_code} {booking.contact_phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status]}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {booking.price ? `৳${booking.price.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetails(booking)}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Booking Details - {selectedBooking?.booking_id}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Booking Details</TabsTrigger>
                <TabsTrigger value="passengers">Passengers ({passengers.length})</TabsTrigger>
                <TabsTrigger value="action">Approve/Reject</TabsTrigger>
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
                    <Label className="text-muted-foreground">Trip Type</Label>
                    <p className="font-medium">
                      {selectedBooking.is_round_trip ? "Round Trip" : "One Way"}
                    </p>
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
                    <Label className="text-muted-foreground">Passengers</Label>
                    <p className="font-medium">{selectedBooking.passenger_count}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <Badge className={statusColors[selectedBooking.status]}>
                      {selectedBooking.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedBooking.contact_email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <p className="font-medium">
                      {selectedBooking.country_code} {selectedBooking.contact_phone}
                    </p>
                  </div>
                  {selectedBooking.pnr_number && (
                    <div>
                      <Label className="text-muted-foreground">PNR</Label>
                      <p className="font-medium">{selectedBooking.pnr_number}</p>
                    </div>
                  )}
                  {selectedBooking.ticket_number && (
                    <div>
                      <Label className="text-muted-foreground">Ticket Number</Label>
                      <p className="font-medium">{selectedBooking.ticket_number}</p>
                    </div>
                  )}
                  {selectedBooking.price && (
                    <div>
                      <Label className="text-muted-foreground">Price</Label>
                      <p className="font-medium">৳{selectedBooking.price.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {selectedBooking.remarks && (
                  <div>
                    <Label className="text-muted-foreground">Remarks</Label>
                    <p className="font-medium">{selectedBooking.remarks}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.created_at), "PPP 'at' p")}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="passengers" className="space-y-4">
                {passengers.map((passenger, index) => (
                  <Card key={passenger.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Passenger {index + 1}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
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
                        <Label className="text-muted-foreground text-xs">DOB</Label>
                        <p className="font-medium">
                          {format(new Date(passenger.date_of_birth), "PP")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Nationality</Label>
                        <p className="font-medium">{passenger.nationality}</p>
                      </div>
                      {passenger.passport_number && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Passport</Label>
                          <p className="font-medium">{passenger.passport_number}</p>
                        </div>
                      )}
                      {passenger.frequent_flyer_number && (
                        <div>
                          <Label className="text-muted-foreground text-xs">FF Number</Label>
                          <p className="font-medium">{passenger.frequent_flyer_number}</p>
                        </div>
                      )}
                      {passenger.special_service_request && (
                        <div className="col-span-full">
                          <Label className="text-muted-foreground text-xs">Special Request</Label>
                          <p className="font-medium">{passenger.special_service_request}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="action" className="space-y-4">
                {selectedBooking.status === "pending" ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>PNR Number *</Label>
                        <Input
                          value={pnrNumber}
                          onChange={(e) => setPnrNumber(e.target.value)}
                          placeholder="Enter PNR"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ticket Number *</Label>
                        <Input
                          value={ticketNumber}
                          onChange={(e) => setTicketNumber(e.target.value)}
                          placeholder="Enter Ticket Number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (BDT) *</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder="Enter Price"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Admin Notes</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal notes (not shown to customer)"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleApprove}
                        disabled={actionLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 mr-2" />
                        )}
                        Approve & Confirm
                      </Button>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <h4 className="font-medium text-red-600">Or Reject Booking</h4>
                      <div className="space-y-2">
                        <Label>Rejection Reason *</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Reason for rejection (will be sent to customer)"
                          rows={2}
                        />
                      </div>
                      <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <X className="w-4 h-4 mr-2" />
                        )}
                        Reject Booking
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    This booking has already been{" "}
                    <Badge className={statusColors[selectedBooking.status]}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
