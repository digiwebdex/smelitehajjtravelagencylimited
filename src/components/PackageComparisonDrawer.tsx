import { useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Star, Calendar, Hotel, Plane, Bus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { motion } from "framer-motion";
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

interface PackageComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  packages: Package[];
  onRemove: (id: string) => void;
  onBookNow: (pkg: Package) => void;
}

const PackageComparisonDrawer = ({ 
  isOpen, 
  onClose, 
  packages, 
  onRemove,
  onBookNow 
}: PackageComparisonDrawerProps) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Get all unique inclusions across all packages
  const allInclusions = [...new Set(packages.flatMap(pkg => pkg.includes || []))];
  const allExclusions = [...new Set(packages.flatMap(pkg => pkg.exclusions || []))];

  const hasFeature = (pkg: Package, feature: string) => {
    return pkg.includes?.includes(feature) ?? false;
  };

  const hasExclusion = (pkg: Package, exclusion: string) => {
    return pkg.exclusions?.includes(exclusion) ?? false;
  };

  // Find lowest price for highlighting
  const lowestPrice = Math.min(...packages.map(p => p.price));
  const highestRating = Math.max(...packages.map(p => p.hotel_rating || 0));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="p-4 pb-2 border-b bg-background sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-heading">
              Compare Packages ({packages.length})
            </SheetTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(85vh-60px)]">
          <div className="p-4">
            {/* Package Headers */}
            <div className="grid gap-4" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground">Package</div>
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-4 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20"
                      onClick={() => onRemove(pkg.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Badge className="bg-white/20 text-white border-0 mb-2">
                      {pkg.type.charAt(0).toUpperCase() + pkg.type.slice(1)}
                    </Badge>
                    <h3 className="font-heading font-bold text-lg pr-6">{pkg.title}</h3>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Price Row */}
            <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground">Price</div>
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={cn(
                    "text-center p-3 rounded-lg",
                    pkg.price === lowestPrice && packages.length > 1 && "bg-green-50 dark:bg-green-950/30 ring-2 ring-green-500"
                  )}
                >
                  <span className="text-2xl font-bold text-primary">{formatCurrency(pkg.price)}</span>
                  <span className="text-xs block text-muted-foreground">per person</span>
                  {pkg.price === lowestPrice && packages.length > 1 && (
                    <Badge className="mt-1 bg-green-500">Best Value</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Duration Row */}
            <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Duration
              </div>
              {packages.map((pkg) => (
                <div key={pkg.id} className="text-center font-medium">
                  {pkg.duration_days} Days
                </div>
              ))}
            </div>

            {/* Hotel Rating Row */}
            <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground flex items-center gap-2">
                <Hotel className="w-4 h-4" />
                Hotel Rating
              </div>
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={cn(
                    "flex items-center justify-center gap-0.5 p-2 rounded-lg",
                    pkg.hotel_rating === highestRating && packages.length > 1 && "bg-secondary/10"
                  )}
                >
                  {pkg.hotel_rating ? (
                    Array.from({ length: pkg.hotel_rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-secondary fill-secondary" />
                    ))
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </div>
              ))}
            </div>

            {/* Hotel Type Row */}
            {packages.some(p => p.hotel_type) && (
              <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                <div className="font-semibold text-muted-foreground">Accommodation</div>
                {packages.map((pkg) => (
                  <div key={pkg.id} className="text-center text-sm">
                    {pkg.hotel_type || <span className="text-muted-foreground">-</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Flight Type Row */}
            {packages.some(p => p.flight_type) && (
              <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                <div className="font-semibold text-muted-foreground flex items-center gap-2">
                  <Plane className="w-4 h-4" />
                  Flight Class
                </div>
                {packages.map((pkg) => (
                  <div key={pkg.id} className="text-center text-sm">
                    {pkg.flight_type || <span className="text-muted-foreground">-</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Transport Type Row */}
            {packages.some(p => p.transport_type) && (
              <div className="grid gap-4 mt-4 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
                <div className="font-semibold text-muted-foreground flex items-center gap-2">
                  <Bus className="w-4 h-4" />
                  Ground Transport
                </div>
                {packages.map((pkg) => (
                  <div key={pkg.id} className="text-center text-sm">
                    {pkg.transport_type || <span className="text-muted-foreground">-</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Inclusions Section */}
            {allInclusions.length > 0 && (
              <>
                <div className="mt-6 mb-3">
                  <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Inclusions
                  </h4>
                </div>
                {allInclusions.map((inclusion, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "grid gap-4 py-2 items-center border-b border-border/50",
                      idx % 2 === 0 && "bg-muted/30"
                    )}
                    style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}
                  >
                    <div className="text-sm pl-2">{inclusion}</div>
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="flex justify-center">
                        {hasFeature(pkg, inclusion) ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {/* Exclusions Section */}
            {allExclusions.length > 0 && (
              <>
                <div className="mt-6 mb-3">
                  <h4 className="font-semibold text-muted-foreground flex items-center gap-2">
                    <X className="w-4 h-4 text-destructive" />
                    Not Included
                  </h4>
                </div>
                {allExclusions.map((exclusion, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "grid gap-4 py-2 items-center border-b border-border/50",
                      idx % 2 === 0 && "bg-muted/30"
                    )}
                    style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}
                  >
                    <div className="text-sm pl-2 text-muted-foreground">{exclusion}</div>
                    {packages.map((pkg) => (
                      <div key={pkg.id} className="flex justify-center">
                        {hasExclusion(pkg, exclusion) ? (
                          <X className="w-5 h-5 text-destructive/70" />
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}

            {/* Availability */}
            <div className="grid gap-4 mt-6 items-center" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div className="font-semibold text-muted-foreground">Availability</div>
              {packages.map((pkg) => (
                <div key={pkg.id} className="text-center">
                  {pkg.stock < 10 ? (
                    <Badge variant="destructive">Only {pkg.stock} left</Badge>
                  ) : (
                    <Badge variant="secondary">{pkg.stock} available</Badge>
                  )}
                </div>
              ))}
            </div>

            {/* Book Now Buttons */}
            <div className="grid gap-4 mt-6 pt-4 border-t" style={{ gridTemplateColumns: `200px repeat(${packages.length}, 1fr)` }}>
              <div></div>
              {packages.map((pkg) => (
                <div key={pkg.id}>
                  {pkg.show_book_now !== false && (
                    <Button 
                      onClick={() => onBookNow(pkg)}
                      className="w-full bg-gradient-primary hover:opacity-90 shadow-gold"
                    >
                      Book Now
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default PackageComparisonDrawer;
