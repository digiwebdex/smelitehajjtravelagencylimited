import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import DynamicPackages from "./DynamicPackages";
import IslamicBorder from "./IslamicBorder";

const HajjPackages = () => {
  return (
    <IslamicBorder>
      <section id="hajj" className="py-24 bg-muted geometric-pattern relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            Our Packages
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-2">
            Hajj Packages 2026
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">حَجّ</span>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Choose from our carefully curated Hajj packages designed to provide you with a comfortable 
            and spiritually enriching experience on this sacred journey.
          </p>
          
          {/* Quick Info */}
          <div className="flex flex-wrap justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-elegant">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Makkah & Madinah</span>
            </div>
            <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-full shadow-elegant">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Dhul Hijjah 1447</span>
            </div>
          </div>
        </motion.div>

        <DynamicPackages type="hajj" />

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-4">
            All prices are subject to change. Government taxes and visa fees included.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              ✓ Govt. Approved Agency
            </span>
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              ✓ 10+ Years Experience
            </span>
            <span className="inline-flex items-center gap-2 text-primary text-sm font-medium">
              ✓ 5000+ Successful Pilgrims
            </span>
          </div>
        </motion.div>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default HajjPackages;
