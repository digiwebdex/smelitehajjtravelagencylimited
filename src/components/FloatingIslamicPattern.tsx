import { motion } from "framer-motion";

const FloatingIslamicPattern = () => {
  // Generate random positions for floating elements
  const floatingElements = [
    { id: 1, type: "star", size: 24, x: "5%", y: "20%", duration: 8, delay: 0 },
    { id: 2, type: "geometric", size: 32, x: "15%", y: "60%", duration: 10, delay: 1 },
    { id: 3, type: "star", size: 20, x: "25%", y: "30%", duration: 7, delay: 2 },
    { id: 4, type: "crescent", size: 28, x: "35%", y: "70%", duration: 9, delay: 0.5 },
    { id: 5, type: "geometric", size: 26, x: "45%", y: "15%", duration: 11, delay: 1.5 },
    { id: 6, type: "star", size: 22, x: "55%", y: "50%", duration: 8, delay: 2.5 },
    { id: 7, type: "crescent", size: 30, x: "65%", y: "25%", duration: 10, delay: 0.8 },
    { id: 8, type: "geometric", size: 24, x: "75%", y: "65%", duration: 9, delay: 1.8 },
    { id: 9, type: "star", size: 26, x: "85%", y: "40%", duration: 7, delay: 3 },
    { id: 10, type: "crescent", size: 20, x: "92%", y: "75%", duration: 8, delay: 2.2 },
  ];

  const renderShape = (type: string, size: number) => {
    switch (type) {
      case "star":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L14.09 8.26L21 9.27L16 13.97L17.18 21L12 17.77L6.82 21L8 13.97L3 9.27L9.91 8.26L12 2Z"
              fill="currentColor"
              opacity="0.3"
            />
            <path
              d="M12 5L13.09 9.26L17.5 9.77L14.25 12.47L15.18 17L12 15.02L8.82 17L9.75 12.47L6.5 9.77L10.91 9.26L12 5Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        );
      case "geometric":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <polygon
              points="12,2 22,12 12,22 2,12"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
              opacity="0.4"
            />
            <polygon
              points="12,6 18,12 12,18 6,12"
              stroke="currentColor"
              strokeWidth="1"
              fill="currentColor"
              opacity="0.2"
            />
          </svg>
        );
      case "crescent":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C13.59 21 15.09 20.58 16.4 19.84C14.57 18.53 13.35 16.3 13.35 13.8C13.35 11.3 14.57 9.07 16.4 7.76C15.09 7.02 13.59 6.6 12 6.6C8.58 6.6 5.8 9.38 5.8 12.8"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="currentColor"
              opacity="0.3"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute text-secondary/30"
          style={{
            left: element.x,
            top: element.y,
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            rotate: [0, 360],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: element.duration,
            delay: element.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {renderShape(element.type, element.size)}
        </motion.div>
      ))}
      
      {/* Large decorative pattern in corner */}
      <motion.div
        className="absolute -bottom-20 -right-20 text-secondary/10"
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 100 100" fill="none">
          {/* 8-pointed star pattern */}
          <polygon
            points="50,5 58,35 90,35 65,55 73,85 50,65 27,85 35,55 10,35 42,35"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="currentColor"
            opacity="0.3"
          />
          <circle
            cx="50"
            cy="50"
            r="25"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="none"
            opacity="0.4"
          />
          <circle
            cx="50"
            cy="50"
            r="15"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="currentColor"
            opacity="0.2"
          />
        </svg>
      </motion.div>

      {/* Large decorative pattern in left corner */}
      <motion.div
        className="absolute -bottom-16 -left-16 text-secondary/10"
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
          <polygon
            points="50,10 61,40 93,40 67,58 78,88 50,70 22,88 33,58 7,40 39,40"
            stroke="currentColor"
            strokeWidth="0.5"
            fill="currentColor"
            opacity="0.25"
          />
        </svg>
      </motion.div>
    </div>
  );
};

export default FloatingIslamicPattern;
