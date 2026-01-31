import { Star, MapPin, Eye, Map, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface Hotel {
  id: string;
  name: string;
  city: string;
  star_rating: number;
  distance_from_haram: number;
  description: string | null;
  facilities: string[];
  images: string[];
  google_map_link: string | null;
}

interface HotelCardProps {
  hotel: Hotel;
  index: number;
  starLabel: string;
  showDetailsButton: boolean;
  showMapButton: boolean;
  bookingEnabled: boolean;
  onViewDetails: () => void;
  onViewMap: () => void;
  onBookNow: () => void;
}

const HotelCard = ({
  hotel,
  index,
  starLabel,
  showDetailsButton,
  showMapButton,
  bookingEnabled,
  onViewDetails,
  onViewMap,
  onBookNow,
}: HotelCardProps) => {
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters}m`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {hotel.images && hotel.images.length > 0 ? (
            <img
              src={hotel.images[0]}
              alt={hotel.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <span className="text-muted-foreground">No Image</span>
            </div>
          )}
          
          {/* Star Rating Badge */}
          <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: hotel.star_rating }).map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-primary-foreground text-primary-foreground" />
              ))}
            </div>
          </Badge>

          {/* Distance Badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm"
          >
            <MapPin className="w-3 h-3 mr-1" />
            {formatDistance(hotel.distance_from_haram)}
          </Badge>
        </div>

        <CardContent className="flex-1 p-4 flex flex-col">
          <h3 className="font-heading font-semibold text-lg line-clamp-1 mb-1">
            {hotel.name}
          </h3>
          
          <p className="text-xs text-muted-foreground mb-2">
            {hotel.star_rating} {starLabel} • {formatDistance(hotel.distance_from_haram)} from Haram
          </p>

          {hotel.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
              {hotel.description}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {showDetailsButton && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1" 
                onClick={onViewDetails}
              >
                <Eye className="w-3 h-3 mr-1" />
                Details
              </Button>
            )}
            
            {showMapButton && hotel.google_map_link && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={onViewMap}
              >
                <Map className="w-3 h-3 mr-1" />
                Map
              </Button>
            )}
            
            {bookingEnabled && (
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={onBookNow}
              >
                <CalendarCheck className="w-3 h-3 mr-1" />
                Book Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HotelCard;
