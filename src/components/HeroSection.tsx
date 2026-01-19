import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, Play, Star, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kaaba.jpg";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
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
  const [autoplayInterval, setAutoplayInterval] = useState(6000);
  const [transitionDuration, setTransitionDuration] = useState(0.9);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"centered" | "split-screen">("split-screen");
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mouse parallax values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const parallaxX = useTransform(mouseX, [-1, 1], [-20, 20]);
  const parallaxY = useTransform(mouseY, [-1, 1], [-15, 15]);

  useEffect(() => {
    fetchHeroContent();
    fetchSliderSettings();
  }, []);

  const fetchSliderSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value")
      .in("setting_key", ["hero_autoplay_interval", "hero_transition_speed", "hero_layout_mode"]);

    if (data) {
      data.forEach((item) => {
        if (item.setting_key === "hero_autoplay_interval") {
          const seconds = parseInt(String(item.setting_value).replace(/"/g, ""), 10) || 6;
          setAutoplayInterval(seconds * 1000);
        } else if (item.setting_key === "hero_transition_speed") {
          const speed = String(item.setting_value).replace(/"/g, "");
          switch (speed) {
            case "fast":
              setTransitionDuration(0.5);
              break;
            case "slow":
              setTransitionDuration(1.2);
              break;
            default:
              setTransitionDuration(0.9);
          }
        } else if (item.setting_key === "hero_layout_mode") {
          const mode = String(item.setting_value).replace(/"/g, "");
          setLayoutMode(mode === "centered" ? "centered" : "split-screen");
        }
      });
    }
  };

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x, y });
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Progress bar & auto-slide
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1 || isHovered) {
      if (progressRef.current) clearInterval(progressRef.current);
      return;
    }
    
    setProgress(0);
    const step = 100 / (autoplayInterval / 50);
    
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentSlide(curr => (curr + 1) % slides.length);
          return 0;
        }
        return prev + step;
      });
    }, 50);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isAutoPlaying, slides.length, autoplayInterval, currentSlide, isHovered]);

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

  const HeroSkeleton = () => (
    <div className="relative z-10 container text-center pt-32 pb-20">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mb-8">
          <Skeleton className="h-10 w-64 rounded-full bg-primary-foreground/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4 mb-8">
          <Skeleton className="h-16 md:h-20 w-3/4 mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-12 md:h-16 w-1/2 mx-auto bg-secondary/20" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3 mb-12">
          <Skeleton className="h-6 w-full max-w-2xl mx-auto bg-primary-foreground/10" />
          <Skeleton className="h-6 w-4/5 max-w-xl mx-auto bg-primary-foreground/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Skeleton className="h-14 w-56 mx-auto sm:mx-0 bg-secondary/30" />
          <Skeleton className="h-14 w-48 mx-auto sm:mx-0 bg-primary-foreground/10" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-primary-foreground/20">
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
    setProgress(0);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setProgress(0);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setProgress(0);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  const toggleAutoplay = useCallback(() => {
    setIsAutoPlaying(prev => !prev);
    if (!isAutoPlaying) setProgress(0);
  }, [isAutoPlaying]);

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
    if (distance > minSwipeDistance) goToNext();
    else if (distance < -minSwipeDistance) goToPrevious();
  };

  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=1`;
    return url;
  };

  const isYouTubeUrl = (url: string) => url?.includes("youtube.com") || url?.includes("youtu.be");

  const scrollToSection = (id: string) => {
    const sectionId = id.replace("#", "");
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const content = slides[currentSlide] || defaultSlides[0];
  const backgroundImage = content.background_image_url || heroImage;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
    exit: {
      opacity: 0,
      transition: { duration: transitionDuration * 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: transitionDuration * 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
    exit: {
      opacity: 0,
      y: -20,
      filter: "blur(5px)",
      transition: { duration: transitionDuration * 0.3 },
    },
  };

  const imageVariants = {
    initial: { scale: 1.15, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { duration: transitionDuration * 1.2, ease: [0.25, 0.46, 0.45, 0.94] as const }
    },
    exit: { 
      scale: 1.05, 
      opacity: 0,
      transition: { duration: transitionDuration * 0.5 }
    },
  };

  return (
    <section 
      id="home" 
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Multi-layer Background */}
      <div className="absolute inset-0 bg-primary">
        {/* Base gradient layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-emerald-900/90 z-[1]" />
        
        {/* Animated background image */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`bg-${currentSlide}`}
            variants={imageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute inset-0 z-[2]"
          >
            <motion.div
              className="absolute inset-0"
              style={{ x: parallaxX, y: parallaxY }}
            >
              <img
                src={backgroundImage}
                alt="Hero background"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Overlay gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent z-[3]" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-transparent to-primary/60 z-[3]" />
        
        {/* Animated mesh gradient overlay */}
        <motion.div 
          className="absolute inset-0 z-[4] opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, hsl(42 78% 55% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, hsl(42 78% 55% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 80%, hsl(42 78% 55% / 0.15) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 50%, hsl(42 78% 55% / 0.15) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        {/* Noise texture overlay */}
        <div 
          className="absolute inset-0 z-[5] opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <FloatingIslamicPatterns mousePosition={mousePosition} />

      {/* Decorative Elements - Left */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.12, x: mousePosition.x * -15, y: mousePosition.y * -10 }}
        transition={{ duration: 0.3 }}
        className="absolute left-0 top-0 h-full w-32 md:w-48 lg:w-64 hidden md:flex flex-col justify-center items-center pointer-events-none z-[6]"
      >
        <motion.div animate={{ x: mousePosition.x * -8, y: mousePosition.y * -5 }} className="font-arabic text-secondary text-6xl md:text-7xl lg:text-9xl leading-none writing-vertical-rl transform rotate-180 select-none opacity-60">
          بِسْمِ اللَّهِ
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * -12, y: mousePosition.y * -8 }} className="font-arabic text-secondary/50 text-4xl md:text-5xl lg:text-7xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none">
          الرَّحْمَنِ
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * -6, y: mousePosition.y * -4 }} className="font-arabic text-secondary/30 text-3xl md:text-4xl lg:text-6xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none">
          الرَّحِيمِ
        </motion.div>
      </motion.div>

      {/* Icons - Right */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 0.2, x: mousePosition.x * 20, y: mousePosition.y * 15 }}
        className="absolute right-4 top-1/4 hidden lg:flex flex-col items-center gap-8 pointer-events-none z-[6]"
      >
        <motion.div animate={{ x: mousePosition.x * 10, y: mousePosition.y * 8 }} className="text-secondary drop-shadow-lg">
          <MakkahIcon size={80} />
        </motion.div>
        <motion.div animate={{ x: mousePosition.x * 15, y: mousePosition.y * 12 }} className="text-secondary/80">
          <MadinahIcon size={72} />
        </motion.div>
      </motion.div>

      {/* Floating circles */}
      <motion.div
        animate={{ y: [-10, 10, -10], x: mousePosition.x * 25 }}
        transition={{ y: { duration: 6, repeat: Infinity }, x: { duration: 0.4 } }}
        className="absolute top-1/4 left-[15%] w-20 h-20 border border-secondary/20 rounded-full hidden lg:block z-[6]"
      />
      <motion.div
        animate={{ y: [10, -10, 10], x: mousePosition.x * -20 }}
        transition={{ y: { duration: 5, repeat: Infinity }, x: { duration: 0.5 } }}
        className="absolute bottom-1/4 right-[15%] w-32 h-32 border border-secondary/15 rounded-full hidden lg:block z-[6]"
      />

      {/* Premium Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Left Arrow */}
          <motion.button
            onClick={goToPrevious}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-primary-foreground/5 backdrop-blur-md border border-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/15 hover:border-secondary/30 transition-all duration-300 group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 group-hover:text-secondary transition-colors" />
          </motion.button>

          {/* Right Arrow */}
          <motion.button
            onClick={goToNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-primary-foreground/5 backdrop-blur-md border border-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/15 hover:border-secondary/30 transition-all duration-300 group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 group-hover:text-secondary transition-colors" />
          </motion.button>
        </>
      )}

      {/* Bottom Controls Bar */}
      {slides.length > 1 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex items-center gap-6">
          {/* Slide Counter */}
          <div className="flex items-center gap-2 text-primary-foreground/80 font-medium">
            <span className="text-2xl text-secondary">{String(currentSlide + 1).padStart(2, '0')}</span>
            <span className="text-primary-foreground/40">/</span>
            <span className="text-sm">{String(slides.length).padStart(2, '0')}</span>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className="relative h-1.5 rounded-full overflow-hidden transition-all duration-300"
                style={{ width: index === currentSlide ? '48px' : '24px' }}
                aria-label={`Go to slide ${index + 1}`}
              >
                <div className="absolute inset-0 bg-primary-foreground/20" />
                {index === currentSlide && (
                  <motion.div
                    className="absolute inset-0 bg-secondary origin-left"
                    style={{ scaleX: progress / 100 }}
                  />
                )}
                {index < currentSlide && (
                  <div className="absolute inset-0 bg-secondary/60" />
                )}
              </button>
            ))}
          </div>

          {/* Play/Pause Button */}
          <motion.button
            onClick={toggleAutoplay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-all"
            aria-label={isAutoPlaying ? "Pause slideshow" : "Play slideshow"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>
        </div>
      )}

      {/* Content - Conditional Layout */}
      {isLoading ? (
        <HeroSkeleton />
      ) : layoutMode === "centered" ? (
        /* Full-Width Centered Layout */
        <div className="relative z-10 container text-center text-primary-foreground pt-32 pb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={`content-centered-${currentSlide}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="max-w-4xl mx-auto"
            >
              {/* Badge */}
              {content.badge_text && (
                <motion.div variants={itemVariants} className="mb-8">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/15 backdrop-blur-md rounded-full text-secondary font-medium border border-secondary/25 shadow-lg shadow-secondary/10">
                    <Star className="w-4 h-4 fill-secondary" />
                    {content.badge_text}
                  </span>
                </motion.div>
              )}
              
              {/* Title */}
              <motion.h1
                variants={itemVariants}
                className="font-arabic text-5xl md:text-7xl lg:text-8xl font-bold mb-6 leading-normal tracking-wide overflow-visible"
              >
                <span className="inline-block">{content.title}</span>
                {content.subtitle && (
                  <motion.span 
                    variants={itemVariants}
                    className="block text-gradient-gold mt-2 font-kufi pb-2"
                  >
                    {content.subtitle}
                  </motion.span>
                )}
              </motion.h1>
              
              {/* Description */}
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-primary-foreground/85 max-w-2xl mx-auto mb-12 leading-relaxed"
              >
                {content.description}
              </motion.p>

              {/* Buttons */}
              <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  onClick={() => scrollToSection(content.primary_button_link || "#hajj")}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/25 text-lg px-8 py-7 font-semibold group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    {content.primary_button_text || "Explore Hajj Packages"}
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="ml-2"
                    >
                      →
                    </motion.span>
                  </span>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-secondary via-amber-400 to-secondary"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6 }}
                  />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection(content.secondary_button_link || "#umrah")}
                  className="border-2 border-primary-foreground/30 text-primary-foreground bg-primary-foreground/5 backdrop-blur-md hover:bg-primary-foreground/15 hover:border-primary-foreground/50 text-lg px-8 py-7 transition-all duration-300"
                >
                  {content.secondary_button_text || "View Umrah Packages"}
                </Button>
              </motion.div>

              {/* Video CTA */}
              {content.video_url && (
                <motion.button
                  variants={itemVariants}
                  onClick={() => setIsVideoOpen(true)}
                  className="inline-flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors group"
                >
                  <span className="w-14 h-14 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/20 group-hover:border-secondary/40 transition-all group-hover:scale-110">
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </span>
                  <span className="font-medium">Watch Video</span>
                </motion.button>
              )}

              {/* Stats */}
              {content.stats && content.stats.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-primary-foreground/15"
                >
                  {content.stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className="text-center group cursor-default"
                    >
                      <motion.div 
                        className="font-kufi text-4xl md:text-5xl font-bold text-secondary mb-2"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className="text-primary-foreground/70 text-sm md:text-base">
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
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ 
              opacity: { delay: 1.2, duration: 0.5 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            <span className="text-sm font-medium tracking-wide">Explore Packages</span>
            <div className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-current"
              />
            </div>
          </motion.a>
        </div>
      ) : (
        /* Split-Screen Layout */
        <div className="relative z-10 w-full min-h-screen flex items-center">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              {/* Left Side - Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${currentSlide}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-left text-primary-foreground pt-24 lg:pt-0 order-2 lg:order-1"
                >
                  {/* Badge */}
                  {content.badge_text && (
                    <motion.div variants={itemVariants} className="mb-6">
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/15 backdrop-blur-md rounded-full text-secondary text-sm font-medium border border-secondary/25 shadow-lg shadow-secondary/10">
                        <Star className="w-3.5 h-3.5 fill-secondary" />
                        {content.badge_text}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Title */}
                  <motion.h1
                    variants={itemVariants}
                    className="font-arabic text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 leading-normal tracking-wide overflow-visible"
                  >
                    <span className="inline-block">{content.title}</span>
                    {content.subtitle && (
                      <motion.span 
                        variants={itemVariants}
                        className="block text-gradient-gold mt-1 font-kufi pb-1 text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
                      >
                        {content.subtitle}
                      </motion.span>
                    )}
                  </motion.h1>
                  
                  {/* Description */}
                  <motion.p
                    variants={itemVariants}
                    className="text-base md:text-lg text-primary-foreground/85 max-w-lg mb-8 leading-relaxed"
                  >
                    {content.description}
                  </motion.p>

                  {/* Buttons */}
                  <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-6">
                    <Button
                      size="lg"
                      onClick={() => scrollToSection(content.primary_button_link || "#hajj")}
                      className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/25 text-base px-6 py-6 font-semibold group relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center">
                        {content.primary_button_text || "Explore Hajj Packages"}
                        <motion.span
                          animate={{ x: [0, 5, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="ml-2"
                        >
                          →
                        </motion.span>
                      </span>
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-secondary via-amber-400 to-secondary"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => scrollToSection(content.secondary_button_link || "#umrah")}
                      className="border-2 border-primary-foreground/30 text-primary-foreground bg-primary-foreground/5 backdrop-blur-md hover:bg-primary-foreground/15 hover:border-primary-foreground/50 text-base px-6 py-6 transition-all duration-300"
                    >
                      {content.secondary_button_text || "View Umrah Packages"}
                    </Button>
                  </motion.div>

                  {/* Video CTA */}
                  {content.video_url && (
                    <motion.button
                      variants={itemVariants}
                      onClick={() => setIsVideoOpen(true)}
                      className="inline-flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors group mb-8"
                    >
                      <span className="w-12 h-12 rounded-full bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 flex items-center justify-center group-hover:bg-primary-foreground/20 group-hover:border-secondary/40 transition-all group-hover:scale-110">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </span>
                      <span className="font-medium text-sm">Watch Video</span>
                    </motion.button>
                  )}

                  {/* Stats - Compact */}
                  {content.stats && content.stats.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="flex flex-wrap gap-6 pt-6 border-t border-primary-foreground/15"
                    >
                      {content.stats.slice(0, 3).map((stat, index) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                          className="text-left group cursor-default"
                        >
                          <motion.div 
                            className="font-kufi text-2xl md:text-3xl font-bold text-secondary mb-1"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {stat.number}
                          </motion.div>
                          <div className="text-primary-foreground/70 text-xs md:text-sm">
                            {stat.label}
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Right Side - Image */}
              <div className="relative order-1 lg:order-2 hidden lg:block">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`split-image-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.9, x: 50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: -30 }}
                    transition={{ duration: transitionDuration, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="relative"
                  >
                    {/* Decorative frame */}
                    <div className="absolute -inset-4 border-2 border-secondary/20 rounded-3xl transform rotate-2" />
                    <div className="absolute -inset-4 border border-secondary/10 rounded-3xl transform -rotate-1" />
                    
                    {/* Main image container */}
                    <motion.div
                      className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30"
                      style={{ x: parallaxX, y: parallaxY }}
                    >
                      {/* Image */}
                      <motion.img
                        src={backgroundImage}
                        alt="Hero feature"
                        className="w-full h-[500px] xl:h-[600px] object-cover"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: transitionDuration * 1.2 }}
                        draggable={false}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-transparent to-transparent" />
                      
                      {/* Floating badge on image */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="absolute bottom-6 left-6 right-6 p-4 bg-primary/80 backdrop-blur-md rounded-xl border border-secondary/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                            <MakkahIcon size={24} className="text-secondary" />
                          </div>
                          <div>
                            <p className="text-secondary font-semibold text-sm">Premium Experience</p>
                            <p className="text-primary-foreground/70 text-xs">5-Star Hotels & VIP Services</p>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>

                    {/* Floating elements around image */}
                    <motion.div
                      animate={{ y: [-10, 10, -10] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute -top-8 -right-8 w-20 h-20 bg-secondary/10 backdrop-blur-sm rounded-2xl border border-secondary/20 flex items-center justify-center"
                    >
                      <Star className="w-8 h-8 text-secondary fill-secondary/30" />
                    </motion.div>
                    
                    <motion.div
                      animate={{ y: [10, -10, 10] }}
                      transition={{ duration: 5, repeat: Infinity }}
                      className="absolute -bottom-6 -left-6 w-16 h-16 bg-primary-foreground/10 backdrop-blur-sm rounded-xl border border-primary-foreground/10 flex items-center justify-center"
                    >
                      <MadinahIcon size={32} className="text-primary-foreground/60" />
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <motion.a
            href="#hajj"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 8, 0] }}
            transition={{ 
              opacity: { delay: 1.2, duration: 0.5 },
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            <span className="text-sm font-medium tracking-wide">Explore Packages</span>
            <div className="w-6 h-10 rounded-full border-2 border-current flex items-start justify-center p-1.5">
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-current"
              />
            </div>
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
              <video src={content.video_url} controls autoPlay className="w-full h-full" />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;
