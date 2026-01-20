import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, Play, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kaaba.jpg";
import { motion, AnimatePresence } from "framer-motion";
import HeroServiceTiles from "./HeroServiceTiles";
import HeroImageFrame from "./HeroImageFrame";
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
  const [isLoading, setIsLoading] = useState(true);
  const [autoplayInterval, setAutoplayInterval] = useState(6000);
  const [transitionDuration, setTransitionDuration] = useState(0.9);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"centered" | "split-screen">("split-screen");
  const [heroTheme, setHeroTheme] = useState<"dark" | "light">("dark");
  const [showServiceTiles, setShowServiceTiles] = useState(true);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchHeroContent();
    fetchSliderSettings();
  }, []);

  const fetchSliderSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_key, setting_value")
      .in("setting_key", [
        "hero_autoplay_interval", 
        "hero_transition_speed", 
        "hero_layout_mode",
        "hero_theme",
        "hero_show_service_tiles"
      ]);

    if (data) {
      data.forEach((item) => {
        const value = String(item.setting_value).replace(/"/g, "");
        switch (item.setting_key) {
          case "hero_autoplay_interval":
            setAutoplayInterval((parseInt(value, 10) || 6) * 1000);
            break;
          case "hero_transition_speed":
            switch (value) {
              case "fast": setTransitionDuration(0.5); break;
              case "slow": setTransitionDuration(1.2); break;
              default: setTransitionDuration(0.9);
            }
            break;
          case "hero_layout_mode":
            setLayoutMode(value === "centered" ? "centered" : "split-screen");
            break;
          case "hero_theme":
            setHeroTheme(value === "light" ? "light" : "dark");
            break;
          case "hero_show_service_tiles":
            setShowServiceTiles(value !== "false");
            break;
        }
      });
    }
  };

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
  const isLight = heroTheme === "light";

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

  // Light theme text colors
  const textPrimary = isLight ? "text-foreground" : "text-primary-foreground";
  const textSecondary = isLight ? "text-muted-foreground" : "text-primary-foreground/85";
  const textMuted = isLight ? "text-muted-foreground" : "text-primary-foreground/70";

  return (
    <section 
      id="home" 
      className={`relative min-h-[70vh] flex items-center justify-center overflow-hidden ${isLight ? "bg-background" : ""}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background - Conditional based on theme */}
      {isLight ? (
        /* Light Theme Background */
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-hero-light hero-light-pattern" />
          
          {/* Geometric accents */}
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-96 h-96 border border-emerald-200/40 rounded-full"
          />
          <motion.div
            animate={{ rotate: [360, 0] }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-48 -left-48 w-[500px] h-[500px] border border-amber-200/30 rounded-full"
          />

          {/* Accent shapes */}
          <div className="absolute top-20 left-[15%] w-0 h-0 border-l-[40px] border-l-transparent border-b-[70px] border-b-emerald-500/20 border-r-[40px] border-r-transparent" />
          <div className="absolute bottom-32 right-[10%] w-0 h-0 border-l-[30px] border-l-transparent border-t-[50px] border-t-amber-400/25 border-r-[30px] border-r-transparent" />
          <div className="absolute top-1/3 right-[5%] w-16 h-16 bg-emerald-500/10 rounded-full" />
          <div className="absolute bottom-1/4 left-[8%] w-12 h-12 bg-amber-400/15 rounded-full" />
          
          {/* Subtle background image overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-light-${currentSlide}`}
              variants={imageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute right-0 top-0 w-1/2 h-full opacity-10"
            >
              <img
                src={backgroundImage}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
            </motion.div>
          </AnimatePresence>
        </div>
      ) : (
        /* Dark Theme Background */
        <div className="absolute inset-0 bg-primary">
          {/* Base gradient layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-emerald-900/90 z-[1]" />
          
          {/* Background image */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`bg-${currentSlide}`}
              variants={imageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0 z-[2]"
            >
              <img
                src={backgroundImage}
                alt="Hero background"
                className="w-full h-full object-cover"
                draggable={false}
              />
            </motion.div>
          </AnimatePresence>

          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/50 to-transparent z-[3]" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-transparent to-primary/60 z-[3]" />
        </div>
      )}

      {/* Premium Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Left Arrow */}
          <motion.button
            onClick={goToPrevious}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 group
              ${isLight 
                ? "bg-white/80 border-slate-200 text-foreground hover:bg-white hover:border-emerald-300" 
                : "bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:border-secondary/30"
              }`}
            aria-label="Previous slide"
          >
            <ChevronLeft className={`w-6 h-6 ${isLight ? "group-hover:text-emerald-600" : "group-hover:text-secondary"} transition-colors`} />
          </motion.button>

          {/* Right Arrow */}
          <motion.button
            onClick={goToNext}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full backdrop-blur-md border flex items-center justify-center transition-all duration-300 group
              ${isLight 
                ? "bg-white/80 border-slate-200 text-foreground hover:bg-white hover:border-emerald-300" 
                : "bg-primary-foreground/5 border-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/15 hover:border-secondary/30"
              }`}
            aria-label="Next slide"
          >
            <ChevronRight className={`w-6 h-6 ${isLight ? "group-hover:text-emerald-600" : "group-hover:text-secondary"} transition-colors`} />
          </motion.button>
        </>
      )}


      {/* Content - Conditional Layout */}
      {isLoading ? (
        <HeroSkeleton />
      ) : layoutMode === "centered" ? (
        /* Full-Width Centered Layout */
        <div className={`relative z-10 container text-center pt-40 md:pt-44 lg:pt-48 pb-20 ${textPrimary}`}>
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
                  <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium border shadow-lg
                    ${isLight 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-secondary/15 text-secondary border-secondary/25 backdrop-blur-md shadow-secondary/10"
                    }`}>
                    <Star className={`w-4 h-4 ${isLight ? "text-emerald-600" : ""} fill-current`} />
                    {content.badge_text}
                  </span>
                </motion.div>
              )}
              
              {/* Title */}
              <motion.h1
                variants={itemVariants}
                className={`font-arabic text-4xl md:text-5xl lg:text-7xl font-bold mb-4 leading-normal tracking-wide overflow-visible ${textPrimary}`}
              >
                <span className="inline-block">{content.title}</span>
                {content.subtitle && (
                  <motion.span 
                    variants={itemVariants}
                    className={`block mt-2 font-kufi pb-2 ${isLight ? "text-emerald-600" : "text-gradient-gold"}`}
                  >
                    {content.subtitle}
                  </motion.span>
                )}
              </motion.h1>
              
              {/* Description */}
              <motion.p
                variants={itemVariants}
                className={`text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed ${textSecondary}`}
              >
                {content.description}
              </motion.p>

              {/* Service Tiles */}
              {showServiceTiles && (
                <motion.div variants={itemVariants} className="mb-10">
                  <HeroServiceTiles theme={heroTheme} />
                </motion.div>
              )}


              {/* Video CTA */}
              {content.video_url && (
                <motion.button
                  variants={itemVariants}
                  onClick={() => setIsVideoOpen(true)}
                  className={`inline-flex items-center gap-3 transition-colors group ${textMuted} hover:${textPrimary}`}
                >
                  <span className={`w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-110
                    ${isLight 
                      ? "bg-white border border-slate-200 group-hover:border-emerald-300" 
                      : "bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 group-hover:bg-primary-foreground/20 group-hover:border-secondary/40"
                    }`}>
                    <Play className="w-5 h-5 fill-current ml-1" />
                  </span>
                  <span className="font-medium">Watch Video</span>
                </motion.button>
              )}

              {/* Stats */}
              {content.stats && content.stats.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className={`grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t ${isLight ? "border-slate-200" : "border-primary-foreground/15"}`}
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
                        className={`font-kufi text-4xl md:text-5xl font-bold mb-2 ${isLight ? "text-emerald-600" : "text-secondary"}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {stat.number}
                      </motion.div>
                      <div className={`text-sm md:text-base ${textMuted}`}>
                        {stat.label}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      ) : (
        /* Split-Screen Layout */
        <div className="relative z-10 w-full min-h-screen flex items-center pt-24 md:pt-28 lg:pt-32">
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
                  className={`text-left order-2 lg:order-1 ${textPrimary}`}
                >
                  {/* Badge */}
                  {content.badge_text && (
                    <motion.div variants={itemVariants} className="mb-6">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border shadow-lg
                        ${isLight 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-secondary/15 text-secondary border-secondary/25 backdrop-blur-md shadow-secondary/10"
                        }`}>
                        <Star className={`w-3.5 h-3.5 ${isLight ? "text-emerald-600" : ""} fill-current`} />
                        {content.badge_text}
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Title */}
                  <motion.h1
                    variants={itemVariants}
                    className={`font-arabic text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 leading-normal tracking-wide overflow-visible ${textPrimary}`}
                  >
                    <span className="inline-block">{content.title}</span>
                    {content.subtitle && (
                      <motion.span 
                        variants={itemVariants}
                        className={`block mt-1 font-kufi pb-1 text-3xl md:text-4xl lg:text-5xl xl:text-6xl ${isLight ? "text-emerald-600" : "text-gradient-gold"}`}
                      >
                        {content.subtitle}
                      </motion.span>
                    )}
                  </motion.h1>
                  
                  {/* Description */}
                  <motion.p
                    variants={itemVariants}
                    className={`text-base md:text-lg max-w-lg mb-8 leading-relaxed ${textSecondary}`}
                  >
                    {content.description}
                  </motion.p>

                  {/* Service Tiles - Compact for split view */}
                  {showServiceTiles && (
                    <motion.div variants={itemVariants} className="mb-8">
                      <HeroServiceTiles theme={heroTheme} />
                    </motion.div>
                  )}


                  {/* Video CTA */}
                  {content.video_url && (
                    <motion.button
                      variants={itemVariants}
                      onClick={() => setIsVideoOpen(true)}
                      className={`inline-flex items-center gap-3 transition-colors group mb-8 ${textMuted}`}
                    >
                      <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-all group-hover:scale-110
                        ${isLight 
                          ? "bg-white border border-slate-200 group-hover:border-emerald-300" 
                          : "bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 group-hover:bg-primary-foreground/20 group-hover:border-secondary/40"
                        }`}>
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </span>
                      <span className="font-medium text-sm">Watch Video</span>
                    </motion.button>
                  )}

                  {/* Stats - Compact */}
                  {content.stats && content.stats.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className={`flex flex-wrap gap-6 pt-6 border-t ${isLight ? "border-slate-200" : "border-primary-foreground/15"}`}
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
                            className={`font-kufi text-2xl md:text-3xl font-bold mb-1 ${isLight ? "text-emerald-600" : "text-secondary"}`}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            {stat.number}
                          </motion.div>
                          <div className={`text-xs md:text-sm ${textMuted}`}>
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
                  <HeroImageFrame
                    key={`frame-${currentSlide}`}
                    imageSrc={backgroundImage}
                    alt="Hero feature"
                    theme={heroTheme}
                    frameStyle="modern"
                  />
                </AnimatePresence>
              </div>
            </div>
          </div>

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
