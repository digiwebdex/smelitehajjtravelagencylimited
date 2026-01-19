import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Image as ImageIcon, Settings, Timer, Zap, LayoutTemplate, Columns, AlignCenter } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ImageUpload from "./ImageUpload";
import { useImageUpload } from "@/hooks/useImageUpload";

interface HeroSlide {
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
  slide_type: string;
  order_index: number;
  is_active: boolean;
}

interface SliderSettings {
  autoplayInterval: string;
  transitionSpeed: string;
  layoutMode: "centered" | "split-screen";
}

const defaultSlide: Omit<HeroSlide, "id"> = {
  badge_text: "",
  title: "New Slide",
  subtitle: "",
  description: "",
  primary_button_text: "Explore Packages",
  primary_button_link: "#hajj",
  secondary_button_text: "Contact Us",
  secondary_button_link: "#contact",
  background_image_url: "",
  video_url: "",
  stats: [],
  slide_type: "general",
  order_index: 0,
  is_active: true,
};

const AdminHero = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [openSlides, setOpenSlides] = useState<Set<string>>(new Set());
  const [sliderSettings, setSliderSettings] = useState<SliderSettings>({
    autoplayInterval: "6",
    transitionSpeed: "normal",
    layoutMode: "split-screen",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const { uploadImage, uploading } = useImageUpload({
    bucket: "admin-uploads",
    folder: "hero-banners",
  });

  useEffect(() => {
    fetchSlides();
    fetchSliderSettings();
  }, []);

  const fetchSliderSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["hero_autoplay_interval", "hero_transition_speed", "hero_layout_mode"]);

    if (data) {
      const settings: SliderSettings = { autoplayInterval: "6", transitionSpeed: "normal", layoutMode: "split-screen" };
      data.forEach((item) => {
        if (item.setting_key === "hero_autoplay_interval") {
          settings.autoplayInterval = String(item.setting_value).replace(/"/g, "");
        } else if (item.setting_key === "hero_transition_speed") {
          settings.transitionSpeed = String(item.setting_value).replace(/"/g, "");
        } else if (item.setting_key === "hero_layout_mode") {
          const mode = String(item.setting_value).replace(/"/g, "");
          settings.layoutMode = mode === "centered" ? "centered" : "split-screen";
        }
      });
      setSliderSettings(settings);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    
    // Update existing settings
    await Promise.all([
      supabase
        .from("site_settings")
        .update({ setting_value: JSON.stringify(sliderSettings.autoplayInterval) })
        .eq("setting_key", "hero_autoplay_interval"),
      supabase
        .from("site_settings")
        .update({ setting_value: JSON.stringify(sliderSettings.transitionSpeed) })
        .eq("setting_key", "hero_transition_speed"),
    ]);

    // Handle layout mode separately (upsert)
    const { data: existingLayoutMode } = await supabase
      .from("site_settings")
      .select("id")
      .eq("setting_key", "hero_layout_mode")
      .single();

    if (existingLayoutMode) {
      await supabase
        .from("site_settings")
        .update({ setting_value: JSON.stringify(sliderSettings.layoutMode) })
        .eq("setting_key", "hero_layout_mode");
    } else {
      await supabase
        .from("site_settings")
        .insert({ 
          setting_key: "hero_layout_mode", 
          setting_value: JSON.stringify(sliderSettings.layoutMode),
          category: "hero"
        });
    }
    
    toast({ title: "Success", description: "Slider settings saved" });
    setSavingSettings(false);
  };

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from("hero_content")
      .select("*")
      .order("order_index", { ascending: true });
    
    if (!error && data) {
      const formattedSlides = data.map((item) => ({
        id: item.id,
        badge_text: item.badge_text || "",
        title: item.title,
        subtitle: item.subtitle || "",
        description: item.description || "",
        primary_button_text: item.primary_button_text || "",
        primary_button_link: item.primary_button_link || "",
        secondary_button_text: item.secondary_button_text || "",
        secondary_button_link: item.secondary_button_link || "",
        background_image_url: item.background_image_url || "",
        video_url: item.video_url || "",
        stats: Array.isArray(item.stats) ? item.stats as { number: string; label: string }[] : [],
        slide_type: (item as any).slide_type || "general",
        order_index: (item as any).order_index || 0,
        is_active: item.is_active,
      }));
      setSlides(formattedSlides);
      // Open first slide by default
      if (formattedSlides.length > 0) {
        setOpenSlides(new Set([formattedSlides[0].id]));
      }
    }
    setLoading(false);
  };

  const handleSave = async (slide: HeroSlide) => {
    setSaving(slide.id);
    
    const payload = {
      badge_text: slide.badge_text,
      title: slide.title,
      subtitle: slide.subtitle,
      description: slide.description,
      primary_button_text: slide.primary_button_text,
      primary_button_link: slide.primary_button_link,
      secondary_button_text: slide.secondary_button_text,
      secondary_button_link: slide.secondary_button_link,
      background_image_url: slide.background_image_url,
      video_url: slide.video_url,
      stats: slide.stats,
      slide_type: slide.slide_type,
      order_index: slide.order_index,
      is_active: slide.is_active,
    };

    const { error } = await supabase
      .from("hero_content")
      .update(payload)
      .eq("id", slide.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Slide updated successfully" });
    }
    setSaving(null);
  };

  const handleAddSlide = async () => {
    const newOrderIndex = slides.length > 0 ? Math.max(...slides.map(s => s.order_index)) + 1 : 0;
    
    const { data, error } = await supabase
      .from("hero_content")
      .insert({
        ...defaultSlide,
        order_index: newOrderIndex,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (data) {
      const newSlide: HeroSlide = {
        id: data.id,
        ...defaultSlide,
        order_index: newOrderIndex,
      };
      setSlides([...slides, newSlide]);
      setOpenSlides(new Set([...openSlides, data.id]));
      toast({ title: "Success", description: "New slide added" });
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (slides.length <= 1) {
      toast({ title: "Error", description: "You must have at least one slide", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("hero_content")
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSlides(slides.filter(s => s.id !== id));
      toast({ title: "Success", description: "Slide deleted" });
    }
  };

  const updateSlide = (id: string, updates: Partial<HeroSlide>) => {
    setSlides(slides.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const updateStat = (slideId: string, statIndex: number, field: "number" | "label", value: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    const newStats = [...slide.stats];
    newStats[statIndex] = { ...newStats[statIndex], [field]: value };
    updateSlide(slideId, { stats: newStats });
  };

  const addStat = (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    updateSlide(slideId, { 
      stats: [...slide.stats, { number: "", label: "" }] 
    });
  };

  const removeStat = (slideId: string, statIndex: number) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;
    
    updateSlide(slideId, { 
      stats: slide.stats.filter((_, i) => i !== statIndex) 
    });
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;

    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    
    // Update order_index for both slides
    newSlides[index].order_index = index;
    newSlides[newIndex].order_index = newIndex;
    
    setSlides(newSlides);

    // Save to database
    await Promise.all([
      supabase.from("hero_content").update({ order_index: index }).eq("id", newSlides[index].id),
      supabase.from("hero_content").update({ order_index: newIndex }).eq("id", newSlides[newIndex].id),
    ]);
  };

  const toggleSlide = (id: string) => {
    const newOpen = new Set(openSlides);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenSlides(newOpen);
  };

  const getSlideTypeLabel = (type: string) => {
    switch (type) {
      case "hajj": return "Hajj";
      case "umrah": return "Umrah";
      default: return "General";
    }
  };

  const getSlideTypeBadgeColor = (type: string) => {
    switch (type) {
      case "hajj": return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400";
      case "umrah": return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      default: return "bg-secondary/20 text-secondary-foreground";
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Slider Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Slider Settings
          </CardTitle>
          <CardDescription>Control how the hero slider behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout Mode Toggle */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" />
              Layout Mode
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setSliderSettings({ ...sliderSettings, layoutMode: "split-screen" })}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  sliderSettings.layoutMode === "split-screen" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <Columns className="w-8 h-8" />
                <span className="font-medium text-sm">Split-Screen</span>
                <span className="text-xs text-muted-foreground text-center">Content left, image right</span>
              </button>
              <button
                type="button"
                onClick={() => setSliderSettings({ ...sliderSettings, layoutMode: "centered" })}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  sliderSettings.layoutMode === "centered" 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-muted-foreground/30"
                }`}
              >
                <AlignCenter className="w-8 h-8" />
                <span className="font-medium text-sm">Full-Width Centered</span>
                <span className="text-xs text-muted-foreground text-center">Classic centered layout</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Autoplay Interval
              </Label>
              <Select
                value={sliderSettings.autoplayInterval}
                onValueChange={(value) => setSliderSettings({ ...sliderSettings, autoplayInterval: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 seconds (Fast)</SelectItem>
                  <SelectItem value="6">6 seconds (Normal)</SelectItem>
                  <SelectItem value="8">8 seconds (Slow)</SelectItem>
                  <SelectItem value="10">10 seconds (Very Slow)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Time before auto-switching to next slide</p>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Transition Speed
              </Label>
              <Select
                value={sliderSettings.transitionSpeed}
                onValueChange={(value) => setSliderSettings({ ...sliderSettings, transitionSpeed: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast (0.5s)</SelectItem>
                  <SelectItem value="normal">Normal (0.9s)</SelectItem>
                  <SelectItem value="slow">Slow (1.2s)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Speed of slide transition animation</p>
            </div>

            <div className="flex items-end">
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2">
                <Save className="w-4 h-4" />
                {savingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Hero Banner Slider</CardTitle>
            <CardDescription>Manage your homepage hero banners</CardDescription>
          </div>
          <Button onClick={handleAddSlide} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Slide
          </Button>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="overflow-hidden">
            <Collapsible open={openSlides.has(slide.id)} onOpenChange={() => toggleSlide(slide.id)}>
              <div className="flex items-center gap-4 p-4 bg-muted/50">
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === slides.length - 1}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">{slide.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSlideTypeBadgeColor(slide.slide_type)}`}>
                      {getSlideTypeLabel(slide.slide_type)}
                    </span>
                    {!slide.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{slide.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={slide.is_active}
                    onCheckedChange={(checked) => updateSlide(slide.id, { is_active: checked })}
                  />
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      {openSlides.has(slide.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Slide Type</Label>
                      <Select
                        value={slide.slide_type}
                        onValueChange={(value) => updateSlide(slide.id, { slide_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="hajj">Hajj</SelectItem>
                          <SelectItem value="umrah">Umrah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Badge Text</Label>
                      <Input
                        value={slide.badge_text}
                        onChange={(e) => updateSlide(slide.id, { badge_text: e.target.value })}
                        placeholder="e.g., Premium Hajj Packages 2025"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Background Image</Label>
                    <ImageUpload
                      value={slide.background_image_url}
                      onChange={(url) => updateSlide(slide.id, { background_image_url: url })}
                      onUpload={uploadImage}
                      uploading={uploading}
                      label=""
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Video URL (YouTube or Direct Link)</Label>
                    <Input
                      value={slide.video_url}
                      onChange={(e) => updateSlide(slide.id, { video_url: e.target.value })}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Optional: Add a video for the "Watch Video" button
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Main Title</Label>
                      <Input
                        value={slide.title}
                        onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                        placeholder="Your Sacred Journey"
                      />
                    </div>
                    <div>
                      <Label>Subtitle (Highlighted)</Label>
                      <Input
                        value={slide.subtitle}
                        onChange={(e) => updateSlide(slide.id, { subtitle: e.target.value })}
                        placeholder="Begins Here"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={slide.description}
                      onChange={(e) => updateSlide(slide.id, { description: e.target.value })}
                      placeholder="Brief description..."
                      rows={3}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Button</Label>
                      <Input
                        value={slide.primary_button_text}
                        onChange={(e) => updateSlide(slide.id, { primary_button_text: e.target.value })}
                        placeholder="Button text"
                      />
                      <Input
                        value={slide.primary_button_link}
                        onChange={(e) => updateSlide(slide.id, { primary_button_link: e.target.value })}
                        placeholder="Link (e.g., #hajj)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Button</Label>
                      <Input
                        value={slide.secondary_button_text}
                        onChange={(e) => updateSlide(slide.id, { secondary_button_text: e.target.value })}
                        placeholder="Button text"
                      />
                      <Input
                        value={slide.secondary_button_link}
                        onChange={(e) => updateSlide(slide.id, { secondary_button_link: e.target.value })}
                        placeholder="Link"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Stats</Label>
                      <Button type="button" variant="outline" size="sm" onClick={() => addStat(slide.id)}>
                        <Plus className="w-4 h-4 mr-1" />Add Stat
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {slide.stats.map((stat, statIndex) => (
                        <div key={statIndex} className="flex gap-2">
                          <Input
                            value={stat.number}
                            onChange={(e) => updateStat(slide.id, statIndex, "number", e.target.value)}
                            placeholder="10+"
                            className="w-32"
                          />
                          <Input
                            value={stat.label}
                            onChange={(e) => updateStat(slide.id, statIndex, "label", e.target.value)}
                            placeholder="Years Experience"
                            className="flex-1"
                          />
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(slide.id, statIndex)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={() => handleSave(slide)} disabled={saving === slide.id} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      {saving === slide.id ? "Saving..." : "Save Slide"}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDeleteSlide(slide.id)}
                      disabled={slides.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminHero;
