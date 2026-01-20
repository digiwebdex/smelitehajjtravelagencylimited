import { motion } from "framer-motion";
import { Plane, Building2 } from "lucide-react";
import MakkahIcon from "./icons/MakkahIcon";

interface ServiceTile {
  id: string;
  title: string;
  subtitle: string;
  icon: "hajj" | "umrah" | "visa";
  href: string;
  color: string;
  bgColor: string;
}

const defaultTiles: ServiceTile[] = [
  {
    id: "hajj",
    title: "Hajj Packages",
    subtitle: "Sacred Pilgrimage",
    icon: "hajj",
    href: "#hajj",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 hover:bg-emerald-100 border-emerald-200",
  },
  {
    id: "umrah",
    title: "Umrah Packages",
    subtitle: "Year-Round Journeys",
    icon: "umrah",
    href: "#umrah",
    color: "text-blue-600",
    bgColor: "bg-blue-50 hover:bg-blue-100 border-blue-200",
  },
  {
    id: "visa",
    title: "Visa Services",
    subtitle: "Hassle-Free Processing",
    icon: "visa",
    href: "#visa",
    color: "text-amber-600",
    bgColor: "bg-amber-50 hover:bg-amber-100 border-amber-200",
  },
];

interface HeroServiceTilesProps {
  tiles?: ServiceTile[];
  theme?: "light" | "dark";
}

const HeroServiceTiles = ({ tiles = defaultTiles, theme = "light" }: HeroServiceTilesProps) => {
  const scrollToSection = (href: string) => {
    const sectionId = href.replace("#", "");
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
  };

  const renderIcon = (icon: string, className: string) => {
    switch (icon) {
      case "hajj":
        return <MakkahIcon size={32} className={className} />;
      case "umrah":
        return <Building2 className={`w-8 h-8 ${className}`} />;
      case "visa":
        return <Plane className={`w-8 h-8 ${className}`} />;
      default:
        return <MakkahIcon size={32} className={className} />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap justify-center gap-4 md:gap-6"
    >
      {tiles.map((tile) => (
        <motion.button
          key={tile.id}
          variants={itemVariants}
          onClick={() => scrollToSection(tile.href)}
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.98 }}
          className={`
            relative flex items-center gap-4 px-6 py-4 rounded-2xl border-2 
            transition-all duration-300 shadow-lg hover:shadow-xl
            ${theme === "light" 
              ? tile.bgColor 
              : "bg-white/10 hover:bg-white/15 border-white/20 backdrop-blur-md"
            }
          `}
        >
          {/* Icon Container */}
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center
            ${theme === "light" 
              ? "bg-white shadow-sm" 
              : "bg-white/10"
            }
          `}>
            {renderIcon(tile.icon, theme === "light" ? tile.color : "text-secondary")}
          </div>

          {/* Text Content */}
          <div className="text-left">
            <h3 className={`
              font-semibold text-base md:text-lg
              ${theme === "light" ? "text-foreground" : "text-white"}
            `}>
              {tile.title}
            </h3>
            <p className={`
              text-sm
              ${theme === "light" ? "text-muted-foreground" : "text-white/70"}
            `}>
              {tile.subtitle}
            </p>
          </div>

          {/* Arrow indicator */}
          <motion.span
            className={`ml-2 ${theme === "light" ? tile.color : "text-secondary"}`}
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default HeroServiceTiles;
