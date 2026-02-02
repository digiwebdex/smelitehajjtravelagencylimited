import { useState, useEffect } from "react";
import { Building2, Save, Loader2, Settings, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface HotelSettings {
  section_title: string;
  section_subtitle: string;
  booking_enabled: boolean;
  show_details_button: boolean;
  show_map_button: boolean;
  star_label: string;
  sort_by: string;
  sort_order: string;
  hotels_per_page: number;
  confirmation_message: string;
  countries_enabled: { [key: string]: boolean };
  star_categories: { three: boolean; four: boolean; five: boolean };
}

const defaultSettings: HotelSettings = {
  section_title: "Hotel Booking",
  section_subtitle: "Find the perfect accommodation for your sacred journey",
  booking_enabled: true,
  show_details_button: true,
  show_map_button: true,
  star_label: "Star",
  sort_by: "order_index",
  sort_order: "asc",
  hotels_per_page: 12,
  confirmation_message: "Your hotel booking request has been submitted. Our team will contact you shortly with availability and pricing.",
  countries_enabled: {
    "Saudi Arabia": true,
    "Dubai": true,
    "Turkey": true,
    "Malaysia": true,
    "Thailand": true,
    "Singapore": true,
    "Indonesia": true,
    "Egypt": true,
  },
  star_categories: { three: true, four: true, five: true },
};

export default function AdminHotelSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HotelSettings>(defaultSettings);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("hotel_section_settings")
        .select("*")
        .eq("section_key", "general")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setSettings({
          section_title: data.title || defaultSettings.section_title,
          section_subtitle: data.subtitle || defaultSettings.section_subtitle,
          booking_enabled: data.booking_enabled ?? defaultSettings.booking_enabled,
          show_details_button: data.show_details_button ?? defaultSettings.show_details_button,
          show_map_button: data.show_map_button ?? defaultSettings.show_map_button,
          star_label: data.star_label || defaultSettings.star_label,
          sort_by: data.sort_by || defaultSettings.sort_by,
          sort_order: data.sort_order || defaultSettings.sort_order,
          hotels_per_page: data.hotels_per_page || defaultSettings.hotels_per_page,
          confirmation_message: defaultSettings.confirmation_message,
          countries_enabled: defaultSettings.countries_enabled,
          star_categories: defaultSettings.star_categories,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("hotel_section_settings")
        .update({
          title: settings.section_title,
          subtitle: settings.section_subtitle,
          booking_enabled: settings.booking_enabled,
          show_details_button: settings.show_details_button,
          show_map_button: settings.show_map_button,
          star_label: settings.star_label,
          sort_by: settings.sort_by,
          sort_order: settings.sort_order,
          hotels_per_page: settings.hotels_per_page,
        })
        .eq("section_key", "general");

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Hotel settings have been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCountry = (country: string, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      countries_enabled: { ...prev.countries_enabled, [country]: enabled },
    }));
  };

  const toggleStarCategory = (category: keyof HotelSettings["star_categories"], enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      star_categories: { ...prev.star_categories, [category]: enabled },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Hotel Booking Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure hotel booking options, countries, and display settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Available Countries
            </CardTitle>
            <CardDescription>Enable or disable countries for hotel booking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(settings.countries_enabled).map(([country, enabled], index) => (
              <div key={country}>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`country-${country}`}>{country}</Label>
                  <Switch
                    id={`country-${country}`}
                    checked={enabled}
                    onCheckedChange={(checked) => toggleCountry(country, checked)}
                  />
                </div>
                {index < Object.entries(settings.countries_enabled).length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Star Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Star Categories</CardTitle>
            <CardDescription>Enable or disable star rating categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="three_star">3 Star Hotels</Label>
              <Switch
                id="three_star"
                checked={settings.star_categories.three}
                onCheckedChange={(checked) => toggleStarCategory("three", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="four_star">4 Star Hotels</Label>
              <Switch
                id="four_star"
                checked={settings.star_categories.four}
                onCheckedChange={(checked) => toggleStarCategory("four", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="five_star">5 Star Hotels</Label>
              <Switch
                id="five_star"
                checked={settings.star_categories.five}
                onCheckedChange={(checked) => toggleStarCategory("five", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Display Settings</CardTitle>
            <CardDescription>Configure how hotels are displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="booking_enabled">Enable Booking</Label>
              <Switch
                id="booking_enabled"
                checked={settings.booking_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, booking_enabled: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="show_details">Show Details Button</Label>
              <Switch
                id="show_details"
                checked={settings.show_details_button}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, show_details_button: checked }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="show_map">Show Map Button</Label>
              <Switch
                id="show_map"
                checked={settings.show_map_button}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, show_map_button: checked }))
                }
              />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select
                  value={settings.sort_by}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, sort_by: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="order_index">Manual Order</SelectItem>
                    <SelectItem value="distance_from_haram">Distance</SelectItem>
                    <SelectItem value="star_rating">Rating</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select
                  value={settings.sort_order}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, sort_order: value }))
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
            <div className="space-y-2">
              <Label htmlFor="hotels_per_page">Hotels Per Page</Label>
              <Input
                id="hotels_per_page"
                type="number"
                min={4}
                max={50}
                value={settings.hotels_per_page}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    hotels_per_page: parseInt(e.target.value) || 12,
                  }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Content & Messages
            </CardTitle>
            <CardDescription>Customize titles and confirmation messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section_title">Section Title</Label>
              <Input
                id="section_title"
                value={settings.section_title}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, section_title: e.target.value }))
                }
                placeholder="Hotel Booking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section_subtitle">Section Subtitle</Label>
              <Input
                id="section_subtitle"
                value={settings.section_subtitle}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, section_subtitle: e.target.value }))
                }
                placeholder="Find the perfect accommodation..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="star_label">Star Label</Label>
              <Input
                id="star_label"
                value={settings.star_label}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, star_label: e.target.value }))
                }
                placeholder="Star"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation_message">Confirmation Message</Label>
              <Textarea
                id="confirmation_message"
                value={settings.confirmation_message}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, confirmation_message: e.target.value }))
                }
                placeholder="Message shown after booking submission"
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground">
                This message is displayed to users after they submit a booking request
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
