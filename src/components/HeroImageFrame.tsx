import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface HeroImageFrameProps {
  imageSrc: string;
  alt?: string;
  theme?: "light" | "dark";
  frameStyle?: "modern" | "classic" | "diagonal";
}

const HeroImageFrame = ({
  imageSrc,
  alt = "Hero image",
  theme = "light",
  frameStyle = "modern",
}: HeroImageFrameProps) => {
  const isLight = theme === "light";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95, x: -30 }}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative"
    >
      {/* Simple decorative circles */}
      <div className={`
        absolute -top-16 -right-16 w-32 h-32 rounded-full border-2 opacity-30
        ${isLight ? "border-emerald-500" : "border-secondary"}
      `} />
      <div className={`
        absolute -bottom-12 -left-12 w-24 h-24 rounded-full border opacity-20
        ${isLight ? "border-amber-500" : "border-secondary"}
      `} />

      {/* Accent triangles */}
      <div className={`
        absolute -top-8 right-8 w-0 h-0 
        border-l-[20px] border-l-transparent 
        border-b-[35px] border-r-[20px] border-r-transparent
        ${isLight ? "border-b-emerald-500" : "border-b-secondary"}
        opacity-60
      `} />
      <div className={`
        absolute -bottom-6 left-12 w-0 h-0 
        border-l-[15px] border-l-transparent 
        border-t-[25px] border-r-[15px] border-r-transparent
        ${isLight ? "border-t-amber-400" : "border-t-secondary/70"}
        opacity-50
      `} />

      {/* Floating accent circles */}
      <div className={`
        absolute -top-4 -left-4 w-8 h-8 rounded-full
        ${isLight ? "bg-emerald-500" : "bg-secondary"}
        opacity-80 shadow-lg
      `} />
      <div className={`
        absolute top-1/4 -right-6 w-6 h-6 rounded-full
        ${isLight ? "bg-amber-400" : "bg-secondary/80"}
        opacity-70 shadow-md
      `} />

      {/* Main frame container */}
      <div className="relative">
        {/* Outer decorative frame */}
        {frameStyle === "modern" && (
          <>
            <div className={`
              absolute -inset-3 rounded-[2rem] border-2 transform rotate-2
              ${isLight ? "border-emerald-200" : "border-secondary/30"}
            `} />
            <div className={`
              absolute -inset-3 rounded-[2rem] border transform -rotate-1
              ${isLight ? "border-amber-200" : "border-secondary/20"}
            `} />
          </>
        )}

        {frameStyle === "diagonal" && (
          <div className={`
            absolute -inset-4 rounded-3xl transform skew-x-2 -skew-y-1
            ${isLight ? "bg-gradient-to-br from-emerald-100 to-amber-50" : "bg-secondary/10"}
          `} />
        )}

        {/* Main image container */}
        <div
          className={`
            relative overflow-hidden shadow-2xl
            ${frameStyle === "modern" ? "rounded-[1.5rem]" : "rounded-3xl"}
            ${isLight ? "shadow-slate-300/50" : "shadow-black/30"}
          `}
        >
          {/* Image */}
          <motion.img
            src={imageSrc}
            alt={alt}
            className="w-full h-[320px] xl:h-[400px] object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1 }}
            draggable={false}
          />

          {/* Overlay gradient */}
          <div className={`
            absolute inset-0
            ${isLight 
              ? "bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" 
              : "bg-gradient-to-t from-primary/60 via-transparent to-transparent"
            }
          `} />

          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden">
            <div className={`
              absolute -top-12 -right-12 w-24 h-24 transform rotate-45
              ${isLight ? "bg-emerald-500" : "bg-secondary"}
              opacity-90
            `} />
            <Star className={`
              absolute top-3 right-3 w-5 h-5 
              ${isLight ? "text-white" : "text-primary"}
              fill-current
            `} />
          </div>

          {/* Bottom info badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={`
              absolute bottom-4 left-4 right-4 p-4 rounded-xl backdrop-blur-md
              ${isLight 
                ? "bg-white/90 border border-slate-200" 
                : "bg-primary/80 border border-secondary/20"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${isLight 
                  ? "bg-emerald-100 text-emerald-600" 
                  : "bg-secondary/20"
                }
              `}>
                <Star className={`w-6 h-6 ${isLight ? "" : "text-secondary"} fill-current`} />
              </div>
              <div>
                <p className={`font-semibold ${isLight ? "text-foreground" : "text-secondary"}`}>
                  Premium Experience
                </p>
                <p className={`text-sm ${isLight ? "text-muted-foreground" : "text-white/70"}`}>
                  5-Star Hotels & VIP Services
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Static decorative elements */}
      <div className={`
        absolute -top-6 -right-6 w-16 h-16 rounded-2xl flex items-center justify-center
        shadow-lg backdrop-blur-sm border
        ${isLight 
          ? "bg-white border-slate-200" 
          : "bg-secondary/10 border-secondary/20"
        }
      `}>
        <Star className={`w-7 h-7 ${isLight ? "text-amber-500" : "text-secondary"} fill-current`} />
      </div>

      <div className={`
        absolute -bottom-4 -left-4 w-14 h-14 rounded-xl flex items-center justify-center
        shadow-md backdrop-blur-sm border
        ${isLight 
          ? "bg-emerald-50 border-emerald-200" 
          : "bg-white/10 border-white/10"
        }
      `}>
        <div className={`
          w-3 h-3 rounded-full
          ${isLight ? "bg-emerald-500" : "bg-secondary"}
        `} />
      </div>
    </motion.div>
  );
};

export default HeroImageFrame;
