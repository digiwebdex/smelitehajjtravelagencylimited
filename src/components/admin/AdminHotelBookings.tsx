import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Building2,
  Search,
  Eye,
  Check,
  X,
  Loader2,
  RefreshCw,
  Calendar,
  Users,
  Phone,
  Mail,
  Save,
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

interface HotelBookingRequest {
  id: string;
  request_id: string;
  hotel_id: string | null;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string;
  country_code: string | null;
  check_in_date: string;
  check_out_date: string;
  room_count: number;
  adult_count: number;
  child_count: number;
  special_requests: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  hotels?: {
    name: string;
    city: string;
    star_rating: number;
  } | null;
}

interface Hotel {
  id: string;
  name: string;
  city: string;
  star_rating: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
};

export default function AdminHotelBookings() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<HotelBookingRequest[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<HotelBookingRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Editable form state
  const [formData, setFormData] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
    country_code: "",
    hotel_id: "",
    check_in_date: "",
    check_out_date: "",
    room_count: 1,
    adult_count: 1,
    child_count: 0,
    special_requests: "",
    admin_notes: "",
    status: "pending",
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("hotel_booking_requests")
        .select("*, hotels(name, city, star_rating)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data as HotelBookingRequest[]) || []);
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

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("hotels")
      .select("id, name, city, star_rating")
      .eq("is_active", true)
      .order("name");

    if (!error && data) {
      setHotels(data);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchHotels();
  }, [statusFilter]);

  const openDetails = (booking: HotelBookingRequest) => {
    setSelectedBooking(booking);
    setFormData({
      guest_name: booking.guest_name || "",
      guest_email: booking.guest_email || "",
      guest_phone: booking.guest_phone || "",
      country_code: booking.country_code || "+880",
      hotel_id: booking.hotel_id || "",
      check_in_date: booking.check_in_date || "",
      check_out_date: booking.check_out_date || "",
      room_count: booking.room_count || 1,
      adult_count: booking.adult_count || 1,
      child_count: booking.child_count || 0,
      special_requests: booking.special_requests || "",
      admin_notes: booking.admin_notes || "",
      status: booking.status || "pending",
    });
    setDetailsOpen(true);
  };

  const handleSave = async () => {
    if (!selectedBooking) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("hotel_booking_requests")
        .update({
          guest_name: formData.guest_name,
          guest_email: formData.guest_email || null,
          guest_phone: formData.guest_phone,
          country_code: formData.country_code,
          hotel_id: formData.hotel_id || null,
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          room_count: formData.room_count,
          adult_count: formData.adult_count,
          child_count: formData.child_count,
          special_requests: formData.special_requests || null,
          admin_notes: formData.admin_notes || null,
          status: formData.status,
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Updated",
        description: `Booking ${selectedBooking.request_id} has been updated.`,
      });

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

  const handleConfirm = async () => {
    if (!selectedBooking) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("hotel_booking_requests")
        .update({
          ...formData,
          status: "confirmed",
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Confirmed",
        description: `Booking ${selectedBooking.request_id} has been confirmed.`,
      });

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

  const handleCancel = async () => {
    if (!selectedBooking) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("hotel_booking_requests")
        .update({
          ...formData,
          status: "cancelled",
        })
        .eq("id", selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Booking Cancelled",
        description: `Booking ${selectedBooking.request_id} has been cancelled.`,
      });

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
      b.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.guest_email && b.guest_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (b.hotels?.name && b.hotels.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    completed: bookings.filter((b) => b.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by request ID, name, email, or hotel..."
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
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
                <TableHead>Request ID</TableHead>
                <TableHead>Hotel</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Rooms/Guests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hotel bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{booking.request_id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.hotels?.name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {booking.hotels?.city} • {booking.hotels?.star_rating}★
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{booking.guest_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.country_code} {booking.guest_phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>In: {format(new Date(booking.check_in_date), "PP")}</div>
                        <div>Out: {format(new Date(booking.check_out_date), "PP")}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{booking.room_count} room(s)</div>
                        <div className="text-muted-foreground">
                          {booking.adult_count} adults, {booking.child_count} children
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[booking.status] || ""}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </Badge>
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
              <Building2 className="w-5 h-5" />
              Booking Details - {selectedBooking?.request_id}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Guest & Booking</TabsTrigger>
                <TabsTrigger value="hotel">Hotel Selection</TabsTrigger>
                <TabsTrigger value="notes">Notes & Status</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Guest Name</Label>
                    <Input
                      value={formData.guest_name}
                      onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.guest_email}
                      onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country Code</Label>
                    <Input
                      value={formData.country_code}
                      onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                      placeholder="+880"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Input
                      type="date"
                      value={formData.check_in_date}
                      onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Input
                      type="date"
                      value={formData.check_out_date}
                      onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Room Count</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.room_count}
                      onChange={(e) => setFormData({ ...formData, room_count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Adult Count</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.adult_count}
                      onChange={(e) => setFormData({ ...formData, adult_count: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Child Count</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.child_count}
                      onChange={(e) => setFormData({ ...formData, child_count: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Special Requests</Label>
                  <Textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
                    placeholder="Any special requests from the guest..."
                    className="min-h-[80px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="hotel" className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Hotel</Label>
                  <Select
                    value={formData.hotel_id}
                    onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a hotel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {hotels.map((hotel) => (
                        <SelectItem key={hotel.id} value={hotel.id}>
                          {hotel.name} ({hotel.city}, {hotel.star_rating}★)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.hotel_id && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-sm text-muted-foreground">
                        Selected hotel will be linked to this booking request.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={formData.admin_notes}
                    onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                    placeholder="Internal notes about this booking..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{format(new Date(selectedBooking.created_at), "PPP 'at' p")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Last Updated</Label>
                    <p>{format(new Date(selectedBooking.updated_at), "PPP 'at' p")}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              {formData.status === "pending" && (
                <>
                  <Button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Confirm Booking
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <X className="w-4 h-4 mr-2" />
                    )}
                    Cancel Booking
                  </Button>
                </>
              )}
            </div>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
