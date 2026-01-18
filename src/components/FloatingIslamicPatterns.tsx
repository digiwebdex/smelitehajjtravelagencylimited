import { motion } from "framer-motion";

interface PatternProps {
  mousePosition: { x: number; y: number };
}

// Islamic 8-pointed star SVG path
const IslamicStar = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path
      d="M50 0 L58 38 L96 38 L65 62 L77 100 L50 75 L23 100 L35 62 L4 38 L42 38 Z"
      fill="currentColor"
    />
  </svg>
);

// Islamic crescent moon
const Crescent = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <path
      d="M50 5 C25 5 5 25 5 50 C5 75 25 95 50 95 C35 85 25 68 25 50 C25 32 35 15 50 5"
      fill="currentColor"
    />
  </svg>
);

// Geometric octagon
const Octagon = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <polygon
      points="30,0 70,0 100,30 100,70 70,100 30,100 0,70 0,30"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

// Diamond shape
const Diamond = ({ size, className }: { size: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
    <polygon
      points="50,0 100,50 50,100 0,50"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

const patterns = [
  { id: 1, type: 'star', x: '10%', y: '20%', size: 24, delay: 0, duration: 20, parallaxFactor: 15 },
  { id: 2, type: 'octagon', x: '85%', y: '15%', size: 32, delay: 2, duration: 25, parallaxFactor: -20 },
  { id: 3, type: 'diamond', x: '75%', y: '70%', size: 20, delay: 4, duration: 18, parallaxFactor: 12 },
  { id: 4, type: 'star', x: '20%', y: '75%', size: 18, delay: 1, duration: 22, parallaxFactor: -10 },
  { id: 5, type: 'crescent', x: '90%', y: '45%', size: 28, delay: 3, duration: 24, parallaxFactor: 18 },
  { id: 6, type: 'octagon', x: '5%', y: '50%', size: 22, delay: 5, duration: 20, parallaxFactor: -15 },
  { id: 7, type: 'diamond', x: '60%', y: '10%', size: 16, delay: 2.5, duration: 19, parallaxFactor: 8 },
  { id: 8, type: 'star', x: '40%', y: '85%', size: 20, delay: 1.5, duration: 21, parallaxFactor: -12 },
  { id: 9, type: 'crescent', x: '15%', y: '35%', size: 14, delay: 4.5, duration: 23, parallaxFactor: 10 },
  { id: 10, type: 'octagon', x: '70%', y: '40%', size: 18, delay: 0.5, duration: 17, parallaxFactor: -8 },
  { id: 11, type: 'star', x: '55%', y: '60%', size: 12, delay: 3.5, duration: 26, parallaxFactor: 6 },
  { id: 12, type: 'diamond', x: '30%', y: '25%', size: 14, delay: 2, duration: 20, parallaxFactor: -14 },
];

const FloatingIslamicPatterns = ({ mousePosition }: PatternProps) => {
  const renderPattern = (type: string, size: number) => {
    const className = "text-secondary";
    switch (type) {
      case 'star':
        return <IslamicStar size={size} className={className} />;
      case 'crescent':
        return <Crescent size={size} className={className} />;
      case 'octagon':
        return <Octagon size={size} className={className} />;
      case 'diamond':
        return <Diamond size={size} className={className} />;
      default:
        return <IslamicStar size={size} className={className} />;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {patterns.map((pattern) => (
        <motion.div
          key={pattern.id}
          className="absolute opacity-[0.08]"
          style={{ left: pattern.x, top: pattern.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0.04, 0.1, 0.04],
            scale: [0.8, 1.1, 0.8],
            rotate: [0, 180, 360],
            x: mousePosition.x * pattern.parallaxFactor,
            y: mousePosition.y * (pattern.parallaxFactor * 0.6),
          }}
          transition={{
            opacity: { duration: pattern.duration, repeat: Infinity, ease: "easeInOut", delay: pattern.delay },
            scale: { duration: pattern.duration, repeat: Infinity, ease: "easeInOut", delay: pattern.delay },
            rotate: { duration: pattern.duration * 2, repeat: Infinity, ease: "linear", delay: pattern.delay },
            x: { duration: 0.5, ease: "easeOut" },
            y: { duration: 0.5, ease: "easeOut" },
          }}
        >
          {renderPattern(pattern.type, pattern.size)}
        </motion.div>
      ))}

      {/* Additional subtle floating dots */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-1 h-1 bg-secondary rounded-full opacity-[0.15]"
          style={{
            left: `${15 + i * 10}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: mousePosition.x * (5 + i * 2),
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            y: { duration: 4 + i * 0.5, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 0.4, ease: "easeOut" },
            opacity: { duration: 3 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      ))}
    </div>
  );
};

export default FloatingIslamicPatterns;
