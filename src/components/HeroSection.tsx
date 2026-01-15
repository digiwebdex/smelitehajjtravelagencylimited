import { useState, useEffect } from "react";
import { ChevronDown, Play, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-kaaba.jpg";
import { motion } from "framer-motion";

interface HeroContent {
  title: string;
  subtitle?: string;
  description?: string;
  badge_text?: string;
  primary_button_text?: string;
  primary_button_link?: string;
  secondary_button_text?: string;
  secondary_button_link?: string;
  background_image_url?: string;
  stats?: { number: string; label: string }[];
}

const HeroSection = () => {
  const [content, setContent] = useState<HeroContent>({
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
  });

  useEffect(() => {
    fetchHeroContent();
  }, []);

  const fetchHeroContent = async () => {
    const { data } = await supabase
      .from("hero_content")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();
    
    if (data) {
      setContent({
        title: data.title,
        subtitle: data.subtitle || undefined,
        description: data.description || undefined,
        badge_text: data.badge_text || undefined,
        primary_button_text: data.primary_button_text || undefined,
        primary_button_link: data.primary_button_link || undefined,
        secondary_button_text: data.secondary_button_text || undefined,
        secondary_button_link: data.secondary_button_link || undefined,
        background_image_url: data.background_image_url || undefined,
        stats: Array.isArray(data.stats) ? data.stats as { number: string; label: string }[] : undefined,
      });
    }
  };

  const scrollToSection = (id: string) => {
    const sectionId = id.replace("#", "");
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const backgroundImage = content.background_image_url || heroImage;

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Parallax Effect */}
      <div className="absolute inset-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={backgroundImage}
          alt="The Holy Kaaba in Mecca"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
        </div>
      </div>

      {/* Arabic Calligraphy Decorative Elements - Left Side */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 0.15, x: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
        className="absolute left-0 top-0 h-full w-32 md:w-48 lg:w-64 hidden md:flex flex-col justify-center items-center pointer-events-none"
      >
        <div className="font-arabic text-secondary text-6xl md:text-7xl lg:text-9xl leading-none writing-vertical-rl transform rotate-180 select-none opacity-60">
          بِسْمِ اللَّهِ
        </div>
        <div className="font-arabic text-secondary/50 text-4xl md:text-5xl lg:text-7xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none">
          الرَّحْمَنِ
        </div>
        <div className="font-arabic text-secondary/30 text-3xl md:text-4xl lg:text-6xl leading-none writing-vertical-rl transform rotate-180 mt-8 select-none">
          الرَّحِيمِ
        </div>
      </motion.div>

      {/* Arabic Calligraphy Decorative Elements - Right Side */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 0.12, x: 0 }}
        transition={{ duration: 1.2, delay: 0.7 }}
        className="absolute right-0 top-1/4 hidden lg:flex flex-col items-end pointer-events-none pr-4"
      >
        <div className="font-arabic text-secondary text-5xl lg:text-7xl leading-none select-none">
          ٱللَّٰه
        </div>
        <div className="font-arabic text-secondary/60 text-3xl lg:text-5xl leading-none mt-4 select-none">
          أَكْبَر
        </div>
      </motion.div>

      {/* Decorative Islamic Pattern Overlay - Top Right Corner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute top-20 right-8 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 hidden md:block pointer-events-none"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full text-secondary fill-current">
          <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
        </svg>
      </motion.div>

      {/* Floating Decorative Circles */}
      <motion.div
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-[15%] w-20 h-20 border border-secondary/30 rounded-full hidden lg:block"
      />
      <motion.div
        animate={{ y: [10, -10, 10] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-[15%] w-32 h-32 border border-secondary/20 rounded-full hidden lg:block"
      />

      {/* Bottom Left Calligraphy Accent */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 0.1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-20 left-8 hidden lg:block pointer-events-none"
      >
        <div className="font-arabic text-secondary text-4xl lg:text-6xl select-none">
          عيد مبارك
        </div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container text-center text-primary-foreground pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          {content.badge_text && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary/20 backdrop-blur-md rounded-full text-secondary font-medium mb-8 border border-secondary/30"
            >
              <Star className="w-4 h-4 fill-secondary" />
              {content.badge_text}
            </motion.span>
          )}
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-arabic text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight tracking-wide"
          >
            {content.title}
            {content.subtitle && (
              <span className="block text-gradient-gold mt-2 font-kufi">{content.subtitle}</span>
            )}
          </motion.h1>
          
          {content.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              {content.description}
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            {content.primary_button_text && (
              <Button
                size="lg"
                onClick={() => scrollToSection(content.primary_button_link || "#hajj")}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold text-lg px-8 py-7 font-semibold group"
              >
                <span>{content.primary_button_text}</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </motion.span>
              </Button>
            )}
            {content.secondary_button_text && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection(content.secondary_button_link || "#umrah")}
                className="border-2 border-primary-foreground/50 text-primary-foreground bg-primary-foreground/10 backdrop-blur-sm hover:bg-primary-foreground/20 text-lg px-8 py-7"
              >
                {content.secondary_button_text}
              </Button>
            )}
          </motion.div>

          {/* Video CTA */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="inline-flex items-center gap-3 text-primary-foreground/80 hover:text-primary-foreground transition-colors group"
          >
            <span className="w-14 h-14 rounded-full bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary-foreground/30 transition-all group-hover:scale-110">
              <Play className="w-5 h-5 fill-current ml-1" />
            </span>
            <span className="font-medium">Watch Our Journey Video</span>
          </motion.button>

          {/* Stats */}
          {content.stats && content.stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 pt-12 border-t border-primary-foreground/20"
            >
              {content.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
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
          <span className="text-sm font-medium">Scroll to Explore</span>
          <ChevronDown className="w-6 h-6" />
        </motion.a>
      </div>
    </section>
  );
};

export default HeroSection;
