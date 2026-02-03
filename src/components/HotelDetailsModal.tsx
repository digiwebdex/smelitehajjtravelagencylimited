import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Dumbbell,
  Waves,
  AirVent,
  Tv,
  ShowerHead,
  CalendarCheck,
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Hotel {
  id: string;
  name: string;
  city: string;
  star_rating: number;
  distance_from_haram: number;
  description: string | null;
  details?: string[];
  facilities: string[];
  images: string[];
  google_map_link: string | null;
  google_map_embed_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface HotelDetailsModalProps {
  hotel: Hotel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  starLabel: string;
  bookingEnabled: boolean;
  onBookNow: () => void;
}

const facilityIcons: Record<string, React.ElementType> = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee,
  restaurant: Utensils,
  gym: Dumbbell,
  pool: Waves,
  ac: AirVent,
  tv: Tv,
  bathroom: ShowerHead,
};

const HotelDetailsModal = ({
  hotel,
  open,
  onOpenChange,
  starLabel,
  bookingEnabled,
  onBookNow,
}: HotelDetailsModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!hotel) return null;

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters}m`;
  };

  const nextImage = () => {
    if (hotel.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length);
    }
  };

  const prevImage = () => {
    if (hotel.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? hotel.images.length - 1 : prev - 1
      );
    }
  };

  const getEmbedUrl = () => {
    if (hotel.google_map_embed_url) return hotel.google_map_embed_url;
    if (hotel.google_map_link) {
      // Try to convert regular Google Maps link to embed
      const match = hotel.google_map_link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        const [, lat, lng] = match;
        return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2s!4v1600000000000!5m2!1sen!2s`;
      }
    }
    return null;
  };

  const embedUrl = getEmbedUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-0">
            {/* Image Gallery */}
            <div className="relative">
              <AspectRatio ratio={16 / 9}>
                {hotel.images && hotel.images.length > 0 ? (
                  <img
                    src={hotel.images[currentImageIndex]}
                    alt={`${hotel.name} - Image ${currentImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <span className="text-muted-foreground">No Images Available</span>
                  </div>
                )}
              </AspectRatio>

              {hotel.images && hotel.images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {hotel.images.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? "bg-white scale-125"
                            : "bg-white/50 hover:bg-white/75"
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <DialogHeader className="mb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="text-2xl font-heading mb-2">
                      {hotel.name}
                    </DialogTitle>
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="bg-primary/90">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: hotel.star_rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-primary-foreground text-primary-foreground"
                            />
                          ))}
                          <span className="ml-1">
                            {hotel.star_rating} {starLabel}
                          </span>
                        </div>
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <MapPin className="w-3 h-3" />
                        {formatDistance(hotel.distance_from_haram)} from Haram
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Description */}
              {hotel.description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {hotel.description}
                  </p>
                </div>
              )}

              {/* Hotel Details (Bullet Points) */}
              {hotel.details && hotel.details.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Hotel Details</h3>
                  <ul className="space-y-2">
                    {hotel.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary mt-1">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Facilities */}
              {hotel.facilities && hotel.facilities.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {hotel.facilities.map((facility, index) => {
                      const IconComponent =
                        facilityIcons[facility.toLowerCase()] || null;
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="py-1.5 px-3 gap-1.5"
                        >
                          {IconComponent && <IconComponent className="w-3 h-3" />}
                          {facility}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Map */}
              {embedUrl && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Location</h3>
                  <div className="rounded-lg overflow-hidden border">
                    <AspectRatio ratio={16 / 9}>
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${hotel.name} location`}
                      />
                    </AspectRatio>
                  </div>
                  {hotel.google_map_link && (
                    <Button
                      variant="link"
                      className="p-0 h-auto mt-2"
                      onClick={() => window.open(hotel.google_map_link!, "_blank")}
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      Open in Google Maps
                    </Button>
                  )}
                </div>
              )}

              {/* Contact */}
              {(hotel.contact_phone || hotel.contact_email) && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Contact</h3>
                  <div className="flex flex-wrap gap-4">
                    {hotel.contact_phone && (
                      <a
                        href={`tel:${hotel.contact_phone}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {hotel.contact_phone}
                      </a>
                    )}
                    {hotel.contact_email && (
                      <a
                        href={`mailto:${hotel.contact_email}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        {hotel.contact_email}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Book Now Button */}
              {bookingEnabled && (
                <Button className="w-full" size="lg" onClick={onBookNow}>
                  <CalendarCheck className="w-4 h-4 mr-2" />
                  Book This Hotel
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HotelDetailsModal;
