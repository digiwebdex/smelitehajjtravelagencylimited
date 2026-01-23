import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, GripVertical, Video, Upload } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PhoneSection {
  id: string;
  phones: string; // Two phone numbers comma-separated
}

interface SortablePhoneSectionProps {
  section: PhoneSection;
  index: number;
  totalSections: number;
  onUpdate: (id: string, value: string) => void;
  onRemove: (id: string) => void;
}

const SortablePhoneSection = ({ section, index, totalSections, onUpdate, onRemove }: SortablePhoneSectionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Label: 1st Section #1 for index 0, 2nd Section #1 for index 1, 2nd Section #2 for index 2, etc.
  const sectionLabel = index === 0 ? "1st Section #1" : `2nd Section #${index}`;

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-center">
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </button>
      <span className={`text-xs font-medium w-28 flex-shrink-0 ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
        {sectionLabel}
      </span>
      <Input 
        value={section.phones} 
        onChange={(e) => onUpdate(section.id, e.target.value)} 
        placeholder="+8801234567890, +8809876543210" 
        className="flex-1" 
      />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => onRemove(section.id)}
        disabled={totalSections === 1}
      >
        <Trash2 className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  );
};

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
  contact_phones: string[]; // Now stores sections, each section is "phone1, phone2"
  contact_email: string;
  video_url: string;
  video_opacity: number;
  video_enabled: boolean;
}

const AdminFooter = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
    contact_phones: [], // Stores sections as strings
    contact_email: "",
    video_url: "",
    video_opacity: 60,
    video_enabled: true,
  });
  const [videoUploading, setVideoUploading] = useState(false);

  // Generate unique IDs for phone sections (for drag-and-drop)
  const [phoneSections, setPhoneSections] = useState<PhoneSection[]>([]);

  // Sync phoneSections when footerContent.contact_phones changes
  useEffect(() => {
    const phones = footerContent.contact_phones;
    if (phones.length === 0) {
      setPhoneSections([{ id: `section-${Date.now()}`, phones: "" }]);
    } else {
      setPhoneSections(phones.map((p, i) => ({ id: `section-${i}-${Date.now()}`, phones: p })));
    }
  }, [footerContent.id]); // Only sync on initial load

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    const { data, error } = await supabase.from("footer_content").select("*").limit(1).maybeSingle();
    
    if (!error && data) {
      const dataRecord = data as Record<string, unknown>;
      setFooterContent({
        id: data.id,
        company_description: data.company_description || "",
        quick_links: Array.isArray(data.quick_links) ? (data.quick_links as unknown as FooterLink[]) : [],
        services_links: Array.isArray(data.services_links) ? (data.services_links as unknown as FooterLink[]) : [],
        social_links: Array.isArray(data.social_links) ? (data.social_links as unknown as SocialLink[]) : [],
        copyright_text: data.copyright_text || "",
        contact_address: dataRecord.contact_address as string || "",
        contact_address_2: dataRecord.contact_address_2 as string || "",
        address_label_1: dataRecord.address_label_1 as string || "Head Office",
        address_label_2: dataRecord.address_label_2 as string || "Branch Office",
        contact_phones: Array.isArray(dataRecord.contact_phones) ? dataRecord.contact_phones as string[] : [""],
        contact_email: dataRecord.contact_email as string || "",
        video_url: dataRecord.video_url as string || "",
        video_opacity: (dataRecord.video_opacity as number) ?? 60,
        video_enabled: (dataRecord.video_enabled as boolean) ?? true,
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Convert phoneSections back to array of strings for storage
    const phonesArray = phoneSections.map(s => s.phones).filter(p => p.trim() !== "");
    
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
      contact_phones: phonesArray,
      contact_email: footerContent.contact_email,
      video_url: footerContent.video_url,
      video_opacity: footerContent.video_opacity,
      video_enabled: footerContent.video_enabled,
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({ title: "Error", description: "Please upload a video file", variant: "destructive" });
      return;
    }

    setVideoUploading(true);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `footer-video-${Date.now()}.${fileExt}`;
    const filePath = `footer/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('site-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
      setVideoUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('site-assets')
      .getPublicUrl(filePath);

    setFooterContent(prev => ({ ...prev, video_url: urlData.publicUrl }));
    toast({ title: "Success", description: "Video uploaded successfully" });
    setVideoUploading(false);
  };

  const addQuickLink = () => setFooterContent({ ...footerContent, quick_links: [...footerContent.quick_links, { label: "", href: "" }] });
  const addServiceLink = () => setFooterContent({ ...footerContent, services_links: [...footerContent.services_links, { label: "", href: "" }] });
  const addSocialLink = () => setFooterContent({ ...footerContent, social_links: [...footerContent.social_links, { platform: "", url: "" }] });
  
  const addPhoneSection = () => {
    setPhoneSections([...phoneSections, { id: `section-${Date.now()}`, phones: "" }]);
  };

  const updatePhoneSection = (id: string, value: string) => {
    setPhoneSections(phoneSections.map(s => s.id === id ? { ...s, phones: value } : s));
  };

  const removePhoneSection = (id: string) => {
    setPhoneSections(phoneSections.filter(s => s.id !== id));
  };

  const handlePhoneDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = phoneSections.findIndex(s => s.id === active.id);
      const newIndex = phoneSections.findIndex(s => s.id === over.id);
      setPhoneSections(arrayMove(phoneSections, oldIndex, newIndex));
    }
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
        {/* Background Video Settings */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Background Video</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="video-enabled" className="text-sm font-medium">Enable Video Background</Label>
            <Switch
              id="video-enabled"
              checked={footerContent.video_enabled}
              onCheckedChange={(checked) => setFooterContent({ ...footerContent, video_enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Video File</label>
            <div className="flex gap-2">
              <Input
                value={footerContent.video_url}
                onChange={(e) => setFooterContent({ ...footerContent, video_url: e.target.value })}
                placeholder="Video URL or upload a file"
                className="flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Button type="button" variant="outline" disabled={videoUploading} asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    {videoUploading ? "Uploading..." : "Upload"}
                  </span>
                </Button>
              </label>
            </div>
            {footerContent.video_url && (
              <div className="mt-2 rounded-lg overflow-hidden border">
                <video 
                  src={footerContent.video_url} 
                  className="w-full h-32 object-cover"
                  muted
                  loop
                  autoPlay
                  playsInline
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium">Video Opacity</label>
              <span className="text-sm text-muted-foreground">{footerContent.video_opacity}%</span>
            </div>
            <Slider
              value={[footerContent.video_opacity]}
              onValueChange={(value) => setFooterContent({ ...footerContent, video_opacity: value[0] })}
              min={10}
              max={100}
              step={5}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Lower values make the video more subtle</p>
          </div>
        </div>

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
                <label className="text-sm font-medium">Phone Number Sections</label>
                <Button type="button" variant="outline" size="sm" onClick={addPhoneSection}>
                  <Plus className="w-4 h-4 mr-1" />Add Section
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Each section contains two phone numbers separated by comma. First section appears as primary contact.
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePhoneDragEnd}>
                <SortableContext items={phoneSections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {phoneSections.map((section, index) => (
                      <SortablePhoneSection
                        key={section.id}
                        section={section}
                        index={index}
                        totalSections={phoneSections.length}
                        onUpdate={updatePhoneSection}
                        onRemove={removePhoneSection}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
