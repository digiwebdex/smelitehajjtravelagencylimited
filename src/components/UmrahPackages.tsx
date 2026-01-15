import medinaImage from "@/assets/medina-mosque.jpg";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import DynamicPackages from "./DynamicPackages";
import IslamicBorder from "./IslamicBorder";

const UmrahPackages = () => {
  return (
    <IslamicBorder>
      <section id="umrah" className="py-24 bg-background relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-muted to-transparent" />
        </div>
        
        <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              Spiritual Journey
            </span>
            <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-2">
              Umrah Packages
            </h2>
            <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">عُمْرَة</span>
            <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
              Embark on your spiritual journey with our exclusive Umrah packages. 
              We provide premium accommodation, transportation, and guidance to ensure 
              your Umrah is a peaceful and memorable experience.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/10"
              >
                <div className="font-heading text-4xl font-bold text-primary mb-1">15+</div>
                <div className="text-sm text-muted-foreground">Umrah Trips Per Year</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-6 border border-secondary/10"
              >
                <div className="font-heading text-4xl font-bold text-secondary mb-1">3000+</div>
                <div className="text-sm text-muted-foreground">Happy Umrah Pilgrims</div>
              </motion.div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-lg">
              <img
                src={medinaImage}
                alt="Masjid al-Nabawi in Medina"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            
            {/* Floating Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-8 -left-8 bg-secondary text-secondary-foreground p-6 rounded-2xl shadow-gold"
            >
              <div className="font-heading text-3xl font-bold">100%</div>
              <div className="text-sm font-medium">Visa Success Rate</div>
            </motion.div>
            
            {/* Another floating element */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="absolute -top-4 -right-4 bg-card text-foreground p-4 rounded-xl shadow-elegant"
            >
              <div className="text-2xl mb-1">🕌</div>
              <div className="text-xs font-medium">Hotels Near<br />Masjid Nabawi</div>
            </motion.div>
          </motion.div>
        </div>

        <DynamicPackages type="umrah" />
      </div>
      </section>
    </IslamicBorder>
  );
};

export default UmrahPackages;
