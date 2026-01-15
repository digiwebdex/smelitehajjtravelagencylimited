import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, CURRENCY } from "@/lib/currency";
import ImageUpload from "./ImageUpload";

interface Package {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_days: number;
  includes: string[] | null;
  hotel_rating: number | null;
  stock: number;
  is_active: boolean;
  image_url: string | null;
}

interface AdminPackagesProps {
  onUpdate: () => void;
}

const AdminPackages = ({ onUpdate }: AdminPackagesProps) => {
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "packages",
  });
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "hajj" as "hajj" | "umrah",
    price: 0,
    duration_days: 7,
    includes: "",
    hotel_rating: 5,
    stock: 50,
    is_active: true,
    image_url: "",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPackages(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "hajj",
      price: 0,
      duration_days: 7,
      includes: "",
      hotel_rating: 5,
      stock: 50,
      is_active: true,
      image_url: "",
    });
    setEditingPackage(null);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      title: pkg.title,
      description: pkg.description || "",
      type: pkg.type as "hajj" | "umrah",
      price: pkg.price,
      duration_days: pkg.duration_days,
      includes: pkg.includes?.join("\n") || "",
      hotel_rating: pkg.hotel_rating || 5,
      stock: pkg.stock,
      is_active: pkg.is_active,
      image_url: pkg.image_url || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const packageData = {
      title: formData.title,
      description: formData.description || null,
      type: formData.type,
      price: formData.price,
      duration_days: formData.duration_days,
      includes: formData.includes.split("\n").filter(Boolean),
      hotel_rating: formData.hotel_rating,
      stock: formData.stock,
      is_active: formData.is_active,
      image_url: formData.image_url || null,
    };

    let error;

    if (editingPackage) {
      ({ error } = await supabase
        .from("packages")
        .update(packageData)
        .eq("id", editingPackage.id));
    } else {
      ({ error } = await supabase.from("packages").insert(packageData));
    }

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingPackage ? "update" : "create"} package`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Package ${editingPackage ? "updated" : "created"} successfully`,
      });
      fetchPackages();
      onUpdate();
      setIsDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    const { error } = await supabase.from("packages").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete package. It may have existing bookings.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Package deleted successfully",
      });
      fetchPackages();
      onUpdate();
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from("packages")
      .update({ is_active: !currentState })
      .eq("id", id);

    if (!error) {
      fetchPackages();
    }
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Packages ({packages.length})</span>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPackage ? "Edit Package" : "Create New Package"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Package Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "hajj" | "umrah") =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hajj">Hajj</SelectItem>
                        <SelectItem value="umrah">Umrah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ({CURRENCY.symbol} {CURRENCY.code})</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.duration_days}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_days: parseInt(e.target.value) || 7 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rating">Hotel Rating</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={formData.hotel_rating}
                      onChange={(e) =>
                        setFormData({ ...formData, hotel_rating: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="includes">Includes (one per line)</Label>
                  <Textarea
                    id="includes"
                    value={formData.includes}
                    onChange={(e) => setFormData({ ...formData, includes: e.target.value })}
                    placeholder="Round-trip flights&#10;5-star hotel&#10;Visa processing"
                    rows={4}
                  />
                </div>

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  onUpload={uploadImage}
                  uploading={uploading}
                  label="Package Image"
                  placeholder="https://example.com/package-image.jpg"
                />

                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="active">Active (visible to customers)</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-primary">
                    {editingPackage ? "Update" : "Create"} Package
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">{pkg.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {pkg.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{formatCurrency(pkg.price)}</TableCell>
                  <TableCell>{pkg.duration_days} days</TableCell>
                  <TableCell>{pkg.stock}</TableCell>
                  <TableCell>
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={() => toggleActive(pkg.id, pkg.is_active)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(pkg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPackages;
