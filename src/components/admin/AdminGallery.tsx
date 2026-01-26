import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Image as ImageIcon, Settings, Palette, Video, Upload } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  order_index: number;
  is_active: boolean;
}

interface GallerySettings {
  id: string;
  title: string;
  subtitle: string | null;
  background_color: string | null;
  is_enabled: boolean;
  video_url: string | null;
  video_enabled: boolean | null;
  video_opacity: number | null;
  video_blur: number | null;
  video_speed: number | null;
}

interface SectionHeader {
  badge_text: string;
  arabic_text: string;
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  
  // Section header state
  const [sectionHeader, setSectionHeader] = useState<SectionHeader>({
    badge_text: "Our Gallery",
    arabic_text: "معرض الصور"
  });
  const [savingHeader, setSavingHeader] = useState(false);
  
  // Form state for image
  const [imageUrl, setImageUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [caption, setCaption] = useState("");
  
  const { uploadImage, uploading } = useImageUpload({ bucket: "admin-uploads", folder: "gallery" });
  const [videoUploading, setVideoUploading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchSectionHeader();
  }, []);

  const fetchSectionHeader = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "gallery_section_header")
      .single();
    
    if (data?.setting_value) {
      setSectionHeader(data.setting_value as unknown as SectionHeader);
    }
  };

  const saveSectionHeader = async () => {
    setSavingHeader(true);
    try {
      const settingValue = JSON.parse(JSON.stringify(sectionHeader));
      
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", "gallery_section_header")
        .single();

      if (existing) {
        await supabase
          .from("site_settings")
          .update({ setting_value: settingValue })
          .eq("setting_key", "gallery_section_header");
      } else {
        await supabase
          .from("site_settings")
          .insert([{ setting_key: "gallery_section_header", setting_value: settingValue, category: "sections" }]);
      }
      toast.success("Section header saved");
    } catch (error) {
      toast.error("Failed to save header");
    }
    setSavingHeader(false);
  };

  const fetchData = async () => {
    try {
      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("gallery_settings")
        .select("*")
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching settings:", settingsError);
      }
      
      if (settingsData) {
        setSettings(settingsData);
      }

      // Fetch images (all, including inactive for admin)
      const { data: imagesData } = await supabase
        .from("gallery_images")
        .select("*")
        .order("order_index");

      if (imagesData) {
        setImages(imagesData);
      }
    } catch (error) {
      console.error("Error fetching gallery data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("gallery_settings")
        .update({
          title: settings.title,
          subtitle: settings.subtitle,
          background_color: settings.background_color,
          is_enabled: settings.is_enabled,
          video_url: settings.video_url,
          video_enabled: settings.video_enabled,
          video_opacity: settings.video_opacity,
          video_blur: settings.video_blur,
          video_speed: settings.video_speed,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("Gallery settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      toast.error("Please select a video file");
      return;
    }
    
    setVideoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `gallery-video-${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('admin-uploads')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('admin-uploads')
        .getPublicUrl(filePath);
      
      setSettings(prev => prev ? { ...prev, video_url: publicUrl } : null);
      toast.success("Video uploaded successfully");
    } catch (error) {
      console.error("Error uploading video:", error);
      toast.error("Failed to upload video");
    } finally {
      setVideoUploading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const url = await uploadImage(file);
    if (url) {
      setImageUrl(url);
    }
  };

  const handleSubmitImage = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please provide an image URL");
      return;
    }

    setSaving(true);
    try {
      if (editingImage) {
        // Update existing
        const { error } = await supabase
          .from("gallery_images")
          .update({
            image_url: imageUrl,
            alt_text: altText,
            caption: caption || null,
          })
          .eq("id", editingImage.id);

        if (error) throw error;
        toast.success("Image updated successfully");
      } else {
        // Insert new
        const maxOrder = images.length > 0 ? Math.max(...images.map(i => i.order_index)) : -1;
        const { error } = await supabase
          .from("gallery_images")
          .insert({
            image_url: imageUrl,
            alt_text: altText,
            caption: caption || null,
            order_index: maxOrder + 1,
          });

        if (error) throw error;
        toast.success("Image added successfully");
      }
      
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving image:", error);
      toast.error("Failed to save image");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const { error } = await supabase
        .from("gallery_images")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Image deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    }
  };

  const toggleImageActive = async (image: GalleryImage) => {
    try {
      const { error } = await supabase
        .from("gallery_images")
        .update({ is_active: !image.is_active })
        .eq("id", image.id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error toggling image:", error);
      toast.error("Failed to update image");
    }
  };

  const moveImage = async (image: GalleryImage, direction: "up" | "down") => {
    const currentIndex = images.findIndex(i => i.id === image.id);
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (swapIndex < 0 || swapIndex >= images.length) return;

    const swapImage = images[swapIndex];
    
    try {
      await supabase.from("gallery_images").update({ order_index: swapImage.order_index }).eq("id", image.id);
      await supabase.from("gallery_images").update({ order_index: image.order_index }).eq("id", swapImage.id);
      fetchData();
    } catch (error) {
      console.error("Error reordering images:", error);
      toast.error("Failed to reorder images");
    }
  };

  const resetForm = () => {
    setImageUrl("");
    setAltText("");
    setCaption("");
    setEditingImage(null);
  };

  const openEditDialog = (image: GalleryImage) => {
    setEditingImage(image);
    setImageUrl(image.image_url);
    setAltText(image.alt_text);
    setCaption(image.caption || "");
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gallery Settings
          </CardTitle>
          <CardDescription>
            Customize the gallery section appearance and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <Label className="text-base font-medium">Enable Gallery</Label>
              <p className="text-sm text-muted-foreground">Show the gallery section on the homepage</p>
            </div>
            <Switch
              checked={settings?.is_enabled ?? true}
              onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, is_enabled: checked } : null)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="badge">Badge Text</Label>
              <Input
                id="badge"
                value={sectionHeader.badge_text}
                onChange={(e) => setSectionHeader({ ...sectionHeader, badge_text: e.target.value })}
                placeholder="Photo Gallery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arabic">Arabic Text</Label>
              <Input
                id="arabic"
                value={sectionHeader.arabic_text}
                onChange={(e) => setSectionHeader({ ...sectionHeader, arabic_text: e.target.value })}
                placeholder="معرض الصور"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Gallery Title</Label>
              <Input
                id="title"
                value={settings?.title || ""}
                onChange={(e) => setSettings(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Our Gallery"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bgColor" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Background Color
              </Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings?.background_color || "#f8fafc"}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, background_color: e.target.value } : null)}
                  className="w-14 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings?.background_color || ""}
                  onChange={(e) => setSettings(prev => prev ? { ...prev, background_color: e.target.value } : null)}
                  placeholder="#f8fafc"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Gallery Subtitle</Label>
            <Textarea
              id="subtitle"
              value={settings?.subtitle || ""}
              onChange={(e) => setSettings(prev => prev ? { ...prev, subtitle: e.target.value } : null)}
              placeholder="Capturing beautiful moments from our sacred journeys"
              rows={2}
            />
          </div>

          {/* Video Settings Section */}
          <div className="border-t pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Background Video</h3>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 mb-4">
              <div>
                <Label className="text-base font-medium">Enable Video Background</Label>
                <p className="text-sm text-muted-foreground">Show a video behind the gallery section</p>
              </div>
              <Switch
                checked={settings?.video_enabled ?? false}
                onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, video_enabled: checked } : null)}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Video File</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings?.video_url || ""}
                    onChange={(e) => setSettings(prev => prev ? { ...prev, video_url: e.target.value } : null)}
                    placeholder="Enter video URL or upload"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={videoUploading}
                    onClick={() => document.getElementById("gallery-video-upload")?.click()}
                    className="gap-2"
                  >
                    {videoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                  </Button>
                  <input
                    id="gallery-video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleVideoUpload(file);
                    }}
                  />
                </div>
              </div>

              {/* Video Preview */}
              {settings?.video_url && (
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-w-md">
                  <video
                    src={settings.video_url}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                      opacity: settings.video_opacity ?? 0.3,
                      filter: `blur(${settings.video_blur ?? 0}px)`,
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/60 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white/80 text-sm font-medium bg-black/50 px-3 py-1 rounded">Preview with effects</span>
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Video Opacity: {Math.round((settings?.video_opacity ?? 0.3) * 100)}%</Label>
                  <Slider
                    value={[(settings?.video_opacity ?? 0.3) * 100]}
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, video_opacity: value[0] / 100 } : null)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Video Blur: {settings?.video_blur ?? 0}px</Label>
                  <Slider
                    value={[settings?.video_blur ?? 0]}
                    onValueChange={(value) => setSettings(prev => prev ? { ...prev, video_blur: value[0] } : null)}
                    min={0}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Settings
            </Button>
            <Button onClick={saveSectionHeader} disabled={savingHeader} variant="outline">
              {savingHeader && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Header Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Images Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Gallery Images
            </CardTitle>
            <CardDescription>
              Manage your gallery images - add, edit, reorder, or remove
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingImage ? "Edit Image" : "Add New Image"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex gap-2">
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Enter image URL or upload"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={uploading}
                      onClick={() => document.getElementById("gallery-image-upload")?.click()}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
                    </Button>
                    <input
                      id="gallery-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                  </div>
                  {imageUrl && (
                    <img src={imageUrl} alt="Preview" className="w-full h-40 object-cover rounded-lg mt-2" />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altText">Alt Text (for accessibility)</Label>
                  <Input
                    id="altText"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Describe the image"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caption">Caption (optional)</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption for this image"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitImage} disabled={saving || !imageUrl}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingImage ? "Update" : "Add"} Image
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No images in the gallery yet.</p>
              <p className="text-sm">Click "Add Image" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead className="w-24">Preview</TableHead>
                  <TableHead>Alt Text</TableHead>
                  <TableHead>Caption</TableHead>
                  <TableHead className="w-24">Active</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images.map((image, index) => (
                  <TableRow key={image.id}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === 0}
                          onClick={() => moveImage(image, "up")}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          disabled={index === images.length - 1}
                          onClick={() => moveImage(image, "down")}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={image.image_url}
                        alt={image.alt_text}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {image.alt_text || <span className="text-muted-foreground italic">No alt text</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {image.caption || <span className="text-muted-foreground italic">No caption</span>}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={image.is_active}
                        onCheckedChange={() => toggleImageActive(image)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(image)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGallery;