import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kaaba.jpg";
import { motion, AnimatePresence } from "framer-motion";
import FloatingIslamicPatterns from "./FloatingIslamicPatterns";
import MakkahIcon from "./icons/MakkahIcon";
import MadinahIcon from "./icons/MadinahIcon";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface HeroSlide {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  badge_text?: string;
  primary_button_text?: string;
  primary_button_link?: string;
  secondary_button_text?: string;
  secondary_button_link?: string;
  background_image_url?: string;
  video_url?: string;
  stats?: { number: string; label: string }[];
  slide_type?: string;
  order_index?: number;
}

const defaultSlides: HeroSlide[] = [
  {
    id: "default-1",
    title: "Your Sacred Journey",
    subtitle: "Begins Here",
    description: "Experience the spiritual journey of a lifetime with SM Elite Hajj. We provide premium Hajj & Umrah packages with complete care and guidance.",
    badge_text: "Govt. Approved Hajj & Umrah Agency",
    primary_button_text: "Explore Hajj Packages",
    primary_button_link: "#hajj",
    secondary_button_text: "View Umrah Packages",
    secondary_button_link: "#umrah",
    stats: [
      { number: "10+", label: "Years Experience" },
      { number: "5000+", label: "Happy Pilgrims" },
      { number: "100%", label: "Satisfaction Rate" },
      { number: "24/7", label: "Support Available" },
    ],
    slide_type: "general",
    order_index: 0,
  },
];

const HeroSection = () => {
  const [slides, setSlides] = useState<HeroSlide[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHeroContent();
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2; // -1 to 1
      const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 seconds per slide

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length]);

  const fetchHeroContent = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("hero_content")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });
    
    if (data && data.length > 0) {
      const formattedSlides = data.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle || undefined,
        description: item.description || undefined,
        badge_text: item.badge_text || undefined,
        primary_button_text: item.primary_button_text || undefined,
        primary_button_link: item.primary_button_link || undefined,
        secondary_button_text: item.secondary_button_text || undefined,
        secondary_button_link: item.secondary_button_link || undefined,
        background_image_url: item.background_image_url || undefined,
        video_url: item.video_url || undefined,
        stats: Array.isArray(item.stats) ? item.stats as { number: string; label: string }[] : undefined,
        slide_type: (item as any).slide_type || "general",
        order_index: (item as any).order_index || 0,
      }));
      setSlides(formattedSlides);
    }
    setIsLoading(false);
  };

  // Loading skeleton component
  const HeroSkeleton = () => (
    <div className="relative z-10 container text-center pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Badge skeleton */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mb-8"
        >
          <Skeleton className="h-10 w-64 rounded-full bg-primary-foreground/10" />
        </motion.div>
        
        {/* Title skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 mb-8"
        >
          <Skeleton className="h-16 md:h-20 w-3/4 mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-12 md:h-16 w-1/2 mx-auto bg-secondary/20" />
        </motion.div>
        
        {/* Description skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-12"
        >
          <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-6 w-4/5 max-w-xl mx-auto bg-primary-foreground/10" />
        </motion.div>
        
        {/* Button skeletons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
        >
          <Skeleton className="h-14 w-56 mx-auto sm:mx-0 bg-secondary/30" />
          <Skeleton className="h-14 w-48 mx-auto sm:mx-0 bg-primary-foreground/10" />
        </motion.div>
        
        {/* Stats skeleton */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-primary-foreground/20"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-10 w-20 mx-auto bg-secondary/20" />
              <Skeleton className="h-4 w-24 mx-auto bg-primary-foreground/10" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    }
    
    return url;
  };

  const isYouTubeUrl = (url: string) => {
    return url?.includes("youtube.com") || url?.includes("youtu.be");
  };

  const scrollToSection = (id: string) => {
    const sectionId = id.replace("#", "");
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const content = slides[currentSlide] || defaultSlides[0];
  const backgroundImage = content.background_image_url || heroImage;

  // Text animation variants - animate from top to middle with fade (fast 0.5s)
  const textVariants = {
    hidden: { opacity: 0, y: -40 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: [0.25, 0.46, 0.45, 0.94] as const
      }
    }
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Background Image with Crossfade Slide Effect */}
      <div className="absolute inset-0 bg-primary">
        <AnimatePresence initial={false}>
          <motion.div
            key={`bg-${currentSlide}`}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="absolute inset-0"
          >
            {/* Smooth Ken Burns zoom effect on the image */}
            <motion.img
              key={`img-${currentSlide}`}
              src={backgroundImage}
              alt="Hero background"
              className="w-full h-full object-cover"
              initial={{ scale: 1.02 }}
              animate={{ 
                scale: 1.08,
                transition: { 
                  duration: 4, 
                  ease: "linear"
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-hero" />
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Islamic Geometric Patterns */}
      <FloatingIslamicPatterns mousePosition={mousePosition} />

      {/* Arabic Calligraphy Decorative Elements - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ 
          opacity: 0.15, 
          x: mousePosition.x * -15,
          y: mousePosition.y * -10
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute left-0 top-0 h-full w-32 md:w-48 lg:w-64 hidden md:flex flex-col justify-center items-center pointer-events-none"
      >
        <motion.div 
          animate={{ x: mousePosition.x * -8, y: mousePosition.y * -5 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="font-arabic text-secondary text-6xl md:text-7xl lg:text-9xl leading-none writing-vertical-rl transform rotate-180 select-none opacity-60"
        >
          بِسْمِ اللَّهِ
        </motion.div>
        <motion.div 
          animate={{ x: mousePosition.x * -12, y: mousePosition.y * -8 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-arabic text-secondary/50 text-4xl md:text-5xl lg:text-7xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none"
        >
          الرَّحْمَنِ
        </motion.div>
        <motion.div 
          animate={{ x: mousePosition.x * -6, y: mousePosition.y * -4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="font-arabic text-secondary/30 text-3xl md:text-4xl lg:text-6xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none"
        >
          الرَّحِيمِ
        </motion.div>
      </motion.div>

      {/* Makkah & Madinah Icons - Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ 
          opacity: 0.25, 
          x: mousePosition.x * 20,
          y: mousePosition.y * 15
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute right-4 top-1/4 hidden lg:flex flex-col items-center gap-8 pointer-events-none"
      >
        <motion.div 
          animate={{ x: mousePosition.x * 10, y: mousePosition.y * 8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-secondary drop-shadow-lg"
        >
          <MakkahIcon size={80} className="drop-shadow-[2px_2px_4px_rgba(0,0,0,0.3)]" />
        </motion.div>
        <motion.div 
          animate={{ x: mousePosition.x * 15, y: mousePosition.y * 12 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-secondary/80 drop-shadow-md"
        >
          <MadinahIcon size={72} className="drop-shadow-[1px_1px_3px_rgba(0,0,0,0.2)]" />
        </motion.div>
      </motion.div>

      {/* Floating Decorative Circles */}
      <motion.div
        animate={{ 
          y: [-10, 10, -10],
          x: mousePosition.x * 25,
        }}
        transition={{ 
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 0.4, ease: "easeOut" }
        }}
        className="absolute top-1/4 left-[15%] w-20 h-20 border border-secondary/30 rounded-full hidden lg:block"
      />
      <motion.div
        animate={{ 
          y: [10, -10, 10],
          x: mousePosition.x * -20,
        }}
        transition={{ 
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 0.5, ease: "easeOut" }
        }}
        className="absolute bottom-1/4 right-[15%] w-32 h-32 border border-secondary/20 rounded-full hidden lg:block"
      />

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-all group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-all group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? "w-8 bg-secondary" 
                  : "w-2 bg-primary-foreground/40 hover:bg-primary-foreground/60"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <HeroSkeleton />
      ) : (
        <div className="relative z-10 container text-center text-primary-foreground pt-32 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-${currentSlide}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-4xl mx-auto"
            >
            {content.badge_text && (
              <motion.span
                variants={textVariants}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/20 backdrop-blur-md rounded-full text-secondary font-medium mb-8 border border-secondary/30"
              >
                <Star className="w-4 h-4 fill-secondary" />
                {content.badge_text}
              </motion.span>
            )}
            
            <motion.h1
              variants={textVariants}
              className="font-arabic text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-wide"
            >
              {content.title}
              <motion.span 
                variants={textVariants}
                className="block text-gradient-gold mt-2 font-kufi"
              >
                {content.subtitle}
              </motion.span>
            </motion.h1>
            
            <motion.p
              variants={textVariants}
              className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              {content.description}
            </motion.p>

            <motion.div
              variants={textVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
            >
              <Button
                size="lg"
                onClick={() => scrollToSection(content.primary_button_link || "#hajj")}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold text-lg px-8 py-7 font-semibold group"
              >
                <span>{content.primary_button_text || "Explore Hajj Packages"}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection(content.secondary_button_link || "#umrah")}
                className="border-2 border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 text-lg px-8 py-7"
              >
                {content.secondary_button_text || "View Umrah Packages"}
              </Button>
            </motion.div>

            {/* Video CTA */}
            {content.video_url && (
              <motion.button
                variants={textVariants}
                onClick={() => setIsVideoOpen(true)}
                className="inline-flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors group"
              >
                <span className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary-foreground/30 transition-all group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current ml-1" />
                </span>
                <span className="font-medium">Watch Video</span>
              </motion.button>
            )}

            {/* Stats */}
            {content.stats && content.stats.length > 0 && (
              <motion.div
                variants={textVariants}
                className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-primary-foreground/20"
              >
                {content.stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="text-center group"
                  >
                    <div className="font-kufi text-4xl md:text-5xl font-bold text-secondary mb-2 group-hover:scale-110 transition-transform">
                      {stat.number}
                    </div>
                    <div className="text-primary-foreground/80 text-sm md:text-base">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Scroll Indicator */}
        <motion.a
          href="#hajj"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 1.2, duration: 0.5 },
            y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
        >
          <span className="text-sm font-medium">Explore Packages</span>
          <ChevronDown className="w-6 h-6" />
        </motion.a>
        </div>
      )}

      {/* Video Modal */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <DialogTitle className="sr-only">Watch Video</DialogTitle>
          <div className="relative aspect-video">
            {content.video_url && isYouTubeUrl(content.video_url) ? (
              <iframe
                src={isVideoOpen ? getEmbedUrl(content.video_url) : ""}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : content.video_url ? (
              <video
                src={content.video_url}
                controls
                autoPlay
                className="w-full h-full"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
