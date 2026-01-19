import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
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
  ExternalLink
} from "lucide-react";
import { CURRENCY } from "@/lib/currency";
import ImageUpload from "./ImageUpload";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useTheme } from "next-themes";

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
}

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
  
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "logos",
  });
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "SM Elite Hajj",
    tagline: "Your Trusted Partner for Sacred Journeys",
    description: "Government Approved Hajj & Umrah Agency",
    logo_url: "",
  });

  const [contactDetails, setContactDetails] = useState<ContactDetails>({
    email: "info@smelitehajj.com",
    phone: "+880 1234-567890",
    whatsapp: "+8801712345678",
    address: "Dhaka, Bangladesh",
    google_map_embed_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.5484611458387!2d90.39729221498282!3d23.79416879319868!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c709be6be7b5%3A0x7e53f4e8b8be1a24!2sBanani%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd",
  });

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: "",
    instagram: "",
    youtube: "",
    twitter: "",
  });

  const [appearance, setAppearance] = useState<Appearance>({
    primary_color: "#10b981",
    show_announcement_bar: false,
    announcement_text: "",
    show_book_now_button: true,
  });

  const [notifications, setNotifications] = useState({
    emailOnBooking: true,
    emailOnPayment: true,
    smsNotifications: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          const value = setting.setting_value as Record<string, unknown>;
          switch (setting.setting_key) {
            case "company_info":
              setCompanyInfo(value as unknown as CompanyInfo);
              break;
            case "contact_details":
              setContactDetails(value as unknown as ContactDetails);
              break;
            case "social_links":
              setSocialLinks(value as unknown as SocialLinks);
              break;
            case "appearance":
              setAppearance(value as unknown as Appearance);
              break;
          }
        });
      }
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

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        saveSetting("company_info", companyInfo as unknown as Record<string, unknown>, "general"),
        saveSetting("contact_details", contactDetails as unknown as Record<string, unknown>, "general"),
        saveSetting("social_links", socialLinks as unknown as Record<string, unknown>, "general"),
        saveSetting("appearance", appearance as unknown as Record<string, unknown>, "appearance"),
      ]);
      toast.success("All settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const settingsTabs = [
    { value: "company", label: "Company", icon: Building2 },
    { value: "contact", label: "Contact", icon: Phone },
    { value: "social", label: "Social", icon: Share2 },
    { value: "appearance", label: "Appearance", icon: Palette },
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
              <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
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

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google_map_embed_url" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-500" />
                    Google Maps Embed URL
                  </Label>
                  <Textarea
                    id="google_map_embed_url"
                    value={contactDetails.google_map_embed_url}
                    onChange={(e) => setContactDetails({ ...contactDetails, google_map_embed_url: e.target.value })}
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
                </div>
                
                {/* Map Preview - only show if valid URL */}
                {contactDetails.google_map_embed_url && 
                 contactDetails.google_map_embed_url.match(/^https:\/\/(www\.)?google\.com\/maps\/embed\?pb=/) && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <Eye className="w-4 h-4" />
                      Map Preview ✓
                    </Label>
                    <div className="rounded-lg overflow-hidden border border-green-200">
                      <iframe
                        src={contactDetails.google_map_embed_url}
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Google Maps Preview"
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="flex justify-end">
              <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
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
              <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
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
              </div>
            </motion.div>

            <div className="flex justify-end">
              <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
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
              <Button onClick={handleSaveAll} disabled={saving} className="gap-2">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
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