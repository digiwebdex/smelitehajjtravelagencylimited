import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Star, Calendar, Hotel, Plane, Bus, FileText, MapPin, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

interface PackageDetails {
  id: string;
  title: string;
  description: string | null;
  full_description: string | null;
  type: string;
  price: number;
  duration_days: number;
  includes: string[] | null;
  exclusions: string[] | null;
  hotel_rating: number | null;
  hotel_type: string | null;
  hotel_image_url: string | null;
  hotel_images: string[] | null;
  hotel_map_link: string | null;
  transport_type: string | null;
  flight_type: string | null;
  special_notes: string | null;
  stock: number;
  show_book_now: boolean;
}

interface PackageDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  package_info: PackageDetails | null;
  onBookNow?: (pkg: PackageDetails) => void;
}

// Helper component to format description text with proper sections
const FormattedDescription = ({ text }: { text: string }) => {
  // Split by section headers (text wrapped in ** **)
  const regex = /\*\*([^*]+)\*\*/g;
  const parsedSections: { title: string; content: { type: 'bullet' | 'text'; value: string }[] }[] = [];
  
  let lastIndex = 0;
  let match;
  let currentSection: { title: string; content: { type: 'bullet' | 'text'; value: string }[] } | null = null;
  
  while ((match = regex.exec(text)) !== null) {
    // Get content before this match (belongs to previous section)
    const contentBefore = text.slice(lastIndex, match.index).trim();
    
    if (currentSection && contentBefore) {
      // Parse the content for the previous section
      if (contentBefore.includes('•')) {
        const items = contentBefore.split('•').filter(item => item.trim());
        items.forEach(item => {
          currentSection!.content.push({ type: 'bullet', value: item.trim() });
        });
      } else {
        const paragraphs = contentBefore.split('\n').filter(p => p.trim());
        paragraphs.forEach(p => {
          currentSection!.content.push({ type: 'text', value: p.trim() });
        });
      }
    }
    
    // Save previous section if exists
    if (currentSection && currentSection.content.length > 0) {
      parsedSections.push(currentSection);
    }
    
    // Start new section with the matched title
    const title = match[1].trim().replace(/:$/, '');
    currentSection = { title, content: [] };
    lastIndex = regex.lastIndex;
  }
  
  // Get remaining content after last match
  const remainingContent = text.slice(lastIndex).trim();
  if (currentSection && remainingContent) {
    if (remainingContent.includes('•')) {
      const items = remainingContent.split('•').filter(item => item.trim());
      items.forEach(item => {
        currentSection!.content.push({ type: 'bullet', value: item.trim() });
      });
    } else {
      const paragraphs = remainingContent.split('\n').filter(p => p.trim());
      paragraphs.forEach(p => {
        currentSection!.content.push({ type: 'text', value: p.trim() });
      });
    }
  }
  
  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    parsedSections.push(currentSection);
  }

  return (
    <div className="space-y-3">
      {parsedSections.map((section, idx) => (
        <div key={idx} className="bg-muted/30 rounded-xl p-4 border border-border/50">
          <h5 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-secondary"></span>
            {section.title}
          </h5>
          <div className="space-y-2 ml-4">
            {section.content.map((item, itemIdx) => (
              item.type === 'bullet' ? (
                <div key={itemIdx} className="flex items-start gap-2 text-sm text-foreground/85">
                  <span className="text-secondary mt-0.5 font-bold">•</span>
                  <span>{item.value}</span>
                </div>
              ) : (
                <p key={itemIdx} className="text-sm text-foreground/85 leading-relaxed">
                  {item.value}
                </p>
              )
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const PackageDetailsModal = ({ isOpen, onClose, package_info, onBookNow }: PackageDetailsModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { trackViewContent } = useFacebookPixel();

  // Get all hotel images
  const hotelImages = package_info ? [
    ...(package_info.hotel_image_url ? [package_info.hotel_image_url] : []),
    ...(package_info.hotel_images || [])
  ].filter(Boolean) : [];

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      setCurrentImageIndex(0); // Reset image index when modal opens
      
      // Track ViewContent event when modal opens
      if (package_info) {
        trackViewContent({
          contentId: package_info.id,
          contentName: package_info.title,
          contentType: package_info.type,
          value: package_info.price,
        });
      }
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, package_info, trackViewContent]);

  if (!package_info) return null;

  const handleBookNow = () => {
    if (onBookNow) {
      onBookNow(package_info);
    }
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-h-[90vh]"
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-10">
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge className="bg-white/20 text-white border-0 mb-2">
                      {package_info.type.charAt(0).toUpperCase() + package_info.type.slice(1)} Package
                    </Badge>
                    <DialogTitle className="text-2xl font-heading font-bold text-white">
                      {package_info.title}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              
              {/* Price badge */}
              <div className="absolute -bottom-5 right-6 bg-secondary text-secondary-foreground px-5 py-3 rounded-lg shadow-gold">
                <span className="text-2xl font-bold">{formatCurrency(package_info.price)}</span>
                <span className="text-xs block opacity-80">per person</span>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-6 pt-8 space-y-6">
                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-sm font-medium">{package_info.duration_days} Days</span>
                  </div>
                  {package_info.hotel_rating && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <Hotel className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <div className="flex items-center justify-center gap-0.5">
                        {Array.from({ length: package_info.hotel_rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-secondary fill-secondary" />
                        ))}
                      </div>
                    </div>
                  )}
                  {package_info.flight_type && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <Plane className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <span className="text-sm font-medium">{package_info.flight_type}</span>
                    </div>
                  )}
                  {package_info.transport_type && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <Bus className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <span className="text-sm font-medium">{package_info.transport_type}</span>
                    </div>
                  )}
                </div>

                {/* Accommodation Info */}
                {package_info.hotel_type && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      Accommodation
                    </h4>
                    <p className="text-foreground">{package_info.hotel_type}</p>
                  </div>
                )}

                {/* Hotel Images Gallery */}
                {hotelImages.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <Hotel className="w-4 h-4" />
                      Hotel Images
                    </h4>
                    <div className="relative rounded-lg overflow-hidden bg-muted aspect-video">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={currentImageIndex}
                          src={hotelImages[currentImageIndex]}
                          alt={`Hotel image ${currentImageIndex + 1}`}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                        />
                      </AnimatePresence>
                      
                      {hotelImages.length > 1 && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                            onClick={prevImage}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8"
                            onClick={nextImage}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                            {hotelImages.map((_, idx) => (
                              <button
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                onClick={() => setCurrentImageIndex(idx)}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Google Maps Link */}
                {package_info.hotel_map_link && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Hotel Location
                    </h4>
                    <a
                      href={package_info.hotel_map_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Google Maps
                    </a>
                  </div>
                )}

                {/* Description */}
                {(package_info.full_description || package_info.description) && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Package Details</h4>
                    <FormattedDescription text={package_info.full_description || package_info.description || ''} />
                  </div>
                )}

                <Separator />

                {/* Inclusions */}
                {package_info.includes && package_info.includes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      What's Included
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {package_info.includes.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusions */}
                {package_info.exclusions && package_info.exclusions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <X className="w-4 h-4 text-destructive" />
                      Not Included
                    </h4>
                    <ul className="grid sm:grid-cols-2 gap-2">
                      {package_info.exclusions.map((item, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <X className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Special Notes */}
                {package_info.special_notes && (
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Special Notes
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {package_info.special_notes}
                    </p>
                  </div>
                )}

                {/* Stock Warning */}
                {package_info.stock < 10 && (
                  <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-3 text-center">
                    <span className="text-sm font-medium text-secondary-foreground">
                      Only {package_info.stock} spots remaining!
                    </span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer with CTA */}
            <div className="p-6 pt-4 border-t bg-background flex-shrink-0">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                {package_info.show_book_now !== false && (
                  <Button 
                    onClick={handleBookNow}
                    className="flex-1 bg-gradient-primary hover:opacity-90 shadow-gold"
                  >
                    Book Now
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default PackageDetailsModal;
