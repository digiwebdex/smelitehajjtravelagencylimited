import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageUpload } from "@/hooks/useImageUpload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Plus, Trash2 } from "lucide-react";
import ImageUpload from "./ImageUpload";

interface Stat {
  value: string;
  label: string;
}

interface SectionData {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  image_url: string | null;
  stats: Stat[];
  success_rate: string;
  is_active: boolean;
}

const AdminPackageSections = () => {
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "sections",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hajjData, setHajjData] = useState<SectionData | null>(null);
  const [umrahData, setUmrahData] = useState<SectionData | null>(null);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("section_settings")
      .select("*")
      .in("section_key", ["hajj_packages", "umrah_packages"]);

    if (error) {
      toast({ title: "Error fetching sections", variant: "destructive" });
      setLoading(false);
      return;
    }

    const hajj = data?.find(d => d.section_key === "hajj_packages");
    const umrah = data?.find(d => d.section_key === "umrah_packages");

    if (hajj) {
      setHajjData({
        id: hajj.id,
        section_key: hajj.section_key,
        title: hajj.title || "",
        subtitle: hajj.subtitle || "",
        description: hajj.description || "",
        badge_text: (hajj as any).badge_text || "",
        image_url: (hajj as any).image_url || null,
        stats: (hajj as any).stats || [],
        success_rate: (hajj as any).success_rate || "100%",
        is_active: hajj.is_active
      });
    }

    if (umrah) {
      setUmrahData({
        id: umrah.id,
        section_key: umrah.section_key,
        title: umrah.title || "",
        subtitle: umrah.subtitle || "",
        description: umrah.description || "",
        badge_text: (umrah as any).badge_text || "",
        image_url: (umrah as any).image_url || null,
        stats: (umrah as any).stats || [],
        success_rate: (umrah as any).success_rate || "100%",
        is_active: umrah.is_active
      });
    }

    setLoading(false);
  };

  const handleSave = async (sectionData: SectionData) => {
    setSaving(true);
    const { error } = await supabase
      .from("section_settings")
      .update({
        title: sectionData.title,
        subtitle: sectionData.subtitle,
        description: sectionData.description,
        badge_text: sectionData.badge_text,
        image_url: sectionData.image_url,
        stats: sectionData.stats,
        success_rate: sectionData.success_rate,
        is_active: sectionData.is_active
      } as any)
      .eq("id", sectionData.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error saving section", variant: "destructive" });
    } else {
      toast({ title: "Section saved successfully" });
    }
  };

  const handleImageUpload = async (file: File, section: "hajj" | "umrah") => {
    const url = await uploadImage(file);
    if (url) {
      if (section === "hajj" && hajjData) {
        setHajjData({ ...hajjData, image_url: url });
      } else if (section === "umrah" && umrahData) {
        setUmrahData({ ...umrahData, image_url: url });
      }
    }
  };

  const addStat = (section: "hajj" | "umrah") => {
    const newStat = { value: "", label: "" };
    if (section === "hajj" && hajjData) {
      setHajjData({ ...hajjData, stats: [...hajjData.stats, newStat] });
    } else if (section === "umrah" && umrahData) {
      setUmrahData({ ...umrahData, stats: [...umrahData.stats, newStat] });
    }
  };

  const updateStat = (section: "hajj" | "umrah", index: number, field: "value" | "label", value: string) => {
    if (section === "hajj" && hajjData) {
      const newStats = [...hajjData.stats];
      newStats[index][field] = value;
      setHajjData({ ...hajjData, stats: newStats });
    } else if (section === "umrah" && umrahData) {
      const newStats = [...umrahData.stats];
      newStats[index][field] = value;
      setUmrahData({ ...umrahData, stats: newStats });
    }
  };

  const removeStat = (section: "hajj" | "umrah", index: number) => {
    if (section === "hajj" && hajjData) {
      setHajjData({ ...hajjData, stats: hajjData.stats.filter((_, i) => i !== index) });
    } else if (section === "umrah" && umrahData) {
      setUmrahData({ ...umrahData, stats: umrahData.stats.filter((_, i) => i !== index) });
    }
  };

  const renderSectionForm = (data: SectionData | null, section: "hajj" | "umrah") => {
    if (!data) return <p className="text-muted-foreground">No data found for this section.</p>;

    const setData = section === "hajj" ? setHajjData : setUmrahData;

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={data.title}
              onChange={(e) => setData({ ...data, title: e.target.value })}
              placeholder="e.g., Hajj Packages 2026"
            />
          </div>
          <div className="space-y-2">
            <Label>Badge Text</Label>
            <Input
              value={data.badge_text}
              onChange={(e) => setData({ ...data, badge_text: e.target.value })}
              placeholder="e.g., Hajj Packages"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Subtitle (Arabic)</Label>
          <Input
            value={data.subtitle}
            onChange={(e) => setData({ ...data, subtitle: e.target.value })}
            placeholder="e.g., حج"
            className="font-arabic text-right"
            dir="rtl"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Enter section description..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Success Rate</Label>
            <Input
              value={data.success_rate}
              onChange={(e) => setData({ ...data, success_rate: e.target.value })}
              placeholder="e.g., 100%"
            />
            <p className="text-xs text-muted-foreground">Displayed on the floating badge</p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Section Image</Label>
          <ImageUpload
            value={data.image_url || ""}
            onChange={(url) => setData({ ...data, image_url: url })}
            onUpload={(file) => uploadImage(file)}
            uploading={uploading}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Statistics</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addStat(section)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Stat
            </Button>
          </div>
          
          {data.stats.map((stat, index) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  value={stat.value}
                  onChange={(e) => updateStat(section, index, "value", e.target.value)}
                  placeholder="Value (e.g., 10+)"
                />
              </div>
              <div className="flex-[2]">
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(section, index, "label", e.target.value)}
                  placeholder="Label (e.g., Years Experience)"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => removeStat(section, index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button
          onClick={() => handleSave(data)}
          disabled={saving}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading sections...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Section Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hajj">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="hajj">Hajj Section</TabsTrigger>
            <TabsTrigger value="umrah">Umrah Section</TabsTrigger>
          </TabsList>
          
          <TabsContent value="hajj">
            {renderSectionForm(hajjData, "hajj")}
          </TabsContent>
          
          <TabsContent value="umrah">
            {renderSectionForm(umrahData, "umrah")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPackageSections;
