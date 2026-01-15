import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2 } from "lucide-react";

interface HeroContent {
  id: string;
  badge_text: string;
  title: string;
  subtitle: string;
  description: string;
  primary_button_text: string;
  primary_button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  background_image_url: string;
  video_url: string;
  stats: { number: string; label: string }[];
}

const AdminHero = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroContent, setHeroContent] = useState<HeroContent>({
    id: "",
    badge_text: "Govt. Approved Hajj & Umrah Agency",
    title: "Your Sacred Journey",
    subtitle: "Begins Here",
    description: "Experience the spiritual journey of a lifetime with SM Elite Hajj.",
    primary_button_text: "Explore Hajj Packages",
    primary_button_link: "#hajj",
    secondary_button_text: "View Umrah Packages",
    secondary_button_link: "#umrah",
    background_image_url: "",
    video_url: "",
    stats: [
      { number: "10+", label: "Years Experience" },
      { number: "5000+", label: "Happy Pilgrims" },
      { number: "100%", label: "Satisfaction Rate" },
      { number: "24/7", label: "Support Available" },
    ],
  });

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    const { data, error } = await supabase
      .from("hero_content")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    
    if (!error && data) {
      setHeroContent({
        ...data,
        video_url: data.video_url || "",
        stats: Array.isArray(data.stats) ? data.stats as { number: string; label: string }[] : [],
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    
    const payload = {
      badge_text: heroContent.badge_text,
      title: heroContent.title,
      subtitle: heroContent.subtitle,
      description: heroContent.description,
      primary_button_text: heroContent.primary_button_text,
      primary_button_link: heroContent.primary_button_link,
      secondary_button_text: heroContent.secondary_button_text,
      secondary_button_link: heroContent.secondary_button_link,
      background_image_url: heroContent.background_image_url,
      video_url: heroContent.video_url,
      stats: heroContent.stats,
      is_active: true,
    };

    let error;
    if (heroContent.id) {
      const result = await supabase
        .from("hero_content")
        .update(payload)
        .eq("id", heroContent.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("hero_content")
        .insert(payload)
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        setHeroContent(prev => ({ ...prev, id: result.data.id }));
      }
    }

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Hero section updated" });
    }
    setSaving(false);
  };

  const updateStat = (index: number, field: "number" | "label", value: string) => {
    const newStats = [...heroContent.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setHeroContent({ ...heroContent, stats: newStats });
  };

  const addStat = () => {
    setHeroContent({
      ...heroContent,
      stats: [...heroContent.stats, { number: "", label: "" }],
    });
  };

  const removeStat = (index: number) => {
    setHeroContent({
      ...heroContent,
      stats: heroContent.stats.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section</CardTitle>
        <CardDescription>Edit the main banner content on your homepage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Badge Text</label>
            <Input
              value={heroContent.badge_text}
              onChange={(e) => setHeroContent({ ...heroContent, badge_text: e.target.value })}
              placeholder="e.g., Govt. Approved Agency"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Background Image URL</label>
            <Input
              value={heroContent.background_image_url}
              onChange={(e) => setHeroContent({ ...heroContent, background_image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Journey Video URL (YouTube or Direct Link)</label>
          <Input
            value={heroContent.video_url}
            onChange={(e) => setHeroContent({ ...heroContent, video_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=... or https://example.com/video.mp4"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Add a YouTube video link or direct video URL for the "Watch Our Journey Video" button
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Main Title</label>
            <Input
              value={heroContent.title}
              onChange={(e) => setHeroContent({ ...heroContent, title: e.target.value })}
              placeholder="Your Sacred Journey"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Subtitle (Highlighted)</label>
            <Input
              value={heroContent.subtitle}
              onChange={(e) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
              placeholder="Begins Here"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea
            value={heroContent.description}
            onChange={(e) => setHeroContent({ ...heroContent, description: e.target.value })}
            placeholder="Brief description..."
            rows={3}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Button</label>
            <Input
              value={heroContent.primary_button_text}
              onChange={(e) => setHeroContent({ ...heroContent, primary_button_text: e.target.value })}
              placeholder="Button text"
            />
            <Input
              value={heroContent.primary_button_link}
              onChange={(e) => setHeroContent({ ...heroContent, primary_button_link: e.target.value })}
              placeholder="Link (e.g., #hajj)"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Secondary Button</label>
            <Input
              value={heroContent.secondary_button_text}
              onChange={(e) => setHeroContent({ ...heroContent, secondary_button_text: e.target.value })}
              placeholder="Button text"
            />
            <Input
              value={heroContent.secondary_button_link}
              onChange={(e) => setHeroContent({ ...heroContent, secondary_button_link: e.target.value })}
              placeholder="Link"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Stats</label>
            <Button type="button" variant="outline" size="sm" onClick={addStat}>
              <Plus className="w-4 h-4 mr-1" />Add Stat
            </Button>
          </div>
          <div className="space-y-2">
            {heroContent.stats.map((stat, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={stat.number}
                  onChange={(e) => updateStat(index, "number", e.target.value)}
                  placeholder="10+"
                  className="w-32"
                />
                <Input
                  value={stat.label}
                  onChange={(e) => updateStat(index, "label", e.target.value)}
                  placeholder="Years Experience"
                  className="flex-1"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(index)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
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

export default AdminHero;
