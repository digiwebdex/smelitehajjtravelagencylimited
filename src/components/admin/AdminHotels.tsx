import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AutocompleteInput } from "@/components/ui/autocomplete-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Loader2,
  X,
  Upload,
  GripVertical,
  Image as ImageIcon,
} from "lucide-react";

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  star_rating: number;
  distance_from_haram: number;
  description: string | null;
  details: string[];
  facilities: string[];
  images: string[];
  google_map_link: string | null;
  google_map_embed_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
  order_index: number;
}

const COUNTRY_SUGGESTIONS = [
  "Saudi Arabia",
  "United Arab Emirates",
  "Dubai",
  "Malaysia",
  "Turkey",
  "Indonesia",
  "Egypt",
  "Qatar",
  "Kuwait",
  "Bahrain",
  "Oman",
  "Jordan",
  "Morocco",
  "Tunisia",
  "Singapore",
  "Thailand",
  "Bangladesh",
  "India",
  "Pakistan",
];

const CITY_SUGGESTIONS = [
  "Makkah",
  "Madinah",
  "Jeddah",
  "Riyadh",
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Doha",
  "Kuwait City",
  "Manama",
  "Muscat",
  "Amman",
  "Istanbul",
  "Ankara",
  "Kuala Lumpur",
  "Jakarta",
  "Cairo",
  "Alexandria",
  "Casablanca",
  "Tunis",
  "Singapore",
  "Bangkok",
  "Dhaka",
  "Chittagong",
  "Delhi",
  "Mumbai",
  "Karachi",
  "Lahore",
];

interface SectionSettings {
  id: string;
  section_key: string;
  title: string | null;
  subtitle: string | null;
  is_enabled: boolean;
  booking_enabled: boolean;
  star_label: string | null;
  sort_by: string;
  sort_order: string;
  hotels_per_page: number;
  show_map_button: boolean;
  show_details_button: boolean;
}

const FACILITY_OPTIONS = [
  "WiFi",
  "Parking",
  "Breakfast",
  "Restaurant",
  "Gym",
  "Pool",
  "AC",
  "TV",
  "Bathroom",
  "Room Service",
  "Laundry",
  "Airport Shuttle",
  "Prayer Room",
  "24/7 Reception",
];

const AdminHotels = () => {
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "hotels",
  });

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [settings, setSettings] = useState<SectionSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
  const [activeTab, setActiveTab] = useState("hotels");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");

  const [formData, setFormData] = useState({
    name: "",
    city: "makkah",
    country: "Saudi Arabia",
    star_rating: 3,
    distance_from_haram: 500,
    description: "",
    details: [] as string[],
    facilities: [] as string[],
    images: [] as string[],
    google_map_link: "",
    google_map_embed_url: "",
    contact_phone: "",
    contact_email: "",
    is_active: true,
  });

  useEffect(() => {
    fetchHotels();
    fetchSettings();
  }, []);

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .order("order_index");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setHotels(data || []);
    }
    setLoading(false);
  };

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("hotel_section_settings")
      .select("*");

    if (error) {
      console.error("Error fetching settings:", error);
    } else {
      setSettings(data || []);
    }
  };

  const handleAddNew = () => {
    setEditingHotel(null);
    setFormData({
      name: "",
      city: "makkah",
      country: "Saudi Arabia",
      star_rating: 3,
      distance_from_haram: 500,
      description: "",
      details: [],
      facilities: [],
      images: [],
      google_map_link: "",
      google_map_embed_url: "",
      contact_phone: "",
      contact_email: "",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleEdit = (hotel: Hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      city: hotel.city,
      country: hotel.country || "Saudi Arabia",
      star_rating: hotel.star_rating,
      distance_from_haram: hotel.distance_from_haram,
      description: hotel.description || "",
      details: hotel.details || [],
      facilities: hotel.facilities || [],
      images: hotel.images || [],
      google_map_link: hotel.google_map_link || "",
      google_map_embed_url: hotel.google_map_embed_url || "",
      contact_phone: hotel.contact_phone || "",
      contact_email: hotel.contact_email || "",
      is_active: hotel.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Hotel name is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const hotelData = {
        name: formData.name,
        city: formData.city,
        country: formData.country,
        star_rating: formData.star_rating,
        distance_from_haram: formData.distance_from_haram,
        description: formData.description || null,
        details: formData.details,
        facilities: formData.facilities,
        images: formData.images,
        google_map_link: formData.google_map_link || null,
        google_map_embed_url: formData.google_map_embed_url || null,
        contact_phone: formData.contact_phone || null,
        contact_email: formData.contact_email || null,
        is_active: formData.is_active,
      };

      if (editingHotel) {
        const { error } = await supabase
          .from("hotels")
          .update(hotelData)
          .eq("id", editingHotel.id);

        if (error) throw error;
        toast({ title: "Success", description: "Hotel updated successfully" });
      } else {
        const { error } = await supabase
          .from("hotels")
          .insert({ ...hotelData, order_index: hotels.length });

        if (error) throw error;
        toast({ title: "Success", description: "Hotel added successfully" });
      }

      setDialogOpen(false);
      fetchHotels();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hotel?")) return;

    const { error } = await supabase.from("hotels").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Hotel deleted" });
      fetchHotels();
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("hotels")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchHotels();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      const url = await uploadImage(file);
      if (url) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, url],
        }));
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const toggleFacility = (facility: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((f) => f !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const handleSettingChange = async (
    settingId: string,
    field: string,
    value: any
  ) => {
    const { error } = await supabase
      .from("hotel_section_settings")
      .update({ [field]: value })
      .eq("id", settingId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchSettings();
    }
  };

  const filteredHotels = hotels.filter((h) => {
    const matchesCity = cityFilter === "all" || h.city === cityFilter;
    const matchesCountry = countryFilter === "all" || (h.country || "Saudi Arabia") === countryFilter;
    return matchesCity && matchesCountry;
  });

  // Get unique countries from hotels
  const uniqueCountries = [...new Set(hotels.map(h => h.country || "Saudi Arabia"))];

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="settings">CMS Settings</TabsTrigger>
          <TabsTrigger value="requests">Booking Requests</TabsTrigger>
        </TabsList>

        {/* Hotels Tab */}
        <TabsContent value="hotels" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="makkah">Makkah</SelectItem>
                  <SelectItem value="madinah">Madinah</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                {filteredHotels.length} hotels
              </span>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Hotel
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Hotel</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHotels.map((hotel) => (
                  <TableRow key={hotel.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {hotel.images?.[0] ? (
                          <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{hotel.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {hotel.country || "Saudi Arabia"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {hotel.city}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: hotel.star_rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="h-3 w-3 fill-primary text-primary"
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        {hotel.distance_from_haram}m
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={hotel.is_active}
                        onCheckedChange={(checked) =>
                          handleToggleActive(hotel.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(hotel)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(hotel.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredHotels.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hotels found. Add your first hotel!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {settings.map((setting) => (
            <Card key={setting.id}>
              <CardHeader>
                <CardTitle className="capitalize">
                  {setting.section_key === "general"
                    ? "General Settings"
                    : `${setting.section_key} Section`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={setting.title || ""}
                      onChange={(e) =>
                        handleSettingChange(setting.id, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={setting.subtitle || ""}
                      onChange={(e) =>
                        handleSettingChange(setting.id, "subtitle", e.target.value)
                      }
                    />
                  </div>
                </div>

                {setting.section_key === "general" && (
                  <>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Star Label</Label>
                        <Input
                          value={setting.star_label || "Star"}
                          onChange={(e) =>
                            handleSettingChange(
                              setting.id,
                              "star_label",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sort By</Label>
                        <Select
                          value={setting.sort_by}
                          onValueChange={(value) =>
                            handleSettingChange(setting.id, "sort_by", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="order_index">Manual Order</SelectItem>
                            <SelectItem value="distance">Distance</SelectItem>
                            <SelectItem value="rating">Rating</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Select
                          value={setting.sort_order}
                          onValueChange={(value) =>
                            handleSettingChange(setting.id, "sort_order", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Ascending</SelectItem>
                            <SelectItem value="desc">Descending</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.booking_enabled}
                          onCheckedChange={(checked) =>
                            handleSettingChange(
                              setting.id,
                              "booking_enabled",
                              checked
                            )
                          }
                        />
                        <Label>Enable Booking Button</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.show_details_button}
                          onCheckedChange={(checked) =>
                            handleSettingChange(
                              setting.id,
                              "show_details_button",
                              checked
                            )
                          }
                        />
                        <Label>Show Details Button</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={setting.show_map_button}
                          onCheckedChange={(checked) =>
                            handleSettingChange(
                              setting.id,
                              "show_map_button",
                              checked
                            )
                          }
                        />
                        <Label>Show Map Button</Label>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <Switch
                    checked={setting.is_enabled}
                    onCheckedChange={(checked) =>
                      handleSettingChange(setting.id, "is_enabled", checked)
                    }
                  />
                  <Label>Section Enabled</Label>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Booking Requests Tab */}
        <TabsContent value="requests">
          <AdminHotelBookingRequests />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Hotel Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHotel ? "Edit Hotel" : "Add New Hotel"}
            </DialogTitle>
            <DialogDescription>
              Enter the hotel details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hotel Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Hilton Makkah Convention"
                />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <AutocompleteInput
                  value={formData.country}
                  onChange={(value) =>
                    setFormData({ ...formData, country: value })
                  }
                  suggestions={COUNTRY_SUGGESTIONS}
                  placeholder="Type country name..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>City *</Label>
                <AutocompleteInput
                  value={formData.city}
                  onChange={(value) =>
                    setFormData({ ...formData, city: value })
                  }
                  suggestions={CITY_SUGGESTIONS}
                  placeholder="Type city name..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Star Rating *</Label>
                <Select
                  value={formData.star_rating.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, star_rating: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} Star{n > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Distance from Haram (meters) *</Label>
                <Input
                  type="number"
                  value={formData.distance_from_haram}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distance_from_haram: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the hotel..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Hotel Details (Bullet Points)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                প্রতিটি লাইনে একটি করে বুলেট পয়েন্ট লিখুন। Enter চাপলে নতুন পয়েন্ট যোগ হবে।
              </p>
              <Textarea
                value={formData.details.join("\n")}
                onChange={(e) =>
                  setFormData({ 
                    ...formData, 
                    details: e.target.value.split("\n").filter(line => line.trim() !== "") 
                  })
                }
                placeholder="• 24/7 Room Service&#10;• Free Airport Pickup&#10;• Halal Restaurant&#10;• Prayer Facilities"
                rows={6}
              />
              {formData.details.length > 0 && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs font-medium mb-2">Preview:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {formData.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Facilities</Label>
              <div className="flex flex-wrap gap-2">
                {FACILITY_OPTIONS.map((facility) => (
                  <Badge
                    key={facility}
                    variant={
                      formData.facilities.includes(facility)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => toggleFacility(facility)}
                  >
                    {facility}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Hotel image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  id="hotel-images"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("hotel-images")?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload Images
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Google Map Link</Label>
                <Input
                  value={formData.google_map_link}
                  onChange={(e) =>
                    setFormData({ ...formData, google_map_link: e.target.value })
                  }
                  placeholder="https://maps.google.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Google Map Embed URL</Label>
                <Input
                  value={formData.google_map_embed_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      google_map_embed_url: e.target.value,
                    })
                  }
                  placeholder="https://www.google.com/maps/embed?..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_phone: e.target.value })
                  }
                  placeholder="+966 1234567890"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="hotel@example.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label>Active (visible on website)</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Hotel"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Booking Requests Sub-component
const AdminHotelBookingRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("hotel_booking_requests")
      .select("*, hotels(name, city)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error:", error);
    } else {
      setRequests(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("hotel_booking_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Status updated" });
      fetchRequests();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>Hotel</TableHead>
            <TableHead>Guest</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Rooms</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono text-sm">
                {request.request_id}
              </TableCell>
              <TableCell>
                {request.hotels?.name || "N/A"}
                <br />
                <span className="text-xs text-muted-foreground capitalize">
                  {request.hotels?.city}
                </span>
              </TableCell>
              <TableCell>
                {request.guest_name}
                <br />
                <span className="text-xs text-muted-foreground">
                  {request.country_code} {request.guest_phone}
                </span>
              </TableCell>
              <TableCell>{request.check_in_date}</TableCell>
              <TableCell>{request.check_out_date}</TableCell>
              <TableCell>
                {request.room_count} room(s)
                <br />
                <span className="text-xs text-muted-foreground">
                  {request.adult_count} adults, {request.child_count} children
                </span>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    request.status === "confirmed"
                      ? "default"
                      : request.status === "cancelled"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {request.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Select
                  value={request.status}
                  onValueChange={(value) => updateStatus(request.id, value)}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No booking requests yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default AdminHotels;
