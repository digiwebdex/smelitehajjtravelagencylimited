import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import ImageUpload from "./ImageUpload";
import { Plus, Edit, Trash2, User } from "lucide-react";
import WhatsAppIcon from "../icons/WhatsAppIcon";
import IMOIcon from "../icons/IMOIcon";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  qualifications: string;
  avatar_url: string;
  board_type: string;
  order_index: number;
  is_active: boolean;
  whatsapp_number: string;
  imo_number: string;
}

const AdminTeam = () => {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "", role: "", qualifications: "", avatar_url: "", board_type: "management", whatsapp_number: "", imo_number: ""
  });

  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "team",
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    const { data, error } = await supabase.from("team_members").select("*").order("order_index");
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      const { error } = await supabase.from("team_members").update(formData).eq("id", editingItem.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Team member updated" });
    } else {
      const maxOrder = Math.max(...members.map(m => m.order_index), 0);
      const { error } = await supabase.from("team_members").insert({ ...formData, order_index: maxOrder + 1 });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Team member created" });
    }
    
    setIsDialogOpen(false);
    setEditingItem(null);
    resetForm();
    fetchMembers();
  };

  const resetForm = () => {
    setFormData({ name: "", role: "", qualifications: "", avatar_url: "", board_type: "management", whatsapp_number: "", imo_number: "" });
  };

  const handleEdit = (item: TeamMember) => {
    setEditingItem(item);
    setFormData({
      name: item.name, role: item.role, qualifications: item.qualifications || "",
      avatar_url: item.avatar_url || "", board_type: item.board_type, whatsapp_number: item.whatsapp_number || "", imo_number: item.imo_number || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("team_members").delete().eq("id", id);
    toast({ title: "Success", description: "Team member deleted" });
    fetchMembers();
  };

  const toggleActive = async (item: TeamMember) => {
    await supabase.from("team_members").update({ is_active: !item.is_active }).eq("id", item.id);
    fetchMembers();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const managementMembers = members.filter(m => m.board_type === "management");
  const shariahMembers = members.filter(m => m.board_type === "shariah");

  const renderMemberTable = (membersList: TeamMember[], title: string) => (
    <div>
      <h4 className="font-medium mb-2">{title} ({membersList.length})</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Avatar</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>IMO</TableHead>
            <TableHead className="max-w-[200px]">Qualifications</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {membersList.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={item.avatar_url} alt={item.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.role}</TableCell>
              <TableCell>
                {item.whatsapp_number ? (
                  <span className="flex items-center gap-1 text-[#25D366] text-sm">
                    <WhatsAppIcon size={14} />
                    {item.whatsapp_number}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.imo_number ? (
                  <span className="flex items-center gap-1 text-[#3B82F6] text-sm">
                    <IMOIcon size={14} />
                    {item.imo_number}
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <p className="text-sm text-muted-foreground line-clamp-2">{item.qualifications || "—"}</p>
              </TableCell>
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
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage management and shariah board members</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Member</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <ImageUpload
                value={formData.avatar_url}
                onChange={(url) => setFormData({ ...formData, avatar_url: url })}
                onUpload={uploadImage}
                uploading={uploading}
                label="Avatar Image"
              />
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Role/Title *</label>
                <Input value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required placeholder="e.g., Chairman, Director" />
              </div>
              <div>
                <label className="text-sm font-medium">Board Type</label>
                <Select value={formData.board_type} onValueChange={(v) => setFormData({ ...formData, board_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="management">Management Board</SelectItem>
                    <SelectItem value="shariah">Shariah Board</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Qualifications / Bio</label>
                <Textarea 
                  value={formData.qualifications} 
                  onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })} 
                  rows={3} 
                  placeholder="e.g., Honours Islamic Studies, National University, Bangladesh"
                />
                <p className="text-xs text-muted-foreground mt-1">This appears on hover overlay on the team section</p>
              </div>
              <div>
                <label className="text-sm font-medium">WhatsApp Number</label>
                <Input 
                  value={formData.whatsapp_number} 
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })} 
                  placeholder="e.g., +8801712345678"
                />
                <p className="text-xs text-muted-foreground mt-1">Shows on card for management board members</p>
              </div>
              <div>
                <label className="text-sm font-medium">IMO Number</label>
                <Input 
                  value={formData.imo_number} 
                  onChange={(e) => setFormData({ ...formData, imo_number: e.target.value })} 
                  placeholder="e.g., +8801712345678"
                />
                <p className="text-xs text-muted-foreground mt-1">Shows on card alongside WhatsApp</p>
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {editingItem ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderMemberTable(managementMembers, "Management Board")}
        {renderMemberTable(shariahMembers, "Shariah Board")}
      </CardContent>
    </Card>
  );
};

export default AdminTeam;
