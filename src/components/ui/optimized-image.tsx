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

  // Check if URL is a Supabase storage URL
  const isSupabaseUrl = (url: string): boolean => {
    return url.includes("supabase") && url.includes("/storage/");
  };

  // Generate optimized URL with WebP format and compression
  const getOptimizedUrl = (imageSrc: string, targetWidth?: number, quality: number = 80): string => {
    if (!isSupabaseUrl(imageSrc)) return imageSrc;
    
    const baseUrl = imageSrc.split("?")[0];
    const params = new URLSearchParams();
    
    if (targetWidth) params.set("width", targetWidth.toString());
    params.set("quality", quality.toString());
    params.set("format", "webp");
    
    return `${baseUrl}?${params.toString()}`;
  };

  // Generate srcset for responsive images with WebP and compression
  const generateSrcSet = (imageSrc: string): string | undefined => {
    // Skip srcset for data URIs, blob URLs, or local imports
    if (
      imageSrc.startsWith("data:") ||
      imageSrc.startsWith("blob:") ||
      !imageSrc.startsWith("http")
    ) {
      return undefined;
    }

    if (isSupabaseUrl(imageSrc)) {
      const baseUrl = imageSrc.split("?")[0];
      // Generate srcset with WebP format and quality optimization
      return [
        `${baseUrl}?width=320&quality=75&format=webp 320w`,
        `${baseUrl}?width=640&quality=80&format=webp 640w`,
        `${baseUrl}?width=1024&quality=80&format=webp 1024w`,
        `${baseUrl}?width=1920&quality=85&format=webp 1920w`,
      ].join(", ");
    }

    return undefined;
  };

  // Generate WebP-specific srcset for picture element
  const generateWebPSrcSet = (imageSrc: string): string | undefined => {
    if (!isSupabaseUrl(imageSrc)) return undefined;
    
    const baseUrl = imageSrc.split("?")[0];
    return [
      `${baseUrl}?width=320&quality=75&format=webp 320w`,
      `${baseUrl}?width=640&quality=80&format=webp 640w`,
      `${baseUrl}?width=1024&quality=80&format=webp 1024w`,
      `${baseUrl}?width=1920&quality=85&format=webp 1920w`,
    ].join(", ");
  };

  // Don't use transformation params - Supabase image transformations may not be enabled
  const srcSet = undefined;
  const webpSrcSet = undefined;
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
        {webpSrcSet && (
          <source
            type="image/webp"
            srcSet={webpSrcSet}
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
