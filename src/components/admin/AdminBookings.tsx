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
import { Search, Eye, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";

interface Booking {
  id: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_price: number;
  passenger_count: number;
  travel_date: string | null;
  notes: string | null;
  passenger_details: Record<string, string> | null;
  created_at: string;
  user_id: string;
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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        total_price,
        passenger_count,
        travel_date,
        notes,
        passenger_details,
        created_at,
        user_id,
        packages (
          title,
          type
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      // Fetch profiles separately
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      const bookingsWithProfiles = data.map(booking => ({
        ...booking,
        profiles: profileMap.get(booking.user_id) || null,
      }));
      
      setBookings(bookingsWithProfiles as Booking[]);
    }
    setLoading(false);
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

  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.packages.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
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
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
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
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.id.slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.profiles?.full_name || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{booking.profiles?.email}</p>
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
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-xs">
                      {new Date(booking.created_at).toLocaleDateString()}
                    </TableCell>
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
                ))}
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
          {selectedBooking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedBooking.profiles?.full_name || "N/A"}</p>
                  <p className="text-sm">{selectedBooking.profiles?.email}</p>
                  <p className="text-sm">{selectedBooking.profiles?.phone}</p>
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

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(selectedBooking.total_price))}
                  </p>
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminBookings;
