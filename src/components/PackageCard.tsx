import { Check, Star, ArrowRight, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface PackageCardProps {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  flightDate?: string;
  index?: number;
}

const VISIBLE_FEATURES_COUNT = 6;

const PackageCard = ({ name, price, features, isPopular, flightDate, index = 0 }: PackageCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasMoreFeatures = features.length > VISIBLE_FEATURES_COUNT;
  const visibleFeatures = isExpanded ? features : features.slice(0, VISIBLE_FEATURES_COUNT);
  const remainingCount = features.length - VISIBLE_FEATURES_COUNT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -8 }}
      className={cn(
        "relative bg-card rounded-2xl shadow-elegant overflow-hidden transition-all duration-300 hover:shadow-lg group flex",
        isPopular && "ring-2 ring-secondary scale-105 z-10"
      )}
    >
      {/* Main Card Content */}
      <div className="flex-1 flex flex-col">
        {isPopular && (
          <div className="bg-secondary text-secondary-foreground py-2 text-center text-sm font-semibold flex items-center justify-center gap-2">
            <Star className="w-4 h-4 fill-current" />
            Most Popular Choice
          </div>
        )}

        {/* Header */}
        <div className={cn(
          "bg-gradient-primary p-6 text-primary-foreground relative overflow-hidden"
        )}>
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary-foreground/10 rounded-full" />
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-primary-foreground/5 rounded-full" />
          
          <h3 className="font-display text-2xl font-light tracking-wide mb-2 relative z-10">{name}</h3>
          {flightDate && (
            <p className="text-sm text-primary-foreground/80 mb-3 relative z-10">
              ✈️ Flight Date: {flightDate}
            </p>
          )}
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="font-heading text-4xl font-bold">{price}</span>
            <span className="text-primary-foreground/70 text-sm">BDT/person</span>
          </div>
        </div>

        {/* Features */}
        <div className="p-6 flex-1 flex flex-col">
          <ul className="space-y-3 mb-4 flex-1">
            <AnimatePresence mode="sync">
              {visibleFeatures.map((feature, idx) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2, delay: idx < VISIBLE_FEATURES_COUNT ? 0 : 0.03 * (idx - VISIBLE_FEATURES_COUNT) }}
                  className="flex items-start gap-3 overflow-hidden"
                >
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    isPopular ? "bg-secondary/20" : "bg-primary/10"
                  )}>
                    <Check className={cn(
                      "w-3 h-3",
                      isPopular ? "text-secondary" : "text-primary"
                    )} />
                  </div>
                  <span className="text-foreground/80 text-sm">{feature}</span>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          {/* Expand/Collapse Button */}
          {hasMoreFeatures && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "flex items-center gap-1 text-sm font-medium mb-4 transition-colors",
                isPopular ? "text-secondary hover:text-secondary/80" : "text-primary hover:text-primary/80"
              )}
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <span className="text-lg font-bold mr-1">+</span>
                  {remainingCount} more inclusion{remainingCount > 1 ? 's' : ''}
                </>
              )}
            </motion.button>
          )}

          <Button
            className={cn(
              "w-full group/btn relative overflow-hidden",
              isPopular
                ? "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-gold"
                : "bg-gradient-primary hover:opacity-90"
            )}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              Book This Package
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </span>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default PackageCard;
