import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, FileText, ClipboardList, GripVertical, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VisaCountry {
  id: string;
  country_name: string;
  flag_emoji: string;
  processing_time: string;
  price: number;
  order_index: number;
  is_active: boolean;
  is_featured: boolean;
  requirements: string[] | null;
  documents_needed: string[] | null;
  description: string | null;
  validity_period: string | null;
}

interface SortableRowProps {
  item: VisaCountry;
  onEdit: (item: VisaCountry) => void;
  onDelete: (id: string) => void;
  onToggleActive: (item: VisaCountry) => void;
  onToggleFeatured: (item: VisaCountry) => void;
}

const SortableRow = ({ item, onEdit, onDelete, onToggleActive, onToggleFeatured }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell>
        <button
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="text-2xl">{item.flag_emoji}</TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          {item.country_name}
          {item.is_featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
              ⭐ Popular
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>{item.processing_time}</TableCell>
      <TableCell>৳{item.price.toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {item.requirements?.length || 0} items
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className="text-xs">
          {item.documents_needed?.length || 0} items
        </Badge>
      </TableCell>
      <TableCell>
        <button
          onClick={() => onToggleFeatured(item)}
          className={`p-1 rounded transition-colors ${item.is_featured ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground hover:text-amber-500'}`}
          title={item.is_featured ? "Remove from featured" : "Mark as featured"}
        >
          <Star className={`w-5 h-5 ${item.is_featured ? 'fill-current' : ''}`} />
        </button>
      </TableCell>
      <TableCell>
        <Switch checked={item.is_active} onCheckedChange={() => onToggleActive(item)} />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminVisa = () => {
  const { toast } = useToast();
  const [countries, setCountries] = useState<VisaCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VisaCountry | null>(null);
  const [formData, setFormData] = useState({
    country_name: "", flag_emoji: "", processing_time: "", price: 0,
    requirements: "", documents_needed: "", description: "", validity_period: ""
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data, error } = await supabase.from("visa_countries").select("*").order("order_index");
    if (!error && data) setCountries(data);
    setLoading(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = countries.findIndex((item) => item.id === active.id);
      const newIndex = countries.findIndex((item) => item.id === over.id);

      const newCountries = arrayMove(countries, oldIndex, newIndex);
      setCountries(newCountries);

      // Update order_index in database
      const updates = newCountries.map((country, index) => ({
        id: country.id,
        order_index: index,
      }));

      for (const update of updates) {
        await supabase
          .from("visa_countries")
          .update({ order_index: update.order_index })
          .eq("id", update.id);
      }

      toast({ title: "Success", description: "Order updated" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = {
      country_name: formData.country_name,
      flag_emoji: formData.flag_emoji,
      processing_time: formData.processing_time,
      price: formData.price,
      description: formData.description || null,
      validity_period: formData.validity_period || null,
      requirements: formData.requirements ? formData.requirements.split('\n').filter(r => r.trim()) : [],
      documents_needed: formData.documents_needed ? formData.documents_needed.split('\n').filter(d => d.trim()) : []
    };
    
    if (editingItem) {
      const { error } = await supabase.from("visa_countries").update(dataToSubmit).eq("id", editingItem.id);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Country updated" });
    } else {
      const maxOrder = Math.max(...countries.map(c => c.order_index), 0);
      const { error } = await supabase.from("visa_countries").insert({ ...dataToSubmit, order_index: maxOrder + 1 });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "Success", description: "Country created" });
    }
    
    setIsDialogOpen(false);
    setEditingItem(null);
    resetForm();
    fetchCountries();
  };

  const resetForm = () => {
    setFormData({ 
      country_name: "", flag_emoji: "", processing_time: "", price: 0,
      requirements: "", documents_needed: "", description: "", validity_period: ""
    });
  };

  const handleEdit = (item: VisaCountry) => {
    setEditingItem(item);
    setFormData({
      country_name: item.country_name, 
      flag_emoji: item.flag_emoji,
      processing_time: item.processing_time, 
      price: item.price,
      requirements: item.requirements?.join('\n') || "",
      documents_needed: item.documents_needed?.join('\n') || "",
      description: item.description || "",
      validity_period: item.validity_period || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from("visa_countries").delete().eq("id", id);
    toast({ title: "Success", description: "Country deleted" });
    fetchCountries();
  };

  const toggleActive = async (item: VisaCountry) => {
    await supabase.from("visa_countries").update({ is_active: !item.is_active }).eq("id", item.id);
    fetchCountries();
  };

  const toggleFeatured = async (item: VisaCountry) => {
    await supabase.from("visa_countries").update({ is_featured: !item.is_featured }).eq("id", item.id);
    fetchCountries();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Visa Countries</CardTitle>
          <CardDescription>Manage visa processing countries and prices. Drag rows to reorder.</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingItem(null); resetForm(); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Country</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Country" : "Add Country"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Requirements & Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Country Name *</label>
                      <Input value={formData.country_name} onChange={(e) => setFormData({ ...formData, country_name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Flag Emoji *</label>
                      <Input value={formData.flag_emoji} onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })} placeholder="🇧🇩" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Processing Time *</label>
                      <Input value={formData.processing_time} onChange={(e) => setFormData({ ...formData, processing_time: e.target.value })} placeholder="e.g., 5-7 days" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Price (BDT) *</label>
                      <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Validity Period</label>
                      <Input value={formData.validity_period} onChange={(e) => setFormData({ ...formData, validity_period: e.target.value })} placeholder="e.g., 30 days" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Brief description about visa processing for this country..."
                      rows={3}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Requirements (one per line)
                    </label>
                    <Textarea 
                      value={formData.requirements} 
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })} 
                      placeholder="Valid passport with 6 months validity&#10;Passport-size photographs&#10;Bank statement&#10;Employment letter"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter each requirement on a new line</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Documents Needed (one per line)
                    </label>
                    <Textarea 
                      value={formData.documents_needed} 
                      onChange={(e) => setFormData({ ...formData, documents_needed: e.target.value })} 
                      placeholder="Original Passport&#10;2 Passport Photos&#10;Bank Statement (3 months)&#10;Employment Certificate"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter each document on a new line</p>
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button type="submit" className="w-full">{editingItem ? "Update" : "Create"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Flag</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Processing Time</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Requirements</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={countries.map((c) => c.id)}
                strategy={verticalListSortingStrategy}
              >
                {countries.map((item) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleActive={toggleActive}
                    onToggleFeatured={toggleFeatured}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
        {countries.length === 0 && <p className="text-center text-muted-foreground py-8">No countries yet.</p>}
      </CardContent>
    </Card>
  );
};

export default AdminVisa;
