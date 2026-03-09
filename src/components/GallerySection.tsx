import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Grid3X3, SlidersHorizontal, Pause, Play, Maximize, Minimize, ZoomIn, ZoomOut, RotateCcw, Sparkles, Camera, ChevronLeft, ChevronRight, Image as ImageIcon, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import VideoThumbnail from "@/components/ui/video-thumbnail";
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
  video_url: string | null;
  video_enabled: boolean | null;
  video_opacity: number | null;
  video_blur: number | null;
  video_speed: number | null;
}

type ViewMode = "grid" | "carousel";
type ContentType = "images" | "videos";

interface GalleryVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string | null;
  order_index: number;
  is_active: boolean;
}

interface SectionHeader {
  badge_text: string;
  arabic_text: string;
}

const GallerySection = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<GalleryVideo[]>([]);
  const [settings, setSettings] = useState<GallerySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [videoViewMode, setVideoViewMode] = useState<ViewMode>("grid");
  const [contentType, setContentType] = useState<ContentType>("images");
  const [selectedVideo, setSelectedVideo] = useState<GalleryVideo | null>(null);
  const [videoCarouselApi, setVideoCarouselApi] = useState<CarouselApi>();
  const [currentVideoSlide, setCurrentVideoSlide] = useState(0);
  const [isVideoAutoplayPaused, setIsVideoAutoplayPaused] = useState(false);
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sectionHeader, setSectionHeader] = useState<SectionHeader>({
    badge_text: "Photo Gallery",
    arabic_text: "معرض الصور"
  });
  
  // Lightbox state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const lightboxRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const lastTouchDistance = useRef<number | null>(null);
  const lastPanPosition = useRef({ x: 0, y: 0 });

  // Autoplay plugin with pause on hover
  const autoplayPlugin = Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: true,
  });

  // Video autoplay plugin
  const videoAutoplayPlugin = Autoplay({
    delay: 5000,
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

  // Video carousel select handler
  const onVideoSelect = useCallback(() => {
    if (!videoCarouselApi) return;
    setCurrentVideoSlide(videoCarouselApi.selectedScrollSnap());
  }, [videoCarouselApi]);

  useEffect(() => {
    if (!videoCarouselApi) return;
    onVideoSelect();
    videoCarouselApi.on("select", onVideoSelect);
    return () => {
      videoCarouselApi.off("select", onVideoSelect);
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

  const fetchSectionHeader = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "gallery_section_header")
      .maybeSingle();
    
    if (data?.setting_value) {
      setSectionHeader(data.setting_value as unknown as SectionHeader);
    }
  };

  const fetchGalleryData = async () => {
    try {
      fetchSectionHeader();
      
      const { data: settingsData } = await supabase
        .from("gallery_settings")
        .select("*")
        .maybeSingle();

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

      const { data: videosData } = await supabase
        .from("gallery_videos")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (videosData) {
        setVideos(videosData);
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

  const toggleVideoAutoplay = () => {
    if (isVideoAutoplayPaused) {
      videoAutoplayPlugin.play();
    } else {
      videoAutoplayPlugin.stop();
    }
    setIsVideoAutoplayPaused(!isVideoAutoplayPaused);
  };

  const scrollToVideoSlide = (index: number) => {
    if (videoCarouselApi) {
      videoCarouselApi.scrollTo(index);
    }
  };

  const scrollToSlide = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      lightboxRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 1));
    if (zoomLevel <= 1.5) {
      setPanPosition({ x: 0, y: 0 });
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  // Reset zoom when closing lightbox
  const handleCloseLightbox = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  // Navigate to previous/next image in lightbox
  const handlePrevImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    setSelectedImage(images[prevIndex]);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedImage, images]);

  const handleNextImage = useCallback(() => {
    if (!selectedImage) return;
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    setSelectedImage(images[nextIndex]);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedImage, images]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === "Escape") {
        handleCloseLightbox();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, handlePrevImage, handleNextImage]);

  // Pinch-to-zoom handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      lastPanPosition.current = {
        x: e.touches[0].clientX - panPosition.x,
        y: e.touches[0].clientY - panPosition.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault();
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = distance - lastTouchDistance.current;
      const newZoom = Math.max(1, Math.min(4, zoomLevel + delta * 0.01));
      setZoomLevel(newZoom);
      lastTouchDistance.current = distance;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      const newX = e.touches[0].clientX - lastPanPosition.current.x;
      const newY = e.touches[0].clientY - lastPanPosition.current.y;
      const maxPan = (zoomLevel - 1) * 150;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newZoom = Math.max(1, Math.min(4, zoomLevel + delta));
    setZoomLevel(newZoom);
    if (newZoom <= 1) {
      setPanPosition({ x: 0, y: 0 });
    }
  };

  if (!loading && (!settings?.is_enabled || images.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <section id="gallery" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
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
        className="py-12 sm:py-16 lg:py-24 relative overflow-hidden"
        style={{ backgroundColor: settings?.background_color || undefined }}
      >
        {/* Background Video */}
        {settings?.video_enabled && settings?.video_url && (
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute w-full h-full object-cover"
              style={{
                opacity: settings.video_opacity ?? 0.3,
                filter: `blur(${settings.video_blur ?? 0}px)`,
              }}
            >
              <source src={settings.video_url} type="video/mp4" />
            </video>
            {/* Video overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/80" />
          </div>
        )}
        
        {/* Enhanced Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full geometric-pattern opacity-30" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-tl from-secondary/20 to-primary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-secondary/10 rounded-full" />
        </div>

        <div className="container relative z-10">
          {/* Enhanced Header */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-primary/20 rounded-full text-sm font-medium mb-6 backdrop-blur-sm"
            >
              <Camera className="w-4 h-4 text-primary" />
              <span className="text-gradient-gold font-semibold">{sectionHeader.badge_text}</span>
              <Sparkles className="w-4 h-4 text-secondary" />
            </motion.div>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
              <span className="text-gradient-gold">{settings?.title || "Our Gallery"}</span>
            </h2>
            <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-4">{sectionHeader.arabic_text}</span>
            {settings?.subtitle && (
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
                {settings.subtitle}
              </p>
            )}
            <div className="mt-6 flex justify-center">
              <div className="h-1 w-24 bg-gradient-to-r from-transparent via-secondary to-transparent rounded-full" />
            </div>
          </motion.div>

          {/* Content Type Toggle - Images / Videos */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex justify-center gap-3 mb-6"
          >
            <Button
              variant={contentType === "images" ? "default" : "outline"}
              size="lg"
              onClick={() => setContentType("images")}
              className={`gap-2 px-8 transition-all duration-300 ${contentType === "images" ? "shadow-gold bg-gradient-to-r from-primary to-primary/80" : "hover:border-primary/50"}`}
            >
              <ImageIcon className="w-5 h-5" />
              Images
            </Button>
            <Button
              variant={contentType === "videos" ? "default" : "outline"}
              size="lg"
              onClick={() => setContentType("videos")}
              className={`gap-2 px-8 transition-all duration-300 ${contentType === "videos" ? "shadow-gold bg-gradient-to-r from-secondary to-secondary/80" : "hover:border-secondary/50"}`}
            >
              <Video className="w-5 h-5" />
              Videos
            </Button>
          </motion.div>

          {/* View Mode Toggle (only for images) */}
          {contentType === "images" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex justify-center gap-3 mb-12"
            >
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("grid")}
                className={`gap-2 px-6 transition-all duration-300 ${viewMode === "grid" ? "shadow-gold" : "hover:border-primary/50"}`}
              >
                <Grid3X3 className="w-5 h-5" />
                Grid View
              </Button>
              <Button
                variant={viewMode === "carousel" ? "default" : "outline"}
                size="lg"
                onClick={() => setViewMode("carousel")}
                className={`gap-2 px-6 transition-all duration-300 ${viewMode === "carousel" ? "shadow-gold" : "hover:border-primary/50"}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Carousel
              </Button>
              {viewMode === "carousel" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleAutoplay}
                    className="gap-2 px-6 border-secondary/50 hover:border-secondary"
                  >
                    {isAutoplayPaused ? (
                      <>
                        <Play className="w-5 h-5 text-secondary" />
                        Play
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 text-secondary" />
                        Pause
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* View Mode Toggle for Videos */}
          {contentType === "videos" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex justify-center gap-3 mb-12"
            >
              <Button
                variant={videoViewMode === "grid" ? "default" : "outline"}
                size="lg"
                onClick={() => setVideoViewMode("grid")}
                className={`gap-2 px-6 transition-all duration-300 ${videoViewMode === "grid" ? "shadow-gold" : "hover:border-primary/50"}`}
              >
                <Grid3X3 className="w-5 h-5" />
                Grid View
              </Button>
              <Button
                variant={videoViewMode === "carousel" ? "default" : "outline"}
                size="lg"
                onClick={() => setVideoViewMode("carousel")}
                className={`gap-2 px-6 transition-all duration-300 ${videoViewMode === "carousel" ? "shadow-gold" : "hover:border-primary/50"}`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                Carousel
              </Button>
              {videoViewMode === "carousel" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleVideoAutoplay}
                    className="gap-2 px-6 border-secondary/50 hover:border-secondary"
                  >
                    {isVideoAutoplayPaused ? (
                      <>
                        <Play className="w-5 h-5 text-secondary" />
                        Play
                      </>
                    ) : (
                      <>
                        <Pause className="w-5 h-5 text-secondary" />
                        Pause
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Videos Grid View */}
          {contentType === "videos" && videoViewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {videos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No videos available yet.</p>
                </div>
              ) : (
                videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ 
                      duration: 0.5, 
                      delay: index * 0.08,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    whileHover={{ y: -8 }}
                    className="group relative aspect-video overflow-hidden rounded-2xl cursor-pointer bg-muted shadow-elegant"
                    onClick={() => setSelectedVideo(video)}
                  >
                    {/* Thumbnail - Auto-generated */}
                    <VideoThumbnail
                      videoUrl={video.video_url}
                      thumbnailUrl={video.thumbnail_url}
                      alt={video.title}
                      className="transition-transform duration-700 group-hover:scale-110"
                      iconSize="md"
                    />
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="w-8 h-8 text-white ml-1" fill="white" />
                      </div>
                    </div>
                    
                    {/* Title */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white font-medium text-sm">{video.title}</p>
                    </div>
                    
                    {/* Hover Border Glow */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-secondary/50 transition-all duration-500" />
                  </motion.div>
                ))
              )}
            </div>
          )}

          {/* Videos Carousel View */}
          {contentType === "videos" && videoViewMode === "carousel" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                  dragFree: true,
                  skipSnaps: false,
                  containScroll: "trimSnaps",
                }}
                plugins={[videoAutoplayPlugin]}
                setApi={setVideoCarouselApi}
                className="w-full max-w-full touch-pan-y"
              >
                <CarouselContent className="-ml-4">
                  {videos.map((video, index) => (
                    <CarouselItem key={video.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/3">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="group relative aspect-video overflow-hidden rounded-2xl cursor-pointer bg-muted shadow-elegant"
                        onClick={() => setSelectedVideo(video)}
                      >
                        {/* Thumbnail - Auto-generated */}
                        <VideoThumbnail
                          videoUrl={video.video_url}
                          thumbnailUrl={video.thumbnail_url}
                          alt={video.title}
                          className="transition-transform duration-700 group-hover:scale-110"
                          iconSize="md"
                        />
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-8 h-8 text-white ml-1" fill="white" />
                          </div>
                        </div>
                        
                        {/* Title Only - No Description */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white font-semibold text-base">{video.title}</p>
                        </div>
                        
                        {/* Border Effect */}
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-secondary/50 transition-all duration-500" />
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-50 blur-md transition-all duration-700 -z-10" />
                        
                        {/* Corner Icon */}
                        <div className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-14 h-12 w-12 bg-card/90 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-secondary shadow-lg" />
                <CarouselNext className="hidden md:flex -right-14 h-12 w-12 bg-card/90 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-secondary shadow-lg" />
              </Carousel>

              {/* Thumbnail Navigation for Videos */}
              <div className="flex justify-center gap-3 mt-8 overflow-x-auto pb-2 px-4">
                {videos.map((video, index) => (
                  <motion.button
                    key={video.id}
                    onClick={() => scrollToVideoSlide(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex-shrink-0 w-24 h-14 rounded-xl overflow-hidden transition-all duration-300 ${
                      currentVideoSlide === index 
                        ? 'ring-3 ring-secondary ring-offset-2 ring-offset-background shadow-gold scale-105' 
                        : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                  >
                    <VideoThumbnail
                      videoUrl={video.video_url}
                      thumbnailUrl={video.thumbnail_url}
                      alt={video.title}
                      iconSize="sm"
                    />
                    {currentVideoSlide === index && (
                      <div className="absolute inset-0 border-2 border-secondary rounded-xl" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Autoplay indicator for videos */}
              <div className="flex flex-col items-center gap-3 mt-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/50">
                  <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isVideoAutoplayPaused ? 'bg-muted-foreground' : 'bg-secondary animate-pulse shadow-gold'}`} />
                  <span className="text-sm font-medium text-foreground">
                    {isVideoAutoplayPaused ? 'Paused' : 'Auto-playing'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Grid View */}
          {contentType === "images" && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.5, 
                    delay: index * 0.08,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ y: -8 }}
                  className="group relative aspect-square overflow-hidden rounded-2xl cursor-pointer bg-muted shadow-elegant"
                  onClick={() => setSelectedImage(image)}
                >
                  {/* Image */}
                  <OptimizedImage
                    src={image.image_url}
                    alt={image.alt_text || "Gallery image"}
                    className="w-full h-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {image.caption && (
                      <motion.p 
                        className="text-white text-sm font-medium line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100"
                      >
                        {image.caption}
                      </motion.p>
                    )}
                  </div>
                  
                  {/* Hover Border Glow */}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-secondary/50 transition-all duration-500" />
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-40 blur-md transition-all duration-700 -z-10" />
                  
                  {/* Corner Accent */}
                  <div className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Carousel View */}
          {contentType === "images" && viewMode === "carousel" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Carousel
                opts={{
                  align: "center",
                  loop: true,
                  dragFree: true,
                  skipSnaps: false,
                  containScroll: "trimSnaps",
                }}
                plugins={[autoplayPlugin]}
                setApi={setCarouselApi}
                className="w-full max-w-full touch-pan-y"
              >
                <CarouselContent className="-ml-4">
                  {images.map((image, index) => (
                    <CarouselItem key={image.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ y: -5 }}
                        className="group relative aspect-[4/3] overflow-hidden rounded-2xl cursor-pointer bg-muted shadow-elegant"
                        onClick={() => setSelectedImage(image)}
                      >
                        <OptimizedImage
                          src={image.image_url}
                          alt={image.alt_text || "Gallery image"}
                          className="w-full h-full"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                          {image.caption && (
                            <p className="text-white text-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                              {image.caption}
                            </p>
                          )}
                        </div>
                        
                        {/* Border Effect */}
                        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-secondary/50 transition-all duration-500" />
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-secondary to-primary opacity-0 group-hover:opacity-50 blur-md transition-all duration-700 -z-10" />
                        
                        {/* Corner Icon */}
                        <div className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden md:flex -left-14 h-12 w-12 bg-card/90 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-secondary shadow-lg" />
                <CarouselNext className="hidden md:flex -right-14 h-12 w-12 bg-card/90 backdrop-blur-sm hover:bg-card border-primary/30 hover:border-secondary shadow-lg" />
              </Carousel>

              {/* Enhanced Thumbnail Navigation */}
              <div className="flex justify-center gap-3 mt-8 overflow-x-auto pb-2 px-4">
                {images.map((image, index) => (
                  <motion.button
                    key={image.id}
                    onClick={() => scrollToSlide(index)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden transition-all duration-300 ${
                      currentSlide === index 
                        ? 'ring-3 ring-secondary ring-offset-2 ring-offset-background shadow-gold scale-105' 
                        : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {currentSlide === index && (
                      <div className="absolute inset-0 border-2 border-secondary rounded-xl" />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Enhanced Autoplay indicator & mobile hint */}
              <div className="flex flex-col items-center gap-3 mt-6">
                <div className="flex items-center gap-3 px-4 py-2 bg-card/50 backdrop-blur-sm rounded-full border border-border/50">
                  <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isAutoplayPaused ? 'bg-muted-foreground' : 'bg-secondary animate-pulse shadow-gold'}`} />
                  <span className="text-sm font-medium text-foreground">
                    {isAutoplayPaused ? 'Paused' : 'Auto-playing'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground md:hidden flex items-center gap-2">
                  <span className="animate-pulse">👆</span>
                  Swipe to explore
                  <span className="animate-pulse">👆</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div 
          ref={lightboxRef}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          onClick={handleCloseLightbox}
        >
          {/* Lightbox Controls */}
          <div 
            className="flex items-center justify-between p-4 bg-black/50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="w-5 h-5" />
              </Button>
              <span className="text-white text-sm min-w-[60px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 4}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetZoom}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="w-5 h-5" />
                ) : (
                  <Maximize className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseLightbox}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Image Container */}
          <div 
            className="flex-1 flex items-center justify-center overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Left Navigation Arrow */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
                className="absolute left-4 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            <motion.div
              key={selectedImage.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-full max-h-full"
            >
              <img
                ref={imageRef}
                src={selectedImage.image_url}
                alt={selectedImage.alt_text || "Gallery image"}
                className="max-w-full max-h-[calc(100vh-140px)] object-contain select-none transition-transform duration-150"
                style={{
                  transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                  cursor: zoomLevel > 1 ? 'grab' : 'default',
                }}
                draggable={false}
              />
            </motion.div>

            {/* Right Navigation Arrow */}
            {images.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
                className="absolute right-4 z-10 w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/20 hover:border-white/40 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
          </div>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white text-sm font-medium">
              {images.findIndex(img => img.id === selectedImage.id) + 1} / {images.length}
            </div>
          )}

          {/* Caption */}
          {selectedImage.caption && (
            <div className="p-4 bg-black/50 text-center" onClick={(e) => e.stopPropagation()}>
              <p className="text-white text-lg">
                {selectedImage.caption}
              </p>
            </div>
          )}

          {/* Mobile hint */}
          <div className="absolute bottom-20 left-0 right-0 text-center pointer-events-none md:hidden">
            <p className="text-white/60 text-sm">
              Pinch to zoom • Drag to pan
            </p>
          </div>
        </div>
      )}

      {/* Video Lightbox Modal */}
      {selectedVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>

          {/* Video Container */}
          <div 
            className="relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <video
              src={selectedVideo.video_url}
              autoPlay
              controls
              loop
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          </div>

          {/* Video Title */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white text-lg font-medium">{selectedVideo.title}</p>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default GallerySection;