import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2, Info, Target, History, Eye, Heart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ValueItem {
  title: string;
  description: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface AboutContent {
  id: string;
  title: string;
  subtitle: string | null;
  mission_title: string | null;
  mission_text: string | null;
  history_title: string | null;
  history_text: string | null;
  vision_title: string | null;
  vision_text: string | null;
  values_title: string | null;
  values_items: ValueItem[];
  image_url: string | null;
  stats: StatItem[];
}

const AdminAbout = () => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setContent({
          ...data,
          values_items: (data.values_items as unknown as ValueItem[]) || [],
          stats: (data.stats as unknown as StatItem[]) || [],
        });
      } else {
        // Create default content if none exists
        const { data: newData, error: insertError } = await supabase
          .from("about_content")
          .insert({
            title: "About Us",
            subtitle: "Your Trusted Partner for Sacred Journeys",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        if (newData) {
          setContent({
            ...newData,
            values_items: [],
            stats: [],
          });
        }
      }
    } catch (error) {
      console.error("Error fetching about content:", error);
      toast.error("Failed to load about content");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("about_content")
        .update({
          title: content.title,
          subtitle: content.subtitle,
          mission_title: content.mission_title,
          mission_text: content.mission_text,
          history_title: content.history_title,
          history_text: content.history_text,
          vision_title: content.vision_title,
          vision_text: content.vision_text,
          values_title: content.values_title,
          values_items: JSON.parse(JSON.stringify(content.values_items)),
          image_url: content.image_url,
          stats: JSON.parse(JSON.stringify(content.stats)),
        })
        .eq("id", content.id);

      if (error) throw error;

      toast.success("About content saved successfully!");
    } catch (error) {
      console.error("Error saving about content:", error);
      toast.error("Failed to save about content");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof AboutContent, value: string | null) => {
    if (!content) return;
    setContent({ ...content, [field]: value });
  };

  const addValue = () => {
    if (!content) return;
    setContent({
      ...content,
      values_items: [...content.values_items, { title: "", description: "" }],
    });
  };

  const updateValue = (index: number, field: keyof ValueItem, value: string) => {
    if (!content) return;
    const newValues = [...content.values_items];
    newValues[index] = { ...newValues[index], [field]: value };
    setContent({ ...content, values_items: newValues });
  };

  const removeValue = (index: number) => {
    if (!content) return;
    setContent({
      ...content,
      values_items: content.values_items.filter((_, i) => i !== index),
    });
  };

  const addStat = () => {
    if (!content) return;
    setContent({
      ...content,
      stats: [...content.stats, { value: "", label: "" }],
    });
  };

  const updateStat = (index: number, field: keyof StatItem, value: string) => {
    if (!content) return;
    const newStats = [...content.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setContent({ ...content, stats: newStats });
  };

  const removeStat = (index: number) => {
    if (!content) return;
    setContent({
      ...content,
      stats: content.stats.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">About Section</h2>
          <p className="text-muted-foreground">
            Manage your company's about page content
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Info className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Target className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="values" className="gap-2">
            <Heart className="w-4 h-4" />
            Values
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <Eye className="w-4 h-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Section Title</Label>
                <Input
                  value={content.title}
                  onChange={(e) => updateField("title", e.target.value)}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={content.subtitle || ""}
                  onChange={(e) => updateField("subtitle", e.target.value)}
                  placeholder="Your Trusted Partner for Sacred Journeys"
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <Input
                  value={content.image_url || ""}
                  onChange={(e) => updateField("image_url", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid gap-6">
            {/* Mission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={content.mission_title || ""}
                    onChange={(e) => updateField("mission_title", e.target.value)}
                    placeholder="Our Mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content.mission_text || ""}
                    onChange={(e) => updateField("mission_text", e.target.value)}
                    placeholder="Describe your mission..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-secondary" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={content.history_title || ""}
                    onChange={(e) => updateField("history_title", e.target.value)}
                    placeholder="Our History"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content.history_text || ""}
                    onChange={(e) => updateField("history_text", e.target.value)}
                    placeholder="Describe your company's history..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vision */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-accent" />
                  Vision
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={content.vision_title || ""}
                    onChange={(e) => updateField("vision_title", e.target.value)}
                    placeholder="Our Vision"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    value={content.vision_text || ""}
                    onChange={(e) => updateField("vision_text", e.target.value)}
                    placeholder="Describe your vision..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="values">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Company Values</CardTitle>
              <Button onClick={addValue} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Value
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Values Section Title</Label>
                <Input
                  value={content.values_title || ""}
                  onChange={(e) => updateField("values_title", e.target.value)}
                  placeholder="Our Values"
                />
              </div>

              <div className="space-y-4 mt-6">
                {content.values_items.map((value, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-lg space-y-3 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Value {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeValue(index)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <Input
                      value={value.title}
                      onChange={(e) => updateValue(index, "title", e.target.value)}
                      placeholder="Value title"
                    />
                    <Textarea
                      value={value.description}
                      onChange={(e) => updateValue(index, "description", e.target.value)}
                      placeholder="Value description"
                      rows={2}
                    />
                  </div>
                ))}

                {content.values_items.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No values added yet. Click "Add Value" to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Statistics</CardTitle>
              <Button onClick={addStat} size="sm" variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Stat
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {content.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Value</Label>
                        <Input
                          value={stat.value}
                          onChange={(e) => updateStat(index, "value", e.target.value)}
                          placeholder="10+"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={stat.label}
                          onChange={(e) => updateStat(index, "label", e.target.value)}
                          placeholder="Years Experience"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStat(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {content.stats.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No statistics added yet. Click "Add Stat" to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAbout;
