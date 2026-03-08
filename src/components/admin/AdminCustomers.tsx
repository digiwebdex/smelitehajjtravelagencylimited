import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Users, Search, Edit, Trash2, FileUp, Eye, Download, X,
  Plus, Loader2, FileText, Upload, UserPlus
} from "lucide-react";
import { format } from "date-fns";

interface Customer {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  passport_number: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CustomerDocument {
  id: string;
  customer_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  notes: string | null;
  uploaded_at: string;
}

const DOCUMENT_TYPES = [
  "Passport", "Visa", "NID/National ID", "Birth Certificate",
  "Vaccination Card", "Medical Report", "Photo", "Air Ticket",
  "Hotel Booking", "Travel Insurance", "Other"
];

const AdminCustomers = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDocsDialog, setShowDocsDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("Passport");
  const [uploadNotes, setUploadNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newCustomer, setNewCustomer] = useState({
    full_name: "", email: "", phone: "", passport_number: "",
    nationality: "Bangladeshi", date_of_birth: "", gender: "",
    address: "", emergency_contact_name: "", emergency_contact_phone: "", notes: ""
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("customers").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const fetchDocuments = async (customerId: string) => {
    setDocsLoading(true);
    const { data, error } = await (supabase as any)
      .from("customer_documents").select("*")
      .eq("customer_id", customerId).order("uploaded_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setDocuments(data || []);
    }
    setDocsLoading(false);
  };

  const handleOpenDocs = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDocsDialog(true);
    fetchDocuments(customer.id);
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${selectedCustomer.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("customer-documents").upload(path, file, { cacheControl: "31536000" });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from("customer-documents").getPublicUrl(path);

      const { error: dbErr } = await (supabase as any).from("customer_documents").insert({
        customer_id: selectedCustomer.id,
        document_type: uploadDocType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        notes: uploadNotes || null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (dbErr) throw dbErr;

      toast({ title: "Document uploaded successfully" });
      fetchDocuments(selectedCustomer.id);
      setUploadNotes("");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (doc: CustomerDocument) => {
    if (!confirm("Delete this document?")) return;
    const { error } = await (supabase as any).from("customer_documents").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      if (selectedCustomer) fetchDocuments(selectedCustomer.id);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditCustomer({ ...customer });
    setShowEditDialog(true);
  };

  const handleSaveCustomer = async () => {
    if (!editCustomer) return;
    setSaving(true);
    const { error } = await (supabase as any).from("customers")
      .update({
        full_name: editCustomer.full_name,
        email: editCustomer.email,
        phone: editCustomer.phone,
        passport_number: editCustomer.passport_number,
        nationality: editCustomer.nationality,
        date_of_birth: editCustomer.date_of_birth || null,
        gender: editCustomer.gender,
        address: editCustomer.address,
        emergency_contact_name: editCustomer.emergency_contact_name,
        emergency_contact_phone: editCustomer.emergency_contact_phone,
        notes: editCustomer.notes,
        status: editCustomer.status,
      }).eq("id", editCustomer.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer updated" });
      setShowEditDialog(false);
      fetchCustomers();
    }
    setSaving(false);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.full_name) {
      toast({ title: "Name is required", variant: "destructive" }); return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("customers").insert({
      ...newCustomer,
      date_of_birth: newCustomer.date_of_birth || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer added" });
      setShowAddDialog(false);
      setNewCustomer({
        full_name: "", email: "", phone: "", passport_number: "",
        nationality: "Bangladeshi", date_of_birth: "", gender: "",
        address: "", emergency_contact_name: "", emergency_contact_phone: "", notes: ""
      });
      fetchCustomers();
    }
    setSaving(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Delete this customer and all their documents?")) return;
    const { error } = await (supabase as any).from("customers").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Customer deleted" });
      fetchCustomers();
    }
  };

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.passport_number?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const getDocSignedUrl = async (filePath: string) => {
    // Extract path from public URL
    const parts = filePath.split("/customer-documents/");
    const path = parts[parts.length - 1];
    const { data } = await supabase.storage.from("customer-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Customer Management
              <Badge variant="secondary">{customers.length}</Badge>
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search customers..." value={search}
                  onChange={e => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Button onClick={() => setShowAddDialog(true)} className="gap-1">
                <UserPlus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Passport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>{customer.phone || "—"}</TableCell>
                      <TableCell className="max-w-[180px] truncate">{customer.email || "—"}</TableCell>
                      <TableCell>{customer.passport_number || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={customer.status === "active" ? "default" : "secondary"}>
                          {customer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(customer.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDocs(customer)}
                            title="Documents">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditCustomer(customer)}
                            title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteCustomer(customer.id)}
                            title="Delete" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          {editCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input value={editCustomer.full_name}
                  onChange={e => setEditCustomer({ ...editCustomer, full_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={editCustomer.email || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, email: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input value={editCustomer.phone || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, phone: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Passport Number</label>
                <Input value={editCustomer.passport_number || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, passport_number: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Nationality</label>
                <Input value={editCustomer.nationality || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, nationality: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input type="date" value={editCustomer.date_of_birth || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, date_of_birth: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Gender</label>
                <Select value={editCustomer.gender || ""} onValueChange={v => setEditCustomer({ ...editCustomer, gender: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editCustomer.status} onValueChange={v => setEditCustomer({ ...editCustomer, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Address</label>
                <Input value={editCustomer.address || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, address: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Emergency Contact Name</label>
                <Input value={editCustomer.emergency_contact_name || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, emergency_contact_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Emergency Contact Phone</label>
                <Input value={editCustomer.emergency_contact_phone || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, emergency_contact_phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Notes</label>
                <Textarea value={editCustomer.notes || ""}
                  onChange={e => setEditCustomer({ ...editCustomer, notes: e.target.value })} rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveCustomer} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input value={newCustomer.full_name}
                onChange={e => setNewCustomer({ ...newCustomer, full_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={newCustomer.email}
                onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input value={newCustomer.phone}
                onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Passport Number</label>
              <Input value={newCustomer.passport_number}
                onChange={e => setNewCustomer({ ...newCustomer, passport_number: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Nationality</label>
              <Input value={newCustomer.nationality}
                onChange={e => setNewCustomer({ ...newCustomer, nationality: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <Input type="date" value={newCustomer.date_of_birth}
                onChange={e => setNewCustomer({ ...newCustomer, date_of_birth: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Gender</label>
              <Select value={newCustomer.gender} onValueChange={v => setNewCustomer({ ...newCustomer, gender: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input value={newCustomer.address}
                onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Contact Name</label>
              <Input value={newCustomer.emergency_contact_name}
                onChange={e => setNewCustomer({ ...newCustomer, emergency_contact_name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Emergency Contact Phone</label>
              <Input value={newCustomer.emergency_contact_phone}
                onChange={e => setNewCustomer({ ...newCustomer, emergency_contact_phone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea value={newCustomer.notes}
                onChange={e => setNewCustomer({ ...newCustomer, notes: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Dialog */}
      <Dialog open={showDocsDialog} onOpenChange={setShowDocsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents — {selectedCustomer?.full_name}
            </DialogTitle>
          </DialogHeader>

          {/* Upload Section */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium">Document Type</label>
                  <Select value={uploadDocType} onValueChange={setUploadDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium">Notes (optional)</label>
                  <Input value={uploadNotes} onChange={e => setUploadNotes(e.target.value)}
                    placeholder="e.g. Expiry: Dec 2028" />
                </div>
                <div>
                  <input ref={fileInputRef} type="file" className="hidden"
                    accept="image/*,.pdf,.doc,.docx" onChange={handleUploadDocument} />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-1">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents List */}
          {docsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileUp className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-8 w-8 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                        <span>{format(new Date(doc.uploaded_at), "dd MMM yyyy")}</span>
                        {doc.file_size && <span>{(doc.file_size / 1024).toFixed(0)} KB</span>}
                      </div>
                      {doc.notes && <p className="text-xs text-muted-foreground mt-1">{doc.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => getDocSignedUrl(doc.file_url)}
                      title="View/Download">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteDocument(doc)}
                      className="text-destructive hover:text-destructive" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
