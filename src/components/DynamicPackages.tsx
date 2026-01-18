import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Star, Users, Check, ArrowUpDown, Filter, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BookingModal from "./BookingModal";
import PackageDetailsModal from "./PackageDetailsModal";
import { formatCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Package {
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
  transport_type: string | null;
  flight_type: string | null;
  special_notes: string | null;
  stock: number;
  show_view_details: boolean;
  show_book_now: boolean;
}

interface DynamicPackagesProps {
  type: "hajj" | "umrah";
}

type SortOption = "price-asc" | "price-desc" | "duration-asc" | "duration-desc" | "rating-desc";

const VISIBLE_FEATURES_COUNT = 6;

// Expandable Package Card Component
const ExpandablePackageCard = ({ 
  pkg, 
  index, 
  onBookNow,
  onViewDetails
}: { 
  pkg: Package; 
  index: number; 
  onBookNow: (pkg: Package) => void;
  onViewDetails: (pkg: Package) => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const features = pkg.includes || [];
  const hasMoreFeatures = features.length > VISIBLE_FEATURES_COUNT;
  const visibleFeatures = isExpanded ? features : features.slice(0, VISIBLE_FEATURES_COUNT);
  const remainingCount = features.length - VISIBLE_FEATURES_COUNT;

  return (
    <motion.div
      key={pkg.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        boxShadow: "0 12px 32px -8px rgba(0, 0, 0, 0.15)"
      }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { duration: 0.2 },
        y: { duration: 0.2 },
        boxShadow: { duration: 0.2 }
      }}
      className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm flex cursor-pointer"
    >
      <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group border-border/50">
        {/* Header with gradient */}
        <CardHeader className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-14">
          <div className="relative z-10">
            <h3 className="font-heading text-xl font-bold whitespace-nowrap mb-3">{pkg.title}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0 whitespace-nowrap">
                {pkg.duration_days} Days
              </Badge>
              {pkg.hotel_rating && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: pkg.hotel_rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
                  ))}
                </div>
              )}
              {pkg.stock < 10 && (
                <Badge className="bg-secondary/80 text-secondary-foreground whitespace-nowrap">
                  Only {pkg.stock} left
                </Badge>
              )}
            </div>
          </div>
          
          {/* Price badge */}
          <div className="absolute -bottom-5 right-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg shadow-gold">
            <span className="text-2xl font-bold">{formatCurrency(pkg.price)}</span>
            <span className="text-xs block opacity-80">per person</span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-8 pb-4">
          {pkg.description && (
            <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
          )}
          
          {features.length > 0 && (
            <ul className="space-y-2">
              <AnimatePresence mode="sync">
                {visibleFeatures.map((item, i) => (
                  <motion.li 
                    key={item} 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, delay: i < VISIBLE_FEATURES_COUNT ? 0 : 0.03 * (i - VISIBLE_FEATURES_COUNT) }}
                    className="flex items-start gap-2 text-sm overflow-hidden"
                  >
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {/* Expand/Collapse Button */}
          {hasMoreFeatures && (
            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm font-medium mt-3 text-primary hover:text-primary/80 transition-colors"
              whileTap={{ scale: 0.98 }}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <span className="text-lg font-bold mr-1">+</span>
                  {remainingCount} more inclusion{remainingCount > 1 ? 's' : ''}
                </>
              )}
            </motion.button>
          )}
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-2">
          {pkg.show_view_details !== false && (
            <Button 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(pkg);
              }}
              className="w-full group-hover:border-primary transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          )}
          {pkg.show_book_now !== false && (
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onBookNow(pkg);
              }}
              className="w-full bg-gradient-primary hover:opacity-90 shadow-gold group-hover:scale-105 transition-transform"
            >
              Book Now
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const DynamicPackages = ({ type }: DynamicPackagesProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");

  useEffect(() => {
    fetchPackages();
  }, [type]);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("type", type)
      .eq("is_active", true);

    if (!error && data) {
      setPackages(data as Package[]);
    }
    setLoading(false);
  };

  const sortedPackages = useMemo(() => {
    return [...packages].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "duration-asc":
          return a.duration_days - b.duration_days;
        case "duration-desc":
          return b.duration_days - a.duration_days;
        case "rating-desc":
          return (b.hotel_rating || 0) - (a.hotel_rating || 0);
        default:
          return 0;
      }
    });
  }, [packages, sortBy]);

  const handleBookNow = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsBookingModalOpen(true);
  };

  const handleViewDetails = (pkg: Package) => {
    setSelectedPackage(pkg);
    setIsDetailsModalOpen(true);
  };

  const handleBookFromDetails = (pkg: Package) => {
    setIsDetailsModalOpen(false);
    setSelectedPackage(pkg);
    setIsBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-32 bg-muted" />
            <CardContent className="space-y-3 pt-6">
              <div className="h-6 bg-muted rounded w-2/3" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No {type} packages available at the moment.</p>
      </div>
    );
  }

  return (
    <>
      {/* Sort Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex justify-end mb-6"
      >
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-background border">
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="duration-asc">Duration: Shortest</SelectItem>
              <SelectItem value="duration-desc">Duration: Longest</SelectItem>
              <SelectItem value="rating-desc">Rating: Highest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-6">
        {sortedPackages.map((pkg, index) => (
          <ExpandablePackageCard
            key={pkg.id}
            pkg={pkg}
            index={index}
            onBookNow={handleBookNow}
            onViewDetails={handleViewDetails}
          />
        ))}
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        package_info={selectedPackage}
      />

      <PackageDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        package_info={selectedPackage}
        onBookNow={handleBookFromDetails}
      />
    </>
  );
};

export default DynamicPackages;
