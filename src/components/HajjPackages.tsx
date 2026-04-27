import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import DynamicPackages from "./DynamicPackages";
import IslamicBorder from "./IslamicBorder";
import OptimizedImage from "./ui/optimized-image";
import makkahHaram from "@/assets/makkah-haram.webp";
import { supabase } from "@/integrations/supabase/client";

interface SectionSettings {
  title: string;
  subtitle: string;
  description: string;
  badge_text: string;
  image_url: string | null;
  stats: { value: string; label: string }[];
  success_rate: string;
}

const HajjPackages = () => {
  const [settings, setSettings] = useState<SectionSettings>({
    title: "Hajj Packages 2026",
    subtitle: "حج",
    description: "Premium Hajj packages for the sacred pilgrimage to Makkah. Experience the journey of a lifetime with complete care and guidance.",
    badge_text: "Hajj Packages",
    image_url: null,
    stats: [
      { value: "10+", label: "Hajj Years Experience" },
      { value: "5000+", label: "Happy Pilgrims" }
    ],
    success_rate: "100%"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("section_settings")
        .select("*")
        .eq("section_key", "hajj_packages")
        .single();
      
      if (data) {
        setSettings({
          title: data.title || settings.title,
          subtitle: data.subtitle || settings.subtitle,
          description: data.description || settings.description,
          badge_text: (data as any).badge_text || settings.badge_text,
          image_url: (data as any).image_url || null,
          stats: (data as any).stats || settings.stats,
          success_rate: (data as any).success_rate || "100%"
        });
      }
    };
    fetchSettings();
  }, []);

  return (
    <IslamicBorder>
      <section id="hajj" className="py-12 sm:py-16 lg:py-24 bg-muted relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        </div>
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-12 lg:mb-16">
            {/* Image on LEFT */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-lg">
                <OptimizedImage
                  src={settings.image_url || makkahHaram}
                  alt="Masjid al-Haram in Makkah"
                  className="w-full h-[400px]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
              
              {/* Floating Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-4 right-2 sm:-bottom-8 sm:-right-8 bg-secondary text-secondary-foreground p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-gold z-10"
              >
                <div className="font-heading text-xl sm:text-3xl font-bold">{settings.success_rate}</div>
                <div className="text-xs sm:text-sm font-medium">Success Rate</div>
              </motion.div>
              
              {/* Another floating element */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -top-2 left-2 sm:-top-4 sm:-left-4 bg-card text-foreground p-2 sm:p-4 rounded-lg sm:rounded-xl shadow-elegant hidden xs:block"
              >
                <div className="text-lg sm:text-2xl mb-1">🕋</div>
                <div className="text-[10px] sm:text-xs font-medium">Hotels Near<br />Masjid al-Haram</div>
              </motion.div>
            </motion.div>

            {/* Text on RIGHT */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                {settings.badge_text}
              </span>
              <h2 className="font-calligraphy text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-4">
                {settings.title}
              </h2>
              <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">{settings.subtitle}</span>
              <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
                {settings.description}
              </p>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-6">
                {settings.stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ 
                      scale: 1.05, 
                      y: -4,
                      boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.15)"
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: 0.2 + index * 0.1,
                      scale: { duration: 0.2 },
                      y: { duration: 0.2 }
                    }}
                    className={`bg-gradient-to-br ${index === 0 ? 'from-primary/10 to-primary/5 border-primary/10' : 'from-secondary/10 to-secondary/5 border-secondary/10'} rounded-xl sm:rounded-2xl p-3 sm:p-6 border cursor-pointer`}
                  >
                    <div className={`font-heading text-2xl sm:text-4xl font-bold ${index === 0 ? 'text-primary' : 'text-secondary'} mb-1`}>{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          <DynamicPackages type="hajj" />
        </div>
      </section>
    </IslamicBorder>
  );
};

export default HajjPackages;
