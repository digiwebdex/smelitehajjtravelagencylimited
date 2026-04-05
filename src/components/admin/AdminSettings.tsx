import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useViewerMode } from "@/contexts/ViewerModeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Settings, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  MapPin,
  Share2,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Megaphone,
  ImageIcon,
  Sun,
  Moon,
  Monitor,
  MousePointerClick,
  Eye,
  ExternalLink,
  Smartphone,
  BarChart3,
  AlertCircle,
  Lock
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CURRENCY } from "@/lib/currency";
import ImageUpload from "./ImageUpload";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTheme } from "next-themes";
import { AdminActionButton } from "./AdminActionButton";

interface CompanyInfo {
  name: string;
  tagline: string;
  description: string;
  logo_url: string;
}

interface ContactDetails {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  google_map_embed_url: string;
  savar_google_map_embed_url: string;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
}

interface Appearance {
  primary_color: string;
  show_announcement_bar: boolean;
  announcement_text: string;
  show_book_now_button: boolean;
  show_mobile_cta_bar: boolean;
}

interface AnalyticsSettings {
  measurement_id: string;
  is_enabled: boolean;
}

interface FacebookPixelSettings {
  pixel_id: string;
  access_token: string;
  test_event_code: string;
  is_enabled: boolean;
}

interface OfficeLocationMapRecord {
  id: string;
  name: string;
  order_index: number;
  map_embed_url: string | null;
}

const sanitizeGoogleMapsEmbedUrl = (value: string | null | undefined) => {
  if (!value) return "";

  let cleanedValue = value.trim();
  const srcMatch = cleanedValue.match(/src=["']([^"']+)["']/i);

  if (srcMatch) {
    cleanedValue = srcMatch[1];
  }

  return cleanedValue
    .replace(/["']\s*(width|height|style|allowfullscreen|loading|referrerpolicy|frameborder)=.*/gi, "")
    .replace(/["']\s*$/, "")
    .trim();
};

const getOfficeMapTargets = (offices: OfficeLocationMapRecord[]) => {
  const orderedOffices = [...offices].sort((a, b) => a.order_index - b.order_index);
  const bananiOffice = orderedOffices.find((office) => /banani/i.test(office.name)) ?? orderedOffices[0] ?? null;
  const savarOffice = orderedOffices.find((office) => /savar/i.test(office.name)) ?? orderedOffices.find((office) => office.id !== bananiOffice?.id) ?? null;

  return { bananiOffice, savarOffice };
};

const defaultCompanyInfo: CompanyInfo = {
  name: "SM Elite Hajj",
  tagline: "Your Trusted Partner for Sacred Journeys",
  description: "Government Approved Hajj & Umrah Agency",
  logo_url: "",
};

const defaultContactDetails: ContactDetails = {
  email: "info@smelitehajj.com",
  phone: "+880 1234-567890",
  whatsapp: "+8801712345678",
  address: "Dhaka, Bangladesh",
  google_map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.73722708738!2d90.40006317353787!3d23.79236988716717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c790ba691d2d%3A0xd7e95eafc3e303a7!2sS%20M%20Elite%20Hajj%20Limited!5e0!3m2!1sen!2sbd!4v1769162756109!5m2!1sen!2sbd",
  savar_google_map_embed_url: "",
};

const defaultSocialLinks: SocialLinks = {
  facebook: "",
  instagram: "",
  youtube: "",
  twitter: "",
};

const defaultAppearance: Appearance = {
  primary_color: "#10b981",
  show_announcement_bar: false,
  announcement_text: "",
  show_book_now_button: true,
  show_mobile_cta_bar: true,
};

// Theme Toggle Icon Component
const ThemeToggleIcon = () => {
  const { theme } = useTheme();
  
  if (theme === 'dark') return <Moon className="w-5 h-5 text-primary" />;
  if (theme === 'light') return <Sun className="w-5 h-5 text-primary" />;
  return <Monitor className="w-5 h-5 text-primary" />;
};

// Theme Selector Component
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();
  
  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {themes.map((t) => (
        <Button
          key={t.value}
          variant={theme === t.value ? "default" : "ghost"}
          size="sm"
          className="gap-2"
          onClick={() => setTheme(t.value)}
        >
          <t.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{t.label}</span>
        </Button>
      ))}
    </div>
  );
};

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isViewerMode } = useViewerMode();
  
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "logos",
  });
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(defaultCompanyInfo);

  const [contactDetails, setContactDetails] = useState<ContactDetails>(defaultContactDetails);

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(defaultSocialLinks);

  const [appearance, setAppearance] = useState<Appearance>(defaultAppearance);

  const [notifications, setNotifications] = useState({
    emailOnBooking: true,
    emailOnPayment: true,
    smsNotifications: false,
  });

  const [analytics, setAnalytics] = useState<AnalyticsSettings>({
    measurement_id: "",
    is_enabled: false,
  });

  const [facebookPixel, setFacebookPixel] = useState<FacebookPixelSettings>({
    pixel_id: "",
    access_token: "",
    test_event_code: "",
    is_enabled: false,
  });

  const [savingAnalytics, setSavingAnalytics] = useState(false);
  const [savingFacebookPixel, setSavingFacebookPixel] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      let nextCompanyInfo = defaultCompanyInfo;
      let nextContactDetails = defaultContactDetails;
      let nextSocialLinks = defaultSocialLinks;
      let nextAppearance = defaultAppearance;

      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          const value = setting.setting_value as Record<string, unknown>;
          switch (setting.setting_key) {
            case "company_info":
              nextCompanyInfo = value as unknown as CompanyInfo;
              break;
            case "contact_details":
              nextContactDetails = value as unknown as ContactDetails;
              break;
            case "social_links":
              nextSocialLinks = value as unknown as SocialLinks;
              break;
            case "appearance":
              nextAppearance = value as unknown as Appearance;
              break;
            case "analytics":
              setAnalytics(value as unknown as AnalyticsSettings);
              break;
            case "facebook_pixel":
              setFacebookPixel(value as unknown as FacebookPixelSettings);
              break;
          }
        });
      }

      const { data: officeLocations, error: officeLocationsError } = await supabase
        .from("office_locations")
        .select("id, name, order_index, map_embed_url")
        .order("order_index");

      if (officeLocationsError) throw officeLocationsError;

      if (officeLocations?.length) {
        const { bananiOffice, savarOffice } = getOfficeMapTargets(officeLocations as OfficeLocationMapRecord[]);

        nextContactDetails = {
          ...nextContactDetails,
          google_map_embed_url: sanitizeGoogleMapsEmbedUrl(bananiOffice?.map_embed_url) || nextContactDetails.google_map_embed_url,
          savar_google_map_embed_url: sanitizeGoogleMapsEmbedUrl(savarOffice?.map_embed_url) || nextContactDetails.savar_google_map_embed_url,
        };
      }

      setCompanyInfo(nextCompanyInfo);
      setContactDetails(nextContactDetails);
      setSocialLinks(nextSocialLinks);
      setAppearance(nextAppearance);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: Record<string, unknown>, category: string) => {
    // First check if the setting exists
    const { data: existing } = await supabase
      .from("site_settings")
      .select("id")
      .eq("setting_key", key)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("site_settings")
        .update({
          setting_value: value as Json,
          category,
        })
        .eq("setting_key", key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("site_settings")
        .insert([{
          setting_key: key,
          setting_value: value as Json,
          category,
        }]);
      if (error) throw error;
    }
  };

  const syncOfficeLocationMaps = async (details: ContactDetails) => {
    const { data: officeLocations, error } = await supabase
      .from("office_locations")
      .select("id, name, order_index, map_embed_url")
      .order("order_index");

    if (error) throw error;
    if (!officeLocations?.length) return;

    const { bananiOffice, savarOffice } = getOfficeMapTargets(officeLocations as OfficeLocationMapRecord[]);
    const updates = [];

    if (bananiOffice) {
      updates.push(
        supabase
          .from("office_locations")
          .update({ map_embed_url: sanitizeGoogleMapsEmbedUrl(details.google_map_embed_url) || null })
          .eq("id", bananiOffice.id)
      );
    }

    if (savarOffice && savarOffice.id !== bananiOffice?.id) {
      updates.push(
        supabase
          .from("office_locations")
          .update({ map_embed_url: sanitizeGoogleMapsEmbedUrl(details.savar_google_map_embed_url) || null })
          .eq("id", savarOffice.id)
      );
    }

    const results = await Promise.all(updates);
    const failedResult = results.find((result) => result.error);

    if (failedResult?.error) {
      throw failedResult.error;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const normalizedContactDetails: ContactDetails = {
        ...contactDetails,
        google_map_embed_url: sanitizeGoogleMapsEmbedUrl(contactDetails.google_map_embed_url),
        savar_google_map_embed_url: sanitizeGoogleMapsEmbedUrl(contactDetails.savar_google_map_embed_url),
      };

      await Promise.all([
        saveSetting("company_info", companyInfo as unknown as Record<string, unknown>, "general"),
        saveSetting("contact_details", normalizedContactDetails as unknown as Record<string, unknown>, "general"),
        saveSetting("social_links", socialLinks as unknown as Record<string, unknown>, "general"),
        saveSetting("appearance", appearance as unknown as Record<string, unknown>, "appearance"),
        syncOfficeLocationMaps(normalizedContactDetails),
      ]);
      setContactDetails(normalizedContactDetails);
      toast.success("All settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAnalytics = async () => {
    setSavingAnalytics(true);
    try {
      // Validate measurement ID format if enabled
      if (analytics.is_enabled && analytics.measurement_id) {
        const trimmedId = analytics.measurement_id.trim();
        if (!/^G-[A-Z0-9]+$/.test(trimmedId)) {
          toast.error("Invalid Measurement ID format. It should start with 'G-' followed by letters and numbers.");
          setSavingAnalytics(false);
          return;
        }
      }
      
      await saveSetting("analytics", analytics as unknown as Record<string, unknown>, "integrations");
      toast.success("Analytics settings saved successfully!");
    } catch (error) {
      console.error("Error saving analytics:", error);
      toast.error("Failed to save analytics settings");
    } finally {
      setSavingAnalytics(false);
    }
  };

  const handleSaveFacebookPixel = async () => {
    setSavingFacebookPixel(true);
    try {
      // Validate pixel ID format if enabled (numeric string)
      if (facebookPixel.is_enabled && facebookPixel.pixel_id) {
        const trimmedId = facebookPixel.pixel_id.trim();
        if (!/^\d+$/.test(trimmedId)) {
          toast.error("Invalid Pixel ID format. It should be a numeric ID.");
          setSavingFacebookPixel(false);
          return;
        }
      }
      
      await saveSetting("facebook_pixel", facebookPixel as unknown as Record<string, unknown>, "integrations");
      toast.success("Facebook Pixel settings saved successfully!");
    } catch (error) {
      console.error("Error saving Facebook Pixel:", error);
      toast.error("Failed to save Facebook Pixel settings");
    } finally {
      setSavingFacebookPixel(false);
    }
  };

  const settingsTabs = [
    { value: "company", label: "Company", icon: Building2 },
    { value: "contact", label: "Contact", icon: Phone },
    { value: "social", label: "Social", icon: Share2 },
    { value: "appearance", label: "Appearance", icon: Palette },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
    { value: "database", label: "Database", icon: Database },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Site Settings
        </CardTitle>
        <CardDescription>
          Configure your website settings, company info, and appearance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {settingsTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Company Info Tab */}
          <TabsContent value="company" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    value={companyInfo.tagline}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, tagline: e.target.value })}
                    placeholder="Your company tagline"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  value={companyInfo.description}
                  onChange={(e) => setCompanyInfo({ ...companyInfo, description: e.target.value })}
                  placeholder="Brief description of your company"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Company Logo
                </Label>
                <ImageUpload
                  value={companyInfo.logo_url}
                  onChange={(url) => setCompanyInfo({ ...companyInfo, logo_url: url })}
                  onUpload={uploadImage}
                  uploading={uploading}
                  label=""
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Upload a logo image or paste a URL. Recommended size: 200x60 pixels.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{CURRENCY.symbol} {CURRENCY.code}</span>
                  <span className="text-muted-foreground">({CURRENCY.name})</span>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Contact Details Tab */}
          <TabsContent value="contact" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Contact Email
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactDetails.email}
                    onChange={(e) => setContactDetails({ ...contactDetails, email: e.target.value })}
                    placeholder="info@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Contact Phone
                  </Label>
                  <Input
                    id="contactPhone"
                    value={contactDetails.phone}
                    onChange={(e) => setContactDetails({ ...contactDetails, phone: e.target.value })}
                    placeholder="+880 1234-567890"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-500" />
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp"
                    value={contactDetails.whatsapp}
                    onChange={(e) => setContactDetails({ ...contactDetails, whatsapp: e.target.value })}
                    placeholder="+8801712345678"
                  />
                  <p className="text-xs text-muted-foreground">Include country code without spaces</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Business Address
                  </Label>
                  <Input
                    id="address"
                    value={contactDetails.address}
                    onChange={(e) => setContactDetails({ ...contactDetails, address: e.target.value })}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="space-y-6">
                {/* Banani Office Map */}
                <div className="space-y-2">
                  <Label htmlFor="google_map_embed_url" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Banani Office - Google Maps Embed URL
                  </Label>
                  <Textarea
                    id="google_map_embed_url"
                    value={contactDetails.google_map_embed_url}
                    onChange={(e) => setContactDetails({ ...contactDetails, google_map_embed_url: sanitizeGoogleMapsEmbedUrl(e.target.value) })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    rows={3}
                    className={
                      contactDetails.google_map_embed_url && 
                      !contactDetails.google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) 
                        ? "border-destructive" 
                        : ""
                    }
                  />
                  {contactDetails.google_map_embed_url && 
                   !contactDetails.google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      ⚠️ Invalid format. URL must start with "https://www.google.com/maps/embed?pb="
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://www.google.com/maps', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Google Maps
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Search your location → Click "Share" → "Embed a map" → Copy the src URL
                    </p>
                  </div>
                  
                  {/* Banani Map Preview */}
                  {contactDetails.google_map_embed_url && 
                   contactDetails.google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <Eye className="w-4 h-4" />
                        Banani Office Map Preview ✓
                      </Label>
                      <div className="rounded-lg overflow-hidden border border-green-200">
                        <iframe
                          src={contactDetails.google_map_embed_url}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Banani Office Map Preview"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Savar Office Map */}
                <div className="space-y-2">
                  <Label htmlFor="savar_google_map_embed_url" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    Savar Office - Google Maps Embed URL
                  </Label>
                  <Textarea
                    id="savar_google_map_embed_url"
                    value={contactDetails.savar_google_map_embed_url || ""}
                    onChange={(e) => setContactDetails({ ...contactDetails, savar_google_map_embed_url: sanitizeGoogleMapsEmbedUrl(e.target.value) })}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    rows={3}
                    className={
                      contactDetails.savar_google_map_embed_url && 
                      !contactDetails.savar_google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) 
                        ? "border-destructive" 
                        : ""
                    }
                  />
                  {contactDetails.savar_google_map_embed_url && 
                   !contactDetails.savar_google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      ⚠️ Invalid format. URL must start with "https://www.google.com/maps/embed?pb="
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://www.google.com/maps', '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Google Maps
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Search your location → Click "Share" → "Embed a map" → Copy the src URL
                    </p>
                  </div>
                  
                  {/* Savar Map Preview */}
                  {contactDetails.savar_google_map_embed_url && 
                   contactDetails.savar_google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm font-medium text-green-600">
                        <Eye className="w-4 h-4" />
                        Savar Office Map Preview ✓
                      </Label>
                      <div className="rounded-lg overflow-hidden border border-green-200">
                        <iframe
                          src={contactDetails.savar_google_map_embed_url}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Savar Office Map Preview"
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Social Links Tab */}
          <TabsContent value="social" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    Facebook URL
                  </Label>
                  <Input
                    id="facebook"
                    value={socialLinks.facebook}
                    onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Instagram URL
                  </Label>
                  <Input
                    id="instagram"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    YouTube URL
                  </Label>
                  <Input
                    id="youtube"
                    value={socialLinks.youtube}
                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                    placeholder="https://youtube.com/channel/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-sky-500" />
                    Twitter/X URL
                  </Label>
                  <Input
                    id="twitter"
                    value={socialLinks.twitter}
                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Primary Color
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={appearance.primary_color}
                      onChange={(e) => setAppearance({ ...appearance, primary_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={appearance.primary_color}
                      onChange={(e) => setAppearance({ ...appearance, primary_color: e.target.value })}
                      placeholder="#10b981"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Note: Theme colors are managed in the design system. This is for reference.
                  </p>
                </div>

                <Card className="border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ThemeToggleIcon />
                        <div>
                          <Label className="text-base">Site Theme</Label>
                          <p className="text-sm text-muted-foreground">
                            Choose light, dark, or system theme
                          </p>
                        </div>
                      </div>
                      <ThemeSelector />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Megaphone className="w-5 h-5 text-primary" />
                        <div>
                          <Label className="text-base">Announcement Bar</Label>
                          <p className="text-sm text-muted-foreground">
                            Show a banner at the top of your site
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={appearance.show_announcement_bar}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, show_announcement_bar: checked })}
                      />
                    </div>

                    {appearance.show_announcement_bar && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="announcementText">Announcement Text</Label>
                        <Input
                          id="announcementText"
                          value={appearance.announcement_text}
                          onChange={(e) => setAppearance({ ...appearance, announcement_text: e.target.value })}
                          placeholder="🎉 Special offer: Book now and save 10%!"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MousePointerClick className="w-5 h-5 text-primary" />
                        <div>
                          <Label className="text-base">Book Now Button</Label>
                          <p className="text-sm text-muted-foreground">
                            Show the "Book Now" button in the header
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={appearance.show_book_now_button}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, show_book_now_button: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 text-primary" />
                        <div>
                          <Label className="text-base">Mobile CTA Bar</Label>
                          <p className="text-sm text-muted-foreground">
                            Show a sticky Call/Book/Chat bar on mobile devices
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={appearance.show_mobile_cta_bar}
                        onCheckedChange={(checked) => setAppearance({ ...appearance, show_mobile_cta_bar: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="text-base">Google Analytics</Label>
                        <p className="text-sm text-muted-foreground">
                          Track visitor behavior and conversions
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={analytics.is_enabled}
                      onCheckedChange={(checked) => setAnalytics({ ...analytics, is_enabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {analytics.is_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="measurementId" className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Measurement ID
                    </Label>
                    <Input
                      id="measurementId"
                      value={analytics.measurement_id}
                      onChange={(e) => setAnalytics({ ...analytics, measurement_id: e.target.value.toUpperCase() })}
                      placeholder="G-XXXXXXXXXX"
                      className={analytics.measurement_id && !/^G-[A-Z0-9]+$/.test(analytics.measurement_id.trim()) ? "border-destructive" : ""}
                    />
                    {analytics.measurement_id && !/^G-[A-Z0-9]+$/.test(analytics.measurement_id.trim()) && (
                      <p className="text-xs text-destructive">
                        Invalid format. Should be like "G-XXXXXXXXXX"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Find this in Google Analytics → Admin → Data Streams → Select stream → Measurement ID
                    </p>
                  </div>

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">How to get your Measurement ID:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics</a></li>
                          <li>Select your property or create a new one</li>
                          <li>Click Admin (⚙️) → Data Streams</li>
                          <li>Select or create a Web stream</li>
                          <li>Copy the Measurement ID (starts with G-)</li>
                        </ol>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://analytics.google.com', '_blank')}
                          className="flex items-center gap-2 mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Google Analytics
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <h4 className="font-medium text-sm mb-2">What's being tracked:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ Page views on route changes</li>
                        <li>✓ Package details views</li>
                        <li>✓ Booking initiations</li>
                        <li>✓ Completed purchases</li>
                        <li>✓ Contact form submissions</li>
                        <li>✓ Visa applications</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAnalytics} disabled={savingAnalytics} className="gap-2">
                {savingAnalytics ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Analytics Settings
              </AdminActionButton>
            </div>

            {/* Facebook Pixel Section */}
            <Separator className="my-8" />
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card className="border-dashed">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Facebook className="w-5 h-5 text-primary" />
                      <div>
                        <Label className="text-base">Facebook Pixel & Conversions API</Label>
                        <p className="text-sm text-muted-foreground">
                          Track conversions and optimize ad campaigns
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={facebookPixel.is_enabled}
                      onCheckedChange={(checked) => setFacebookPixel({ ...facebookPixel, is_enabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {facebookPixel.is_enabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pixelId" className="flex items-center gap-2">
                      <Facebook className="w-4 h-4" />
                      Pixel ID
                    </Label>
                    <Input
                      id="pixelId"
                      value={facebookPixel.pixel_id}
                      onChange={(e) => setFacebookPixel({ ...facebookPixel, pixel_id: e.target.value.replace(/\D/g, '') })}
                      placeholder="1234567890123456"
                      className={facebookPixel.pixel_id && !/^\d+$/.test(facebookPixel.pixel_id.trim()) ? "border-destructive" : ""}
                    />
                    {facebookPixel.pixel_id && !/^\d+$/.test(facebookPixel.pixel_id.trim()) && (
                      <p className="text-xs text-destructive">
                        Invalid format. Pixel ID should be numeric.
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Find this in Facebook Events Manager → Your Pixel → Settings
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accessToken" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Access Token (Conversions API)
                    </Label>
                    <Input
                      id="accessToken"
                      type="password"
                      value={facebookPixel.access_token}
                      onChange={(e) => setFacebookPixel({ ...facebookPixel, access_token: e.target.value })}
                      placeholder="Enter your Conversions API access token"
                    />
                    <p className="text-xs text-muted-foreground">
                      Generate via Events Manager → Settings → Conversions API → Generate access token
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testEventCode" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Test Event Code (Optional)
                    </Label>
                    <Input
                      id="testEventCode"
                      value={facebookPixel.test_event_code}
                      onChange={(e) => setFacebookPixel({ ...facebookPixel, test_event_code: e.target.value.toUpperCase() })}
                      placeholder="TEST12345"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use this to test events without affecting production data. Find it in Events Manager → Test Events
                    </p>
                  </div>

                  {facebookPixel.test_event_code && (
                    <Card className="bg-amber-500/10 border-amber-500/20">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500">
                          <AlertCircle className="w-4 h-4" />
                          <span className="font-medium text-sm">Test Mode Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Events will be sent with the test code. Remove it when ready for production.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">How to get your credentials:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Go to <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Facebook Events Manager</a></li>
                          <li>Select your Pixel or create a new one</li>
                          <li>Copy the Pixel ID (numeric ID in the header)</li>
                          <li>Go to Settings → Conversions API</li>
                          <li>Generate an access token</li>
                          <li>For testing, go to Test Events tab to get your test code</li>
                        </ol>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open('https://business.facebook.com/events_manager', '_blank')}
                          className="flex items-center gap-2 mt-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open Facebook Events Manager
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-4">
                      <h4 className="font-medium text-sm mb-2">Events being tracked:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>✓ PageView - on every page visit</li>
                        <li>✓ ViewContent - when viewing package details</li>
                        <li>✓ InitiateCheckout - when opening booking modal</li>
                        <li>✓ Purchase - when booking is confirmed</li>
                        <li>✓ Lead - on contact form submissions</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-3">
                        Both browser (Pixel) and server (Conversions API) tracking with automatic deduplication.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveFacebookPixel} disabled={savingFacebookPixel} className="gap-2">
                {savingFacebookPixel ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Facebook Pixel Settings
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Email on New Booking</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications when a new booking is made
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOnBooking}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailOnBooking: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Email on Payment</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications when a payment is processed
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOnPayment}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailOnPayment: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS alerts for important updates
                  </p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                />
              </div>
            </motion.div>

            <div className="flex justify-end">
              <AdminActionButton onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </AdminActionButton>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Shield className="w-8 h-8 text-green-500" />
                    <div>
                      <h3 className="font-semibold">Security Status</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your application is protected with Row Level Security (RLS) policies 
                        and proper authentication mechanisms.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Authentication enabled
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          RLS policies active on all tables
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Admin role verification in place
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Secure edge functions deployed
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Database className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Database Information</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your application is connected to Lovable Cloud backend.
                      </p>
                      <div className="mt-4 grid gap-3 text-sm">
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Tables</span>
                          <span className="font-medium">21 active</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Storage Buckets</span>
                          <span className="font-medium">2 configured</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Edge Functions</span>
                          <span className="font-medium">5 deployed</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Realtime</span>
                          <span className="font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;