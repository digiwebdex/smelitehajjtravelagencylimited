import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTenantPackages } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Package, Eye, Edit } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";

interface GroupInquiry {
  id: string;
  group_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  traveler_count: number;
  preferred_package_id: string | null;
  budget: string | null;
  travel_date: string | null;
  special_requirements: string | null;
  lead_status: string;
  assigned_to: string | null;
  group_discount: number;
  notes: string | null;
  created_at: string;
  package?: { title: string };
}

interface PackageOption {
  id: string;
  title: string;
}

const statusOptions = [
  { value: "New", label: "New", color: "bg-blue-500" },
  { value: "Contacted", label: "Contacted", color: "bg-yellow-500" },
  { value: "Quoted", label: "Quoted", color: "bg-purple-500" },
  { value: "Converted", label: "Converted", color: "bg-green-500" },
  { value: "Lost", label: "Lost", color: "bg-red-500" },
];

const AdminGroupInquiries = () => {
  const { toast } = useToast();
  const [inquiries, setInquiries] = useState<GroupInquiry[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<GroupInquiry | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [editForm, setEditForm] = useState({
    lead_status: "",
    group_discount: 0,
    notes: "",
  });

  useEffect(() => {
    fetchInquiries();
    fetchPackages();
  }, []);

  const fetchInquiries = async () => {
    const { data, error } = await supabase
      .from("group_inquiries")
      .select(`
        *,
        package:packages(title)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) setInquiries(data as GroupInquiry[]);
    setLoading(false);
  };

  const fetchPackages = async () => {
    const { data } = await getTenantPackages({
      select: "id, title",
      activeOnly: true,
    });

    if (data) setPackages(data);
  };

  const viewDetails = (inquiry: GroupInquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsOpen(true);
  };

  const openEdit = (inquiry: GroupInquiry) => {
    setSelectedInquiry(inquiry);
    setEditForm({
      lead_status: inquiry.lead_status,
      group_discount: inquiry.group_discount,
      notes: inquiry.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedInquiry) return;

    const { error } = await supabase
      .from("group_inquiries")
      .update({
        lead_status: editForm.lead_status,
        group_discount: editForm.group_discount,
        notes: editForm.notes || null,
      })
      .eq("id", selectedInquiry.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Inquiry updated" });
      setIsEditOpen(false);
      fetchInquiries();
    }
  };

  const filteredInquiries = filterStatus === "all"
    ? inquiries
    : inquiries.filter((i) => i.lead_status === filterStatus);

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return (
      <Badge className={statusOption?.color || "bg-gray-500"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statusOptions.map((status) => {
          const count = inquiries.filter((i) => i.lead_status === status.value).length;
          return (
            <Card key={status.value}>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm text-muted-foreground">{status.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Group Booking Inquiries
            </CardTitle>
            <CardDescription>
              Manage group travel inquiries and apply discounts
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
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
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Travelers</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Travel Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInquiries.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell>
                    <div className="font-medium">{inquiry.group_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(inquiry.created_at), "MMM d, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{inquiry.contact_name}</div>
                    <div className="text-xs text-muted-foreground">{inquiry.contact_phone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {inquiry.traveler_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    {inquiry.package?.title || (
                      <span className="text-muted-foreground">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inquiry.travel_date ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {format(new Date(inquiry.travel_date), "MMM yyyy")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(inquiry.lead_status)}</TableCell>
                  <TableCell>
                    {inquiry.group_discount > 0 ? (
                      <Badge variant="secondary">{inquiry.group_discount}%</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => viewDetails(inquiry)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(inquiry)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredInquiries.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No group inquiries found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Group Inquiry Details</DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Group Name</label>
                  <p className="font-medium">{selectedInquiry.group_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Travelers</label>
                  <p className="font-medium">{selectedInquiry.traveler_count} people</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Contact Name</label>
                  <p>{selectedInquiry.contact_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedInquiry.contact_phone}</p>
                </div>
              </div>
              {selectedInquiry.contact_email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{selectedInquiry.contact_email}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Preferred Package</label>
                  <p>{selectedInquiry.package?.title || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Budget</label>
                  <p>{selectedInquiry.budget || "Not specified"}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Travel Date</label>
                <p>{selectedInquiry.travel_date ? format(new Date(selectedInquiry.travel_date), "MMMM yyyy") : "Not specified"}</p>
              </div>
              {selectedInquiry.special_requirements && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Special Requirements</label>
                  <p className="text-sm">{selectedInquiry.special_requirements}</p>
                </div>
              )}
              {selectedInquiry.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                  <p className="text-sm">{selectedInquiry.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Inquiry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editForm.lead_status}
                onValueChange={(value) => setEditForm({ ...editForm, lead_status: value })}
              >
                <SelectTrigger>
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
            <div>
              <label className="text-sm font-medium">Group Discount (%)</label>
              <Input
                type="number"
                min={0}
                max={50}
                value={editForm.group_discount}
                onChange={(e) => setEditForm({ ...editForm, group_discount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Internal notes..."
                rows={3}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminGroupInquiries;
