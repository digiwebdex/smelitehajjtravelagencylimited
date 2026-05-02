import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { compressImage, getOptimalCompressionSettings } from "@/lib/imageCompression";

interface UseImageUploadOptions {
  bucket: string;
  folder: string;
  /** Whether to compress images before upload (default: true) */
  compress?: boolean;
  /** High-quality mode: larger dimensions + higher quality (for hero/banner images) */
  highQuality?: boolean;
}

export const useImageUpload = ({ bucket, folder, compress = true, highQuality = false }: UseImageUploadOptions) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 10MB before compression, will be reduced)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      let fileToUpload = file;
      
      // Compress image if enabled
      if (compress) {
        const compressionSettings = getOptimalCompressionSettings(file);
        try {
          fileToUpload = await compressImage(file, compressionSettings);
          
          // Log compression results for debugging
          const savings = ((file.size - fileToUpload.size) / file.size * 100).toFixed(1);
          console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(fileToUpload.size / 1024).toFixed(1)}KB (${savings}% savings)`);
        } catch (compressError) {
          console.warn("Image compression failed, uploading original:", compressError);
          // Fall back to original file if compression fails
          fileToUpload = file;
        }
      }

      // Determine file extension (prefer .webp for compressed files)
      const fileExt = fileToUpload.name.split(".").pop() || "webp";
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, fileToUpload, {
          cacheControl: "31536000", // 1 year cache for optimized images
          upsert: false,
          contentType: fileToUpload.type,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploadImage, uploading };
};
