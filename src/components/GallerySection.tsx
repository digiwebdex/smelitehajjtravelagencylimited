import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  caption: string | null;
  order_index: number;
}

interface GallerySettings {
  id: string;
  title: string;
  subtitle: string | null;
  background_color: string | null;
  is_enabled: boolean;
}

const GallerySection = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const fetchGalleryData = async () => {
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from("gallery_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

      // Fetch images
      const { data: imagesData } = await supabase
        .from("gallery_images")
        .select("*")
        .eq("is_active", true)
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

  // Don't render if gallery is disabled or no images
  if (!loading && (!settings?.is_enabled || images.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <section id="gallery" className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section 
        id="gallery" 
        className="py-20 relative overflow-hidden"
        style={{ backgroundColor: settings?.background_color || undefined }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 border-2 border-primary rounded-full" />
          <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-secondary rounded-full" />
        </div>

        <div className="container relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              📸 Photo Gallery
            </span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
              {settings?.title || "Our Gallery"}
            </h2>
            {settings?.subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                {settings.subtitle}
              </p>
            )}
          </motion.div>

          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group relative aspect-square overflow-hidden rounded-xl cursor-pointer bg-muted"
                onClick={() => setSelectedImage(image)}
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text || "Gallery image"}
                  loading="lazy"
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {image.caption && (
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {image.caption}
                      </p>
                    )}
                  </div>
                </div>
                {/* Glow effect on hover */}
                <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-60 blur-sm transition-opacity duration-500 -z-10" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-secondary transition-colors text-lg font-medium"
            >
              ✕ Close
            </button>
            <img
              src={selectedImage.image_url}
              alt={selectedImage.alt_text || "Gallery image"}
              className="w-full h-auto max-h-[85vh] object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 text-lg">
                {selectedImage.caption}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </>
  );
};

export default GallerySection;