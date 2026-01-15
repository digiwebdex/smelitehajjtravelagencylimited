import { motion } from "framer-motion";

interface IslamicBorderProps {
  children: React.ReactNode;
  className?: string;
  variant?: "top" | "bottom" | "both";
}

const IslamicBorder = ({ children, className = "", variant = "both" }: IslamicBorderProps) => {
  const patternPath = "M0,20 L10,0 L20,20 L30,0 L40,20 L50,0 L60,20 L70,0 L80,20 L90,0 L100,20";
  
  return (
    <div className={`relative ${className}`}>
      {/* Top Border */}
      {(variant === "top" || variant === "both") && (
        <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden pointer-events-none z-20">
          {/* Animated geometric line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="absolute inset-x-0 top-0 flex justify-center"
          >
            <svg 
              viewBox="0 0 1200 60" 
              className="w-full max-w-6xl h-16"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Left decorative star */}
              <motion.g
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <polygon 
                  points="60,30 66,18 78,18 68,10 72,0 60,6 48,0 52,10 42,18 54,18" 
                  className="fill-secondary/30"
                />
              </motion.g>
              
              {/* Left geometric pattern line */}
              <motion.path
                d="M90,30 L150,30 L165,15 L180,30 L240,30 L255,15 L270,30 L330,30 L345,15 L360,30 L420,30 L435,15 L450,30 L510,30 L525,15 L540,30"
                className="stroke-secondary/40 fill-none"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
              
              {/* Center ornament */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {/* Central 8-pointed star */}
                <polygon 
                  points="600,10 608,22 620,22 612,30 620,38 608,38 600,50 592,38 580,38 588,30 580,22 592,22" 
                  className="fill-secondary/50"
                />
                {/* Inner diamond */}
                <polygon 
                  points="600,20 608,30 600,40 592,30" 
                  className="fill-primary/30"
                />
              </motion.g>
              
              {/* Right geometric pattern line */}
              <motion.path
                d="M660,30 L720,30 L735,15 L750,30 L810,30 L825,15 L840,30 L900,30 L915,15 L930,30 L990,30 L1005,15 L1020,30 L1080,30 L1095,15 L1110,30"
                className="stroke-secondary/40 fill-none"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
              
              {/* Right decorative star */}
              <motion.g
                initial={{ scale: 0, rotate: 180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <polygon 
                  points="1140,30 1146,18 1158,18 1148,10 1152,0 1140,6 1128,0 1132,10 1122,18 1134,18" 
                  className="fill-secondary/30"
                />
              </motion.g>
            </svg>
          </motion.div>
        </div>
      )}
      
      {/* Content */}
      {children}
      
      {/* Bottom Border */}
      {(variant === "bottom" || variant === "both") && (
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden pointer-events-none z-20">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="absolute inset-x-0 bottom-0 flex justify-center"
          >
            <svg 
              viewBox="0 0 1200 60" 
              className="w-full max-w-6xl h-16 rotate-180"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Left decorative star */}
              <motion.g
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <polygon 
                  points="60,30 66,18 78,18 68,10 72,0 60,6 48,0 52,10 42,18 54,18" 
                  className="fill-secondary/20"
                />
              </motion.g>
              
              {/* Geometric wave pattern */}
              <motion.path
                d="M90,30 L150,30 L165,15 L180,30 L240,30 L255,15 L270,30 L330,30 L345,15 L360,30 L420,30 L435,15 L450,30 L510,30 L525,15 L540,30"
                className="stroke-secondary/30 fill-none"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
              
              {/* Center ornament */}
              <motion.g
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <polygon 
                  points="600,10 608,22 620,22 612,30 620,38 608,38 600,50 592,38 580,38 588,30 580,22 592,22" 
                  className="fill-secondary/40"
                />
                <polygon 
                  points="600,20 608,30 600,40 592,30" 
                  className="fill-primary/20"
                />
              </motion.g>
              
              {/* Right geometric wave pattern */}
              <motion.path
                d="M660,30 L720,30 L735,15 L750,30 L810,30 L825,15 L840,30 L900,30 L915,15 L930,30 L990,30 L1005,15 L1020,30 L1080,30 L1095,15 L1110,30"
                className="stroke-secondary/30 fill-none"
                strokeWidth="2"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
              
              {/* Right decorative star */}
              <motion.g
                initial={{ scale: 0, rotate: 180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <polygon 
                  points="1140,30 1146,18 1158,18 1148,10 1152,0 1140,6 1128,0 1132,10 1122,18 1134,18" 
                  className="fill-secondary/20"
                />
              </motion.g>
            </svg>
          </motion.div>
        </div>
      )}
      
      {/* Corner ornaments */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-4 left-4 w-12 h-12 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 50 50" className="w-full h-full">
          <path d="M0,0 L50,0 L50,10 L10,10 L10,50 L0,50 Z" className="fill-secondary" />
          <polygon points="25,5 30,15 25,25 20,15" className="fill-primary/50" />
        </svg>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="absolute top-4 right-4 w-12 h-12 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 50 50" className="w-full h-full rotate-90">
          <path d="M0,0 L50,0 L50,10 L10,10 L10,50 L0,50 Z" className="fill-secondary" />
          <polygon points="25,5 30,15 25,25 20,15" className="fill-primary/50" />
        </svg>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-4 left-4 w-12 h-12 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 50 50" className="w-full h-full -rotate-90">
          <path d="M0,0 L50,0 L50,10 L10,10 L10,50 L0,50 Z" className="fill-secondary" />
          <polygon points="25,5 30,15 25,25 20,15" className="fill-primary/50" />
        </svg>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 0.15, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="absolute bottom-4 right-4 w-12 h-12 pointer-events-none hidden md:block"
      >
        <svg viewBox="0 0 50 50" className="w-full h-full rotate-180">
          <path d="M0,0 L50,0 L50,10 L10,10 L10,50 L0,50 Z" className="fill-secondary" />
          <polygon points="25,5 30,15 25,25 20,15" className="fill-primary/50" />
        </svg>
      </motion.div>
    </div>
  );
};

export default IslamicBorder;
