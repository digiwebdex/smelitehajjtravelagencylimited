import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface SocialLink {
  platform: string;
  url: string;
}

interface FooterContent {
  id: string;
  company_description: string;
  quick_links: FooterLink[];
  services_links: FooterLink[];
  social_links: SocialLink[];
  copyright_text: string;
  contact_address: string;
  contact_address_2: string;
  address_label_1: string;
  address_label_2: string;
  contact_phones: string[];
  contact_email: string;
}

const AdminFooter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [footerContent, setFooterContent] = useState<FooterContent>({
    id: "",
    company_description: "",
    quick_links: [],
    services_links: [],
    social_links: [],
    copyright_text: "",
    contact_address: "",
    contact_address_2: "",
    address_label_1: "Head Office",
    address_label_2: "Branch Office",
    contact_phones: [""],
    contact_email: "",
  });

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    const { data, error } = await supabase.from("footer_content").select("*").limit(1).maybeSingle();
    
    if (!error && data) {
      setFooterContent({
        id: data.id,
        company_description: data.company_description || "",
        quick_links: Array.isArray(data.quick_links) ? (data.quick_links as unknown as FooterLink[]) : [],
        services_links: Array.isArray(data.services_links) ? (data.services_links as unknown as FooterLink[]) : [],
        social_links: Array.isArray(data.social_links) ? (data.social_links as unknown as SocialLink[]) : [],
        copyright_text: data.copyright_text || "",
        contact_address: (data as any).contact_address || "",
        contact_address_2: (data as any).contact_address_2 || "",
        address_label_1: (data as any).address_label_1 || "Head Office",
        address_label_2: (data as any).address_label_2 || "Branch Office",
        contact_phones: Array.isArray((data as any).contact_phones) ? (data as any).contact_phones : [""],
        contact_email: (data as any).contact_email || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const payload = {
      company_description: footerContent.company_description,
      quick_links: footerContent.quick_links as unknown as null,
      services_links: footerContent.services_links as unknown as null,
      social_links: footerContent.social_links as unknown as null,
      copyright_text: footerContent.copyright_text,
      contact_address: footerContent.contact_address,
      contact_address_2: footerContent.contact_address_2,
      address_label_1: footerContent.address_label_1,
      address_label_2: footerContent.address_label_2,
      contact_phones: footerContent.contact_phones.filter(p => p.trim() !== ""),
      contact_email: footerContent.contact_email,
    };

    let error;
    if (footerContent.id) {
      const result = await supabase.from("footer_content").update(payload).eq("id", footerContent.id);
      error = result.error;
    } else {
      const result = await supabase.from("footer_content").insert(payload).select().single();
      error = result.error;
      if (!error && result.data) {
        setFooterContent(prev => ({ ...prev, id: result.data.id }));
      }
    }

    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Success", description: "Footer updated" });
    setSaving(false);
  };

  const addQuickLink = () => setFooterContent({ ...footerContent, quick_links: [...footerContent.quick_links, { label: "", href: "" }] });
  const addServiceLink = () => setFooterContent({ ...footerContent, services_links: [...footerContent.services_links, { label: "", href: "" }] });
  const addSocialLink = () => setFooterContent({ ...footerContent, social_links: [...footerContent.social_links, { platform: "", url: "" }] });
  const addPhone = () => setFooterContent({ ...footerContent, contact_phones: [...footerContent.contact_phones, ""] });

  const updatePhone = (index: number, value: string) => {
    const newPhones = [...footerContent.contact_phones];
    newPhones[index] = value;
    setFooterContent({ ...footerContent, contact_phones: newPhones });
  };

  const removePhone = (index: number) => {
    setFooterContent({ ...footerContent, contact_phones: footerContent.contact_phones.filter((_, i) => i !== index) });
  };

  const updateQuickLink = (index: number, field: keyof FooterLink, value: string) => {
    const newLinks = [...footerContent.quick_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFooterContent({ ...footerContent, quick_links: newLinks });
  };

  const updateServiceLink = (index: number, field: keyof FooterLink, value: string) => {
    const newLinks = [...footerContent.services_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFooterContent({ ...footerContent, services_links: newLinks });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: string) => {
    const newLinks = [...footerContent.social_links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setFooterContent({ ...footerContent, social_links: newLinks });
  };

  if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Footer Section</CardTitle>
        <CardDescription>Manage footer content, links, and social media</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium">Company Description</label>
          <Textarea
            value={footerContent.company_description}
            onChange={(e) => setFooterContent({ ...footerContent, company_description: e.target.value })}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Copyright Text</label>
          <Input
            value={footerContent.copyright_text}
            onChange={(e) => setFooterContent({ ...footerContent, copyright_text: e.target.value })}
            placeholder="© 2024 Your Company. All rights reserved."
          />
        </div>

        {/* Quick Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Quick Links</label>
            <Button type="button" variant="outline" size="sm" onClick={addQuickLink}>
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {footerContent.quick_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input value={link.label} onChange={(e) => updateQuickLink(index, "label", e.target.value)} placeholder="Label" className="flex-1" />
                <Input value={link.href} onChange={(e) => updateQuickLink(index, "href", e.target.value)} placeholder="Link" className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setFooterContent({ ...footerContent, quick_links: footerContent.quick_links.filter((_, i) => i !== index) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Services Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Services Links</label>
            <Button type="button" variant="outline" size="sm" onClick={addServiceLink}>
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {footerContent.services_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input value={link.label} onChange={(e) => updateServiceLink(index, "label", e.target.value)} placeholder="Label" className="flex-1" />
                <Input value={link.href} onChange={(e) => updateServiceLink(index, "href", e.target.value)} placeholder="Link" className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setFooterContent({ ...footerContent, services_links: footerContent.services_links.filter((_, i) => i !== index) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Social Links</label>
            <Button type="button" variant="outline" size="sm" onClick={addSocialLink}>
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="space-y-2">
            {footerContent.social_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input value={link.platform} onChange={(e) => updateSocialLink(index, "platform", e.target.value)} placeholder="Platform (Facebook, Instagram, etc.)" className="w-40" />
                <Input value={link.url} onChange={(e) => updateSocialLink(index, "url", e.target.value)} placeholder="URL" className="flex-1" />
                <Button variant="ghost" size="icon" onClick={() => setFooterContent({ ...footerContent, social_links: footerContent.social_links.filter((_, i) => i !== index) })}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Address 1 Label</label>
                <Input
                  value={footerContent.address_label_1}
                  onChange={(e) => setFooterContent({ ...footerContent, address_label_1: e.target.value })}
                  placeholder="Head Office"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address 1</label>
                <Input
                  value={footerContent.contact_address}
                  onChange={(e) => setFooterContent({ ...footerContent, contact_address: e.target.value })}
                  placeholder="Primary address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="text-sm font-medium">Address 2 Label</label>
                <Input
                  value={footerContent.address_label_2}
                  onChange={(e) => setFooterContent({ ...footerContent, address_label_2: e.target.value })}
                  placeholder="Branch Office"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Address 2</label>
                <Input
                  value={footerContent.contact_address_2}
                  onChange={(e) => setFooterContent({ ...footerContent, contact_address_2: e.target.value })}
                  placeholder="Secondary address (optional)"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Phone Numbers</label>
                <Button type="button" variant="outline" size="sm" onClick={addPhone}>
                  <Plus className="w-4 h-4 mr-1" />Add Phone
                </Button>
              </div>
              <div className="space-y-2">
                {footerContent.contact_phones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      value={phone} 
                      onChange={(e) => updatePhone(index, e.target.value)} 
                      placeholder="+880 1234-567890" 
                      className="flex-1" 
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removePhone(index)}
                      disabled={footerContent.contact_phones.length === 1}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={footerContent.contact_email}
                onChange={(e) => setFooterContent({ ...footerContent, contact_email: e.target.value })}
                placeholder="info@smelitehajj.com"
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminFooter;
