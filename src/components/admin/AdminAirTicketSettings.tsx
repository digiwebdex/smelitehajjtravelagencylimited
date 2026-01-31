import { useState, useEffect } from "react";
import { Plane, Save, Loader2, Settings, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  trip_types: { one_way: boolean; round_trip: boolean; multi_city: boolean };
  cabin_classes: { economy: boolean; premium_economy: boolean; business: boolean; first: boolean };
  max_multi_city_routes: number;
  confirmation_message: string;
  section_title: string;
  section_subtitle: string;
}

const defaultSettings: Settings = {
  trip_types: { one_way: true, round_trip: true, multi_city: true },
  cabin_classes: { economy: true, premium_economy: true, business: true, first: true },
  max_multi_city_routes: 4,
  confirmation_message: "Our team is checking availability. We will contact you shortly with the best options.",
  section_title: "Book Your Air Ticket",
  section_subtitle: "Affordable air tickets to destinations worldwide with trusted airlines",
};

export default function AdminAirTicketSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("air_ticket_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      if (data) {
        const newSettings = { ...defaultSettings };
        data.forEach((item) => {
          const key = item.setting_key as keyof Settings;
          if (key === "trip_types" && typeof item.setting_value === "object") {
            newSettings.trip_types = item.setting_value as Settings["trip_types"];
          } else if (key === "cabin_classes" && typeof item.setting_value === "object") {
            newSettings.cabin_classes = item.setting_value as Settings["cabin_classes"];
          } else if (key === "max_multi_city_routes") {
            newSettings.max_multi_city_routes = parseInt(String(item.setting_value)) || 4;
          } else if (key === "confirmation_message") {
            newSettings.confirmation_message = String(item.setting_value).replace(/^"|"$/g, "");
          } else if (key === "section_title") {
            newSettings.section_title = String(item.setting_value).replace(/^"|"$/g, "");
          } else if (key === "section_subtitle") {
            newSettings.section_subtitle = String(item.setting_value).replace(/^"|"$/g, "");
          }
        });
        setSettings(newSettings);
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
      const updates = [
        { setting_key: "trip_types", setting_value: settings.trip_types },
        { setting_key: "cabin_classes", setting_value: settings.cabin_classes },
        { setting_key: "max_multi_city_routes", setting_value: settings.max_multi_city_routes },
        { setting_key: "confirmation_message", setting_value: settings.confirmation_message },
        { setting_key: "section_title", setting_value: settings.section_title },
        { setting_key: "section_subtitle", setting_value: settings.section_subtitle },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("air_ticket_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast({
        title: "Settings Saved",
        description: "Air ticket settings have been updated successfully.",
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

  const updateTripType = (key: keyof Settings["trip_types"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      trip_types: { ...prev.trip_types, [key]: value },
    }));
  };

  const updateCabinClass = (key: keyof Settings["cabin_classes"], value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      cabin_classes: { ...prev.cabin_classes, [key]: value },
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
            Air Ticket Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure trip types, cabin classes, and messages
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
        {/* Trip Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Trip Types
            </CardTitle>
            <CardDescription>Enable or disable available trip types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="one_way">One Way</Label>
              <Switch
                id="one_way"
                checked={settings.trip_types.one_way}
                onCheckedChange={(checked) => updateTripType("one_way", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="round_trip">Round Trip</Label>
              <Switch
                id="round_trip"
                checked={settings.trip_types.round_trip}
                onCheckedChange={(checked) => updateTripType("round_trip", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="multi_city">Multi-City</Label>
              <Switch
                id="multi_city"
                checked={settings.trip_types.multi_city}
                onCheckedChange={(checked) => updateTripType("multi_city", checked)}
              />
            </div>
            {settings.trip_types.multi_city && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="max_routes">Maximum Multi-City Routes</Label>
                  <Input
                    id="max_routes"
                    type="number"
                    min={2}
                    max={10}
                    value={settings.max_multi_city_routes}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        max_multi_city_routes: parseInt(e.target.value) || 4,
                      }))
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cabin Classes */}
        <Card>
          <CardHeader>
            <CardTitle>Cabin Classes</CardTitle>
            <CardDescription>Enable or disable available cabin classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="economy">Economy</Label>
              <Switch
                id="economy"
                checked={settings.cabin_classes.economy}
                onCheckedChange={(checked) => updateCabinClass("economy", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="premium_economy">Premium Economy</Label>
              <Switch
                id="premium_economy"
                checked={settings.cabin_classes.premium_economy}
                onCheckedChange={(checked) => updateCabinClass("premium_economy", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="business">Business</Label>
              <Switch
                id="business"
                checked={settings.cabin_classes.business}
                onCheckedChange={(checked) => updateCabinClass("business", checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="first">First Class</Label>
              <Switch
                id="first"
                checked={settings.cabin_classes.first}
                onCheckedChange={(checked) => updateCabinClass("first", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Content */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Content & Messages
            </CardTitle>
            <CardDescription>Customize titles and confirmation messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="section_title">Section Title</Label>
                <Input
                  id="section_title"
                  value={settings.section_title}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, section_title: e.target.value }))
                  }
                  placeholder="Book Your Air Ticket"
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
                  placeholder="Affordable air tickets..."
                />
              </div>
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
