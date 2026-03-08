import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, RefreshCw, Search, Globe, Image, FileText, Code, ExternalLink, CheckCircle2 } from "lucide-react";
import { AdminActionButton } from "./AdminActionButton";
import ImageUpload from "./ImageUpload";
import { useImageUpload } from "@/hooks/useImageUpload";

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  og_url: string;
  twitter_card: string;
  twitter_site: string;
  twitter_image: string;
  canonical_url: string;
  favicon_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  json_ld_enabled: boolean;
  json_ld_business_name: string;
  json_ld_business_type: string;
  json_ld_phone: string;
  json_ld_email: string;
  json_ld_address: string;
  json_ld_city: string;
  json_ld_country: string;
  json_ld_logo: string;
  google_site_verification: string;
  bing_site_verification: string;
}

const defaultSEO: SEOSettings = {
  site_title: "S. M. Elite Hajj Limited | Hajj & Umrah Services",
  site_description: "Your trusted partner for Hajj & Umrah journeys. Government approved agency providing premium packages with comprehensive services.",
  site_keywords: "hajj, umrah, hajj packages, umrah packages, bangladesh hajj agency, makkah, medina, pilgrimage",
  og_title: "",
  og_description: "",
  og_image: "",
  og_type: "website",
  og_url: "",
  twitter_card: "summary_large_image",
  twitter_site: "",
  twitter_image: "",
  canonical_url: "",
  favicon_url: "",
  robots_index: true,
  robots_follow: true,
  json_ld_enabled: true,
  json_ld_business_name: "S. M. Elite Hajj Limited",
  json_ld_business_type: "TravelAgency",
  json_ld_phone: "",
  json_ld_email: "",
  json_ld_address: "",
  json_ld_city: "Dhaka",
  json_ld_country: "BD",
  json_ld_logo: "",
  google_site_verification: "",
  bing_site_verification: "",
};

const AdminSEO = () => {
  const [seo, setSeo] = useState<SEOSettings>(defaultSEO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "seo",
  });

  useEffect(() => {
    fetchSEO();
  }, []);

  const fetchSEO = async () => {
    try {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "seo_settings")
        .maybeSingle();

      if (data?.setting_value) {
        setSeo({ ...defaultSEO, ...(data.setting_value as unknown as SEOSettings) });
      }
    } catch (e) {
      console.error("Error fetching SEO settings:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "seo_settings")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ setting_value: seo as unknown as Json, category: "seo" })
          .eq("setting_key", "seo_settings");
      } else {
        await supabase
          .from("site_settings")
          .insert({ setting_key: "seo_settings", setting_value: seo as unknown as Json, category: "seo" });
      }
      toast.success("SEO settings saved successfully!");
    } catch (e) {
      console.error("Error saving SEO:", e);
      toast.error("Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            SEO Settings
          </CardTitle>
          <CardDescription>
            Optimize your website for search engines. These settings affect how your site appears in Google, Bing, and social media shares.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Social / OG</span>
          </TabsTrigger>
          <TabsTrigger value="structured" className="gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Structured Data</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Advanced</span>
          </TabsTrigger>
        </TabsList>

        {/* General SEO */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title (Title Tag)</Label>
                <Input
                  id="siteTitle"
                  value={seo.site_title}
                  onChange={(e) => setSeo({ ...seo, site_title: e.target.value })}
                  placeholder="Your Site Title | Brand Name"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{seo.site_title.length}/60 characters — Keep under 60 for best display in search results</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDesc">Meta Description</Label>
                <Textarea
                  id="siteDesc"
                  value={seo.site_description}
                  onChange={(e) => setSeo({ ...seo, site_description: e.target.value })}
                  placeholder="A compelling description of your website..."
                  rows={3}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{seo.site_description.length}/160 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Meta Keywords</Label>
                <Input
                  id="keywords"
                  value={seo.site_keywords}
                  onChange={(e) => setSeo({ ...seo, site_keywords: e.target.value })}
                  placeholder="hajj, umrah, travel, pilgrimage"
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords relevant to your business</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  value={seo.canonical_url}
                  onChange={(e) => setSeo({ ...seo, canonical_url: e.target.value })}
                  placeholder="https://smelitehajj.com/"
                />
              </div>

              <div className="space-y-2">
                <Label>Favicon</Label>
                <ImageUpload
                  value={seo.favicon_url}
                  onChange={(url) => setSeo({ ...seo, favicon_url: url })}
                  onUpload={uploadImage}
                  uploading={uploading}
                  label=""
                  placeholder="https://example.com/favicon.ico"
                />
              </div>

              {/* Google Search Preview */}
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Search className="w-3 h-3" /> Google Search Preview
                  </p>
                  <div className="space-y-1">
                    <p className="text-primary text-lg font-medium truncate">{seo.site_title || "Your Site Title"}</p>
                    <p className="text-xs text-green-700 truncate">{seo.canonical_url || "https://yoursite.com"}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{seo.site_description || "Your site description will appear here..."}</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social / Open Graph */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <p className="text-sm text-muted-foreground">Configure how your site appears when shared on Facebook, Twitter, LinkedIn, and WhatsApp. Leave blank to use general SEO values.</p>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>OG Title</Label>
                  <Input
                    value={seo.og_title}
                    onChange={(e) => setSeo({ ...seo, og_title: e.target.value })}
                    placeholder={seo.site_title || "Falls back to site title"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>OG Type</Label>
                  <Input
                    value={seo.og_type}
                    onChange={(e) => setSeo({ ...seo, og_type: e.target.value })}
                    placeholder="website"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>OG Description</Label>
                <Textarea
                  value={seo.og_description}
                  onChange={(e) => setSeo({ ...seo, og_description: e.target.value })}
                  placeholder={seo.site_description || "Falls back to meta description"}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>OG Image (1200×630 recommended)</Label>
                <ImageUpload
                  value={seo.og_image}
                  onChange={(url) => setSeo({ ...seo, og_image: url })}
                  onUpload={uploadImage}
                  uploading={uploading}
                  label=""
                  placeholder="https://example.com/og-image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label>OG URL</Label>
                <Input
                  value={seo.og_url}
                  onChange={(e) => setSeo({ ...seo, og_url: e.target.value })}
                  placeholder="https://smelitehajj.com/"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Twitter Card Type</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-background px-4 text-sm"
                    value={seo.twitter_card}
                    onChange={(e) => setSeo({ ...seo, twitter_card: e.target.value })}
                  >
                    <option value="summary">Summary</option>
                    <option value="summary_large_image">Summary with Large Image</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Twitter @handle</Label>
                  <Input
                    value={seo.twitter_site}
                    onChange={(e) => setSeo({ ...seo, twitter_site: e.target.value })}
                    placeholder="@smelitehajj"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Twitter Image</Label>
                <ImageUpload
                  value={seo.twitter_image}
                  onChange={(url) => setSeo({ ...seo, twitter_image: url })}
                  onUpload={uploadImage}
                  uploading={uploading}
                  label=""
                  placeholder="https://example.com/twitter-image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Structured Data / JSON-LD */}
        <TabsContent value="structured" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable JSON-LD Structured Data</Label>
                  <p className="text-sm text-muted-foreground">Helps Google display rich results for your business</p>
                </div>
                <Switch
                  checked={seo.json_ld_enabled}
                  onCheckedChange={(checked) => setSeo({ ...seo, json_ld_enabled: checked })}
                />
              </div>

              {seo.json_ld_enabled && (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Business Name</Label>
                      <Input
                        value={seo.json_ld_business_name}
                        onChange={(e) => setSeo({ ...seo, json_ld_business_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Type</Label>
                      <select
                        className="w-full h-10 rounded-lg border border-input bg-background px-4 text-sm"
                        value={seo.json_ld_business_type}
                        onChange={(e) => setSeo({ ...seo, json_ld_business_type: e.target.value })}
                      >
                        <option value="TravelAgency">Travel Agency</option>
                        <option value="Organization">Organization</option>
                        <option value="LocalBusiness">Local Business</option>
                        <option value="ProfessionalService">Professional Service</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={seo.json_ld_phone}
                        onChange={(e) => setSeo({ ...seo, json_ld_phone: e.target.value })}
                        placeholder="+880-1867-666888"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={seo.json_ld_email}
                        onChange={(e) => setSeo({ ...seo, json_ld_email: e.target.value })}
                        placeholder="info@smelitehajj.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Street Address</Label>
                    <Input
                      value={seo.json_ld_address}
                      onChange={(e) => setSeo({ ...seo, json_ld_address: e.target.value })}
                      placeholder="123 Main Street"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={seo.json_ld_city}
                        onChange={(e) => setSeo({ ...seo, json_ld_city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country Code</Label>
                      <Input
                        value={seo.json_ld_country}
                        onChange={(e) => setSeo({ ...seo, json_ld_country: e.target.value })}
                        placeholder="BD"
                        maxLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Logo URL (for structured data)</Label>
                    <ImageUpload
                      value={seo.json_ld_logo}
                      onChange={(url) => setSeo({ ...seo, json_ld_logo: url })}
                      onUpload={uploadImage}
                      uploading={uploading}
                      label=""
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  {/* JSON-LD Preview */}
                  <Card className="bg-muted/50 border-dashed">
                    <CardContent className="pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                        <Code className="w-3 h-3" /> JSON-LD Preview
                      </p>
                      <pre className="text-xs font-mono bg-background p-3 rounded-lg overflow-x-auto max-h-48">
                        {JSON.stringify({
                          "@context": "https://schema.org",
                          "@type": seo.json_ld_business_type,
                          name: seo.json_ld_business_name,
                          telephone: seo.json_ld_phone,
                          email: seo.json_ld_email,
                          address: {
                            "@type": "PostalAddress",
                            streetAddress: seo.json_ld_address,
                            addressLocality: seo.json_ld_city,
                            addressCountry: seo.json_ld_country,
                          },
                          logo: seo.json_ld_logo,
                          url: seo.canonical_url || seo.og_url,
                        }, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Allow Search Indexing</Label>
                    <p className="text-sm text-muted-foreground">Let search engines index your site</p>
                  </div>
                  <Switch
                    checked={seo.robots_index}
                    onCheckedChange={(checked) => setSeo({ ...seo, robots_index: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Label className="text-base">Allow Link Following</Label>
                    <p className="text-sm text-muted-foreground">Let search engines follow your links</p>
                  </div>
                  <Switch
                    checked={seo.robots_follow}
                    onCheckedChange={(checked) => setSeo({ ...seo, robots_follow: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Google Site Verification</Label>
                <Input
                  value={seo.google_site_verification}
                  onChange={(e) => setSeo({ ...seo, google_site_verification: e.target.value })}
                  placeholder="Google verification code"
                />
                <p className="text-xs text-muted-foreground">Paste the content value from Google Search Console meta tag</p>
              </div>

              <div className="space-y-2">
                <Label>Bing Site Verification</Label>
                <Input
                  value={seo.bing_site_verification}
                  onChange={(e) => setSeo({ ...seo, bing_site_verification: e.target.value })}
                  placeholder="Bing verification code"
                />
              </div>

              {/* SEO Checklist */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-4">
                  <h4 className="font-medium text-sm mb-3">SEO Health Check</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Site title set", ok: seo.site_title.length > 0 },
                      { label: "Meta description set", ok: seo.site_description.length > 0 },
                      { label: "Title under 60 chars", ok: seo.site_title.length <= 60 },
                      { label: "Description under 160 chars", ok: seo.site_description.length <= 160 },
                      { label: "OG image configured", ok: !!seo.og_image },
                      { label: "Canonical URL set", ok: !!seo.canonical_url },
                      { label: "Structured data enabled", ok: seo.json_ld_enabled },
                      { label: "Search indexing enabled", ok: seo.robots_index },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 ${item.ok ? "text-primary" : "text-muted-foreground/40"}`} />
                        <span className={item.ok ? "" : "text-muted-foreground"}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <AdminActionButton onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save SEO Settings
        </AdminActionButton>
      </div>
    </div>
  );
};

export default AdminSEO;
