import { motion } from "framer-motion";

const LoadingScreen = () => {
  // Islamic star pattern points
  const createStarPath = (points: number, outerR: number, innerR: number) => {
    const angle = Math.PI / points;
    let path = "";
    for (let i = 0; i < 2 * points; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const x = 50 + r * Math.sin(i * angle);
      const y = 50 - r * Math.cos(i * angle);
      path += (i === 0 ? "M" : "L") + x + "," + y;
    }
    return path + "Z";
  };

  const eightPointStar = createStarPath(8, 45, 20);
  const sixPointStar = createStarPath(6, 30, 15);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-primary flex items-center justify-center overflow-hidden"
    >
      {/* Background geometric pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="islamicGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M10 0L20 10L10 20L0 10Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-secondary"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#islamicGrid)" />
        </svg>
      </div>

      {/* Rotating outer ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-[500px] h-[500px]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle
            cx="50"
            cy="50"
            r="48"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            strokeDasharray="2 4"
            className="text-secondary/30"
          />
        </svg>
      </motion.div>

      {/* Counter-rotating middle ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute w-[350px] h-[350px]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d={eightPointStar}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-secondary/40"
          />
        </svg>
      </motion.div>

      {/* Inner rotating star */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute w-[200px] h-[200px]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d={sixPointStar}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-secondary/50"
          />
        </svg>
      </motion.div>

      {/* Pulsing center circle */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute w-32 h-32 rounded-full border-2 border-secondary/30"
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Crescent and Star */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <svg width="80" height="80" viewBox="0 0 100 100" className="text-secondary">
            {/* Crescent */}
            <motion.path
              d="M50 10 A40 40 0 1 1 50 90 A30 30 0 1 0 50 10"
              fill="currentColor"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            {/* Star */}
            <motion.circle
              cx="75"
              cy="30"
              r="8"
              fill="currentColor"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            />
          </svg>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="font-heading text-2xl text-primary-foreground mb-2">
            SM Elite Hajj
          </h2>
          <p className="text-primary-foreground/70 text-sm">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم
          </p>
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-secondary"
            />
          ))}
        </div>
      </div>

      {/* Corner decorations */}
      {[
        "top-8 left-8",
        "top-8 right-8 rotate-90",
        "bottom-8 left-8 -rotate-90",
        "bottom-8 right-8 rotate-180",
      ].map((position, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 + index * 0.1 }}
          className={`absolute ${position}`}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" className="text-secondary/30">
            <path
              d="M0 0 L30 0 L30 5 L5 5 L5 30 L0 30 Z"
              fill="currentColor"
            />
            <path
              d="M15 0 L15 3 L3 3 L3 15 L0 15 L0 0 Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        </motion.div>
      ))}

      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            y: [0, -20, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            delay: i * 0.5,
          }}
          className="absolute"
          style={{
            left: `${10 + (i * 12)}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-secondary/20">
            <polygon points="10,0 20,10 10,20 0,10" fill="currentColor" />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default LoadingScreen;
