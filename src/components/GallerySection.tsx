import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Grid3X3, SlidersHorizontal, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

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

type ViewMode = "grid" | "carousel";

const GallerySection = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Autoplay plugin with pause on hover
  const autoplayPlugin = Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  useEffect(() => {
    fetchGalleryData();
  }, []);

  const onSelect = useCallback(() => {
    if (!carouselApi) return;
    setCurrentSlide(carouselApi.selectedScrollSnap());
  }, [carouselApi]);

  useEffect(() => {
    if (!carouselApi) return;
    onSelect();
    carouselApi.on("select", onSelect);
    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi, onSelect]);

  // Keyboard navigation for carousel
  useEffect(() => {
    if (viewMode !== "carousel" || !carouselApi) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        carouselApi.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        carouselApi.scrollNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, carouselApi]);

  const fetchGalleryData = async () => {
    try {
      const { data: settingsData } = await supabase
        .from("gallery_settings")
        .select("*")
        .single();

      if (settingsData) {
        setSettings(settingsData);
      }

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

  const toggleAutoplay = () => {
    if (isAutoplayPaused) {
      autoplayPlugin.play();
    } else {
      autoplayPlugin.stop();
    }
    setIsAutoplayPaused(!isAutoplayPaused);
  };

  const scrollToSlide = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

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
            className="text-center mb-8"
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

          {/* View Mode Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex justify-center gap-2 mb-8"
          >
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="gap-2"
            >
              <Grid3X3 className="w-4 h-4" />
              Grid
            </Button>
            <Button
              variant={viewMode === "carousel" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("carousel")}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Carousel
            </Button>
            {viewMode === "carousel" && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAutoplay}
                className="gap-2"
              >
                {isAutoplayPaused ? (
                  <>
                    <Play className="w-4 h-4" />
                    Play
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </motion.div>

          {/* Grid View */}
          {viewMode === "grid" && (
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      {image.caption && (
                        <p className="text-white text-sm font-medium line-clamp-2">
                          {image.caption}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-60 blur-sm transition-opacity duration-500 -z-10" />
                </motion.div>
              ))}
            </div>
          )}

          {/* Carousel View */}
          {viewMode === "carousel" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                  dragFree: true,
                  skipSnaps: false,
                  containScroll: "trimSnaps",
                }}
                plugins={[autoplayPlugin]}
                setApi={setCarouselApi}
                className="w-full touch-pan-y"
              >
                <CarouselContent className="-ml-4">
                  {images.map((image) => (
                    <CarouselItem key={image.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                      <div 
                        className="group relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer bg-muted"
                        onClick={() => setSelectedImage(image)}
                      >
                        <img
                          src={image.image_url}
                          alt={image.alt_text || "Gallery image"}
                          loading="lazy"
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-0 left-0 right-0 p-6">
                            {image.caption && (
                              <p className="text-white text-base font-medium">
                                {image.caption}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-70 blur-sm transition-opacity duration-500 -z-10" />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-12 bg-card/80 backdrop-blur-sm hover:bg-card border-primary/20" />
                <CarouselNext className="hidden md:flex -right-12 bg-card/80 backdrop-blur-sm hover:bg-card border-primary/20" />
              </Carousel>

              {/* Thumbnail Navigation */}
              <div className="flex justify-center gap-2 mt-6 overflow-x-auto pb-2 px-4">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => scrollToSlide(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-300 ${
                      currentSlide === index 
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105' 
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Autoplay indicator & mobile hint */}
              <div className="flex flex-col items-center gap-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={`w-2 h-2 rounded-full ${isAutoplayPaused ? 'bg-muted-foreground' : 'bg-primary animate-pulse'}`} />
                  {isAutoplayPaused ? 'Paused' : 'Auto-playing'}
                </div>
                <p className="text-sm text-muted-foreground md:hidden">
                  ← Swipe to explore →
                </p>
              </div>
            </motion.div>
          )}
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