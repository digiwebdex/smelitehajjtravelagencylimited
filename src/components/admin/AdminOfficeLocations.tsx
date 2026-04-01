import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Plus, Trash2, Phone, Mail, MapPin } from "lucide-react";

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  phones: string[];
  email: string | null;
  map_query: string | null;
  map_embed_url: string | null;
  order_index: number;
  is_active: boolean;
}

const AdminOfficeLocations = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [offices, setOffices] = useState<OfficeLocation[]>([]);

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    const { data, error } = await supabase
      .from("office_locations")
      .select("*")
      .order("order_index");

    if (!error && data) {
      setOffices(data as OfficeLocation[]);
    }
    setLoading(false);
  };

  const handleSave = async (office: OfficeLocation) => {
    setSaving(office.id);

    const { error } = await supabase
      .from("office_locations")
      .update({
        name: office.name,
        address: office.address,
        phones: office.phones,
        email: office.email,
        map_query: office.map_query,
        order_index: office.order_index,
        is_active: office.is_active,
      })
      .eq("id", office.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `${office.name} updated successfully` });
    }
    setSaving(null);
  };

  const handleAdd = async () => {
    const newOffice = {
      name: "New Office",
      address: "Enter address here",
      phones: ["+880"],
      email: "info@smelitehajj.com",
      map_query: "",
      order_index: offices.length,
      is_active: true,
    };

    const { data, error } = await supabase
      .from("office_locations")
      .insert(newOffice)
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      setOffices([...offices, data as OfficeLocation]);
      toast({ title: "Success", description: "New office added" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this office?")) return;

    const { error } = await supabase
      .from("office_locations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setOffices(offices.filter((o) => o.id !== id));
      toast({ title: "Success", description: "Office deleted" });
    }
  };

  const updateOffice = (id: string, field: keyof OfficeLocation, value: string | string[] | boolean | number | null) => {
    setOffices(offices.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  };

  const updatePhone = (officeId: string, phoneIndex: number, value: string) => {
    setOffices(offices.map((o) => {
      if (o.id === officeId) {
        const newPhones = [...o.phones];
        newPhones[phoneIndex] = value;
        return { ...o, phones: newPhones };
      }
      return o;
    }));
  };

  const addPhone = (officeId: string) => {
    setOffices(offices.map((o) => {
      if (o.id === officeId) {
        return { ...o, phones: [...o.phones, "+880"] };
      }
      return o;
    }));
  };

  const removePhone = (officeId: string, phoneIndex: number) => {
    setOffices(offices.map((o) => {
      if (o.id === officeId) {
        const newPhones = o.phones.filter((_, i) => i !== phoneIndex);
        return { ...o, phones: newPhones };
      }
      return o;
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Office Locations
            </CardTitle>
            <CardDescription>
              Manage office addresses displayed on the Contact Us section
            </CardDescription>
          </div>
          <Button onClick={handleAdd} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Office
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {offices.map((office) => (
          <div
            key={office.id}
            className="border rounded-lg p-6 space-y-4 bg-muted/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch
                  checked={office.is_active}
                  onCheckedChange={(checked) => updateOffice(office.id, "is_active", checked)}
                />
                <span className={office.is_active ? "text-green-600" : "text-muted-foreground"}>
                  {office.is_active ? "Active" : "Hidden"}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(office.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Office Name</Label>
                <Input
                  value={office.name}
                  onChange={(e) => updateOffice(office.id, "name", e.target.value)}
                  placeholder="e.g., Head Office"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={office.order_index}
                  onChange={(e) => updateOffice(office.id, "order_index", parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </Label>
              <Input
                value={office.address}
                onChange={(e) => updateOffice(office.id, "address", e.target.value)}
                placeholder="Full address"
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Google Maps Query (for link)
              </Label>
              <Input
                value={office.map_query || ""}
                onChange={(e) => updateOffice(office.id, "map_query", e.target.value)}
                placeholder="e.g., https://maps.app.goo.gl/... or House+37+Block+C+Banani+Dhaka"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a full Google Maps URL (https://maps.app.goo.gl/...) or use a search query with + instead of spaces.
              </p>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                Phone Numbers
              </Label>
              <div className="space-y-2">
                {office.phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => updatePhone(office.id, idx, e.target.value)}
                      placeholder="+880..."
                    />
                    {office.phones.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removePhone(office.id, idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPhone(office.id)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Phone
                </Button>
              </div>
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={office.email || ""}
                onChange={(e) => updateOffice(office.id, "email", e.target.value)}
                placeholder="email@example.com"
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => handleSave(office)}
              disabled={saving === office.id}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving === office.id ? "Saving..." : `Save ${office.name}`}
            </Button>
          </div>
        ))}

        {offices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No offices added yet. Click "Add Office" to create one.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOfficeLocations;