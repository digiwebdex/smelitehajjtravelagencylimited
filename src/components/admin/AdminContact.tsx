import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2 } from "lucide-react";

interface ContactInfo {
  id: string;
  type: string;
  icon_name: string;
  title: string;
  details: string[];
  order_index: number;
  is_active: boolean;
  map_link: string | null;
}

const CONTACT_ICONS = ["Phone", "Mail", "MapPin", "Clock", "Globe", "MessageCircle"];

const AdminContact = () => {
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContactInfo | null>(null);
  const [formData, setFormData] = useState({
    type: "phone", icon_name: "Phone", title: "", details: [""], map_link: ""
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data, error } = await supabase.from("contact_info").select("*").order("order_index");
    if (!error && data) {
      setContacts(data.map(c => ({
        ...c,
        details: Array.isArray(c.details) ? c.details as string[] : [],
        map_link: (c as any).map_link || null,
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = { 
      ...formData, 
      details: formData.details.filter(d => d.trim()),
      map_link: formData.map_link || null
    };
    
    if (editingItem) {
      const { error } = await supabase.from("contact_info").update(payload).eq("id", editingItem.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Contact info updated" });
    } else {
      const maxOrder = Math.max(...contacts.map(c => c.order_index), 0);
      const { error } = await supabase.from("contact_info").insert({ ...payload, order_index: maxOrder + 1 });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Contact info created" });
    }
    
    setIsDialogOpen(false);
    setEditingItem(null);
    resetForm();
    fetchContacts();
  };

  const resetForm = () => {
    setFormData({ type: "phone", icon_name: "Phone", title: "", details: [""], map_link: "" });
  };

  const handleEdit = (item: ContactInfo) => {
    setEditingItem(item);
    setFormData({
      type: item.type, icon_name: item.icon_name, title: item.title,
      details: item.details.length ? item.details : [""],
      map_link: item.map_link || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("contact_info").delete().eq("id", id);
    toast({ title: "Success", description: "Contact info deleted" });
    fetchContacts();
  };

  const toggleActive = async (item: ContactInfo) => {
    await supabase.from("contact_info").update({ is_active: !item.is_active }).eq("id", item.id);
    fetchContacts();
  };

  const updateDetail = (index: number, value: string) => {
    const newDetails = [...formData.details];
    newDetails[index] = value;
    setFormData({ ...formData, details: newDetails });
  };

  const addDetail = () => setFormData({ ...formData, details: [...formData.details, ""] });
  const removeDetail = (index: number) => setFormData({ ...formData, details: formData.details.filter((_, i) => i !== index) });

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Manage contact details shown on the website</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Contact Info" : "Add Contact Info"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Input value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} placeholder="e.g., phone, email" />
                </div>
                <div>
                  <label className="text-sm font-medium">Icon</label>
                  <Select value={formData.icon_name} onValueChange={(v) => setFormData({ ...formData, icon_name: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONTACT_ICONS.map(icon => <SelectItem key={icon} value={icon}>{icon}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g., Call Us" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Details</label>
                  <Button type="button" variant="outline" size="sm" onClick={addDetail}><Plus className="w-4 h-4" /></Button>
                </div>
                {formData.details.map((detail, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <Input value={detail} onChange={(e) => updateDetail(index, e.target.value)} placeholder="e.g., +880 1234-567890" />
                    {formData.details.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeDetail(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {formData.type === 'address' && (
                <div>
                  <label className="text-sm font-medium">Map Link (Google Maps URL)</label>
                  <Input 
                    value={formData.map_link} 
                    onChange={(e) => setFormData({ ...formData, map_link: e.target.value })} 
                    placeholder="e.g., https://maps.app.goo.gl/..." 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Paste the Google Maps share link for this address
                  </p>
                </div>
              )}
              <Button type="submit" className="w-full">{editingItem ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.icon_name}</TableCell>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.details.join(", ")}</TableCell>
                <TableCell><Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} /></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {contacts.length === 0 && <p className="text-center text-muted-foreground py-8">No contact info yet.</p>}
      </CardContent>
    </Card>
  );
};

export default AdminContact;
