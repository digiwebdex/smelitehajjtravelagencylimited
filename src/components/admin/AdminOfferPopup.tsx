import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Save, Loader2, Eye, Image as ImageIcon } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface OfferPopupSettings {
  is_enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  badge_text: string;
  discount_text: string;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  background_color: string;
  text_color: string;
  overlay_opacity: number;
}

const defaultSettings: OfferPopupSettings = {
  is_enabled: false,
  title: "Exclusive Hajj Offer!",
  subtitle: "Limited Time Only",
  description: "Book your sacred journey now and enjoy special discounts on all our premium packages.",
  image_url: "",
  button_text: "Explore Packages",
  button_link: "#hajj",
  badge_text: "🔥 Special Offer",
  discount_text: "Save up to 20%",
  display_delay_seconds: 2,
  show_once_per_session: true,
  background_color: "#1a5f4a",
  text_color: "#ffffff",
  overlay_opacity: 80,
};

const quickLinks = [
  { label: "Hajj Packages", value: "#hajj" },
  { label: "Umrah Packages", value: "#umrah" },
  { label: "Visa Services", value: "#visa" },
  { label: "Contact Section", value: "#contact" },
  { label: "Services", value: "#services" },
];

const AdminOfferPopup = () => {
  const [settings, setSettings] = useState<OfferPopupSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "offer_popup")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...(data.setting_value as unknown as OfferPopupSettings) });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "offer_popup")
        .single();

      const settingsJson = JSON.parse(JSON.stringify(settings));

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("site_settings")
          .update({
            setting_value: settingsJson,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "offer_popup");

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("site_settings")
          .insert([{
            setting_key: "offer_popup",
            setting_value: settingsJson,
            category: "marketing",
          }]);

        if (error) throw error;
      }

      toast.success("Offer popup settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `offer-popup-${Date.now()}.${fileExt}`;
      const filePath = `offer-popup/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-uploads")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("admin-uploads")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const updateSetting = <K extends keyof OfferPopupSettings>(
    key: K,
    value: OfferPopupSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Offer Popup Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure the promotional popup for new visitors
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings.is_enabled ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                  <div>
                    <Label className="text-base font-semibold">Enable Offer Popup</Label>
                    <p className="text-sm text-muted-foreground">
                      Show promotional popup to new visitors
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(checked) => updateSetting("is_enabled", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Badge Text</Label>
                <Input
                  value={settings.badge_text}
                  onChange={(e) => updateSetting("badge_text", e.target.value)}
                  placeholder="🔥 Special Offer"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={settings.title}
                  onChange={(e) => updateSetting("title", e.target.value)}
                  placeholder="Exclusive Hajj Offer!"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={settings.subtitle}
                  onChange={(e) => updateSetting("subtitle", e.target.value)}
                  placeholder="Limited Time Only"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Text</Label>
                <Input
                  value={settings.discount_text}
                  onChange={(e) => updateSetting("discount_text", e.target.value)}
                  placeholder="Save up to 20%"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={settings.description}
                  onChange={(e) => updateSetting("description", e.target.value)}
                  placeholder="Book your sacred journey now..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Banner Image */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Banner Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={settings.image_url}
                onChange={(url) => updateSetting("image_url", url)}
                onUpload={handleImageUpload}
                uploading={uploading}
                label="Banner Image"
              />
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call to Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                  value={settings.button_text}
                  onChange={(e) => updateSetting("button_text", e.target.value)}
                  placeholder="Book Now"
                />
              </div>
              <div className="space-y-2">
                <Label>Button Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.button_link}
                    onChange={(e) => updateSetting("button_link", e.target.value)}
                    placeholder="#hajj"
                    className="flex-1"
                  />
                  <Select
                    value=""
                    onValueChange={(value) => updateSetting("button_link", value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Quick Links" />
                    </SelectTrigger>
                    <SelectContent>
                      {quickLinks.map((link) => (
                        <SelectItem key={link.value} value={link.value}>
                          {link.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Display Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Delay before showing: {settings.display_delay_seconds}s</Label>
                </div>
                <Slider
                  value={[settings.display_delay_seconds]}
                  onValueChange={([value]) => updateSetting("display_delay_seconds", value)}
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show once per session</Label>
                  <p className="text-sm text-muted-foreground">
                    Popup will only show once per browser session
                  </p>
                </div>
                <Switch
                  checked={settings.show_once_per_session}
                  onCheckedChange={(checked) => updateSetting("show_once_per_session", checked)}
                />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Overlay Opacity: {settings.overlay_opacity}%</Label>
                </div>
                <Slider
                  value={[settings.overlay_opacity]}
                  onValueChange={([value]) => updateSetting("overlay_opacity", value)}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className={showPreview ? "block" : "hidden lg:block"}>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="relative rounded-lg overflow-hidden bg-background"
                style={{ 
                  minHeight: "500px"
                }}
              >
                {/* Overlay */}
                <div 
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${settings.overlay_opacity / 100})` }}
                />
                
                <div 
                  className="absolute inset-4 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                  style={{ 
                    backgroundColor: settings.background_color,
                    color: settings.text_color
                  }}
                >
                  {/* Badge */}
                  {settings.badge_text && (
                    <div className="text-center py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                      <span className="text-sm font-medium">{settings.badge_text}</span>
                    </div>
                  )}

                  {/* Image */}
                  {settings.image_url && (
                    <div className="h-32 overflow-hidden">
                      <img
                        src={settings.image_url}
                        alt="Offer Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 p-4 text-center space-y-2">
                    <h3 className="text-xl font-bold">✨ {settings.title} ✨</h3>
                    {settings.subtitle && (
                      <p className="text-sm opacity-90">{settings.subtitle}</p>
                    )}
                    {settings.description && (
                      <p className="text-sm opacity-80">{settings.description}</p>
                    )}
                    {settings.discount_text && (
                      <div className="py-2">
                        <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                          {settings.discount_text}
                        </span>
                      </div>
                    )}
                    <Button 
                      className="mt-4"
                      variant="secondary"
                    >
                      {settings.button_text} →
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminOfferPopup;
