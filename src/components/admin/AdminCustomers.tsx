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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users, Search, Edit, Trash2, FileUp, Eye, Download, X,
  Plus, Loader2, FileText, Upload, UserPlus, Phone, Mail,
  MapPin, Calendar, Shield, User, AlertCircle, Printer
} from "lucide-react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [viewDocuments, setViewDocuments] = useState<CustomerDocument[]>([]);
  const [viewDocsLoading, setViewDocsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadDocType, setUploadDocType] = useState("Passport");
  const [uploadNotes, setUploadNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [editDocuments, setEditDocuments] = useState<CustomerDocument[]>([]);
  const [editDocsLoading, setEditDocsLoading] = useState(false);

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

  const fetchEditDocuments = async (customerId: string) => {
    setEditDocsLoading(true);
    const { data, error } = await (supabase as any)
      .from("customer_documents").select("*")
      .eq("customer_id", customerId).order("uploaded_at", { ascending: false });
    if (!error) setEditDocuments(data || []);
    setEditDocsLoading(false);
  };

  const handleEditUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editCustomer) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB allowed", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${editCustomer.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("customer-documents").upload(path, file, { cacheControl: "31536000" });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("customer-documents").getPublicUrl(path);
      const { error: dbErr } = await (supabase as any).from("customer_documents").insert({
        customer_id: editCustomer.id,
        document_type: uploadDocType,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        notes: uploadNotes || null,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (dbErr) throw dbErr;
      toast({ title: "Document uploaded successfully" });
      fetchEditDocuments(editCustomer.id);
      setUploadNotes("");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleDeleteDocumentInEdit = async (doc: CustomerDocument) => {
    if (!confirm("Delete this document?")) return;
    const { error } = await (supabase as any).from("customer_documents").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Document deleted" });
      if (editCustomer) fetchEditDocuments(editCustomer.id);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditCustomer({ ...customer });
    setShowEditDialog(true);
    fetchEditDocuments(customer.id);
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
    const parts = filePath.split("/customer-documents/");
    const path = parts[parts.length - 1];
    const { data } = await supabase.storage.from("customer-documents").createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const handleViewCustomer = async (customer: Customer) => {
    setViewCustomer(customer);
    setShowViewDialog(true);
    setViewDocsLoading(true);
    const { data } = await (supabase as any)
      .from("customer_documents").select("*")
      .eq("customer_id", customer.id).order("uploaded_at", { ascending: false });
    setViewDocuments(data || []);
    setViewDocsLoading(false);
  };

  const generateCustomerPDF = (customer: Customer, docs: CustomerDocument[]) => {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    const green: [number, number, number] = [34, 97, 51];
    const gray: [number, number, number] = [100, 100, 100];

    // Header
    doc.setFillColor(...green);
    doc.rect(0, 0, pw, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("S. M. Elite Hajj Limited", pw / 2, 18, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Customer Profile", pw / 2, 30, { align: "center" });

    let y = 50;

    // Personal Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("Personal Information", 14, y);
    y += 6;

    const personalData: [string, string][] = [
      ["Full Name", customer.full_name],
      ["Email", customer.email || "—"],
      ["Phone", customer.phone || "—"],
      ["Passport No.", customer.passport_number || "—"],
      ["Nationality", customer.nationality || "—"],
      ["Date of Birth", customer.date_of_birth ? format(new Date(customer.date_of_birth), "dd MMM yyyy") : "—"],
      ["Gender", customer.gender ? customer.gender.charAt(0).toUpperCase() + customer.gender.slice(1) : "—"],
      ["Address", customer.address || "—"],
      ["Status", customer.status || "—"],
    ];

    autoTable(doc, {
      startY: y, head: [], body: personalData, theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: gray }, 1: { cellWidth: "auto" } },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 8;

    // Emergency Contact
    if (customer.emergency_contact_name || customer.emergency_contact_phone) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Emergency Contact", 14, y);
      y += 6;
      const emData: [string, string][] = [];
      if (customer.emergency_contact_name) emData.push(["Name", customer.emergency_contact_name]);
      if (customer.emergency_contact_phone) emData.push(["Phone", customer.emergency_contact_phone]);
      autoTable(doc, {
        startY: y, head: [], body: emData, theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, textColor: gray } },
        margin: { left: 14, right: 14 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    // Notes
    if (customer.notes) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Notes", 14, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(customer.notes, 14, y, { maxWidth: pw - 28 });
      y += 12;
    }

    // Documents
    if (docs.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Uploaded Documents", 14, y);
      y += 6;
      const docData = docs.map(d => [
        d.document_type,
        d.file_name,
        format(new Date(d.uploaded_at), "dd MMM yyyy"),
        d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : "—"
      ]);
      autoTable(doc, {
        startY: y,
        head: [["Type", "File Name", "Date", "Size"]],
        body: docData, theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: green, textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });
    }

    // Footer
    const fY = doc.internal.pageSize.getHeight() - 20;
    doc.setFillColor(...green);
    doc.rect(0, fY, pw, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text("S. M. Elite Hajj Limited | Phone: +8801867666888 | Email: info@smelitehajj.com", pw / 2, fY + 12, { align: "center" });

    doc.save(`Customer_${customer.full_name.replace(/\s+/g, "_")}_${customer.id.slice(0, 8)}.pdf`);
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
                    <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewCustomer(customer)}>
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
                        <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="icon" variant="ghost" onClick={() => handleViewCustomer(customer)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleOpenDocs(customer)} title="Documents">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditCustomer(customer)} title="Edit">
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
            <div className="space-y-6">
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

              {/* Document Upload Section - Inline */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                  <FileText className="h-4 w-4 text-primary" /> Documents
                  {editDocuments.length > 0 && <Badge variant="secondary">{editDocuments.length}</Badge>}
                </h3>
                
                {/* Upload Area */}
                <div className="flex flex-col sm:flex-row gap-3 items-end mb-4">
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
                    <input ref={editFileInputRef} type="file" className="hidden"
                      accept="image/*,.pdf,.doc,.docx" onChange={handleEditUploadDocument} />
                    <Button onClick={() => editFileInputRef.current?.click()} disabled={uploading} size="sm" className="gap-1">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </Button>
                  </div>
                </div>

                {/* Existing Documents */}
                {editDocsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : editDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm border rounded-lg bg-muted/30">
                    <FileUp className="h-8 w-8 mx-auto mb-1 opacity-30" />
                    <p>No documents uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{doc.file_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{doc.document_type}</Badge>
                              <span>{format(new Date(doc.uploaded_at), "dd MMM yyyy")}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => getDocSignedUrl(doc.file_url)} title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteDocumentInEdit(doc)} title="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      {/* View Customer Full Profile Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-primary" />
                Customer Profile
              </DialogTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1"
                  onClick={() => viewCustomer && generateCustomerPDF(viewCustomer, viewDocuments)}>
                  <Printer className="h-4 w-4" /> Download PDF
                </Button>
                <Button size="sm" variant="outline" className="gap-1"
                  onClick={() => { setShowViewDialog(false); if (viewCustomer) handleEditCustomer(viewCustomer); }}>
                  <Edit className="h-4 w-4" /> Edit
                </Button>
              </div>
            </div>
          </DialogHeader>

          {viewCustomer && (
            <ScrollArea className="max-h-[75vh] px-6 pb-6">
              <div className="space-y-6 pt-4">
                {/* Header Card */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{viewCustomer.full_name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Badge variant={viewCustomer.status === "active" ? "default" : "secondary"}>
                        {viewCustomer.status}
                      </Badge>
                      <span>ID: {viewCustomer.id.slice(0, 8).toUpperCase()}</span>
                      <span>Since {format(new Date(viewCustomer.created_at), "dd MMM yyyy")}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium text-sm">{viewCustomer.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium text-sm truncate">{viewCustomer.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border sm:col-span-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Address</p>
                        <p className="font-medium text-sm">{viewCustomer.address || "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Personal Details */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Personal Details</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Passport No.", value: viewCustomer.passport_number },
                      { label: "Nationality", value: viewCustomer.nationality },
                      { label: "Date of Birth", value: viewCustomer.date_of_birth ? format(new Date(viewCustomer.date_of_birth), "dd MMM yyyy") : null },
                      { label: "Gender", value: viewCustomer.gender ? viewCustomer.gender.charAt(0).toUpperCase() + viewCustomer.gender.slice(1) : null },
                    ].map((item, i) => (
                      <div key={i} className="p-3 rounded-lg border">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-medium text-sm mt-0.5">{item.value || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contact */}
                {(viewCustomer.emergency_contact_name || viewCustomer.emergency_contact_phone) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Emergency Contact
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border">
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-medium text-sm">{viewCustomer.emergency_contact_name || "—"}</p>
                        </div>
                        <div className="p-3 rounded-lg border">
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="font-medium text-sm">{viewCustomer.emergency_contact_phone || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Notes */}
                {viewCustomer.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Notes</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded-lg border">{viewCustomer.notes}</p>
                    </div>
                  </>
                )}

                <Separator />

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Documents
                    {viewDocuments.length > 0 && <Badge variant="secondary">{viewDocuments.length}</Badge>}
                  </h4>
                  {viewDocsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : viewDocuments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg border">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No documents uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {viewDocuments.map(d => (
                        <div key={d.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{d.file_name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">{d.document_type}</Badge>
                                <span>{format(new Date(d.uploaded_at), "dd MMM yyyy")}</span>
                                {d.file_size && <span>{(d.file_size / 1024).toFixed(0)} KB</span>}
                              </div>
                              {d.notes && <p className="text-xs text-muted-foreground mt-0.5">{d.notes}</p>}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="gap-1 shrink-0" onClick={() => getDocSignedUrl(d.file_url)}>
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
