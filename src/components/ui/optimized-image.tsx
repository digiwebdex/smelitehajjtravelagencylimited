import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

/**
 * OptimizedImage component with lazy loading, WebP detection, and responsive srcset
 * 
 * Features:
 * - Native lazy loading for images below the fold
 * - Automatic srcset generation for responsive images
 * - Fallback handling for broken images
 * - Blur placeholder while loading
 */
const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  onLoad,
  onError,
  fallbackSrc = "/placeholder.svg",
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  // Generate srcset for responsive images (only for http URLs, not data URIs or local assets)
  const generateSrcSet = (imageSrc: string): string | undefined => {
    // Skip srcset for data URIs, blob URLs, or local imports
    if (
      imageSrc.startsWith("data:") ||
      imageSrc.startsWith("blob:") ||
      !imageSrc.startsWith("http")
    ) {
      return undefined;
    }

    // For Supabase storage URLs, we can potentially add transforms
    // For other URLs, return undefined to use default src
    if (imageSrc.includes("supabase")) {
      // Supabase image transforms format
      const baseUrl = imageSrc.split("?")[0];
      return `${baseUrl}?width=640 640w, ${baseUrl}?width=1024 1024w, ${baseUrl}?width=1920 1920w`;
    }

    return undefined;
  };

  const srcSet = generateSrcSet(src);
  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Blur placeholder while loading */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-muted animate-pulse"
          aria-hidden="true"
        />
      )}
      
      <picture>
        {/* WebP source for browsers that support it */}
        {srcSet && (
          <source
            type="image/webp"
            srcSet={srcSet}
            sizes={sizes}
          />
        )}
        
        {/* Fallback image */}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          {...(srcSet && { srcSet, sizes })}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;
