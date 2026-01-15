import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Calendar, MapPin, Star, Users, Check, ArrowUpDown, Filter } from "lucide-react";
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
import { formatCurrency } from "@/lib/currency";

interface Package {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price: number;
  duration_days: number;
  includes: string[] | null;
  hotel_rating: number | null;
  stock: number;
}

interface DynamicPackagesProps {
  type: "hajj" | "umrah";
}

type SortOption = "price-asc" | "price-desc" | "duration-asc" | "duration-desc" | "rating-desc";

const DynamicPackages = ({ type }: DynamicPackagesProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setPackages(data);
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
    setIsModalOpen(true);
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
      <div className="flex justify-end mb-6">
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
      </div>

      <div className="flex flex-wrap justify-center gap-6">
        {sortedPackages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-sm flex"
          >
            <Card className="h-full flex flex-col overflow-hidden hover:shadow-elegant transition-all duration-300 group border-border/50">
              {/* Header with gradient */}
              <CardHeader className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-heading text-xl font-bold">{pkg.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="bg-white/20 text-white border-0">
                        {pkg.duration_days} Days
                      </Badge>
                      {pkg.hotel_rating && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: pkg.hotel_rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-secondary text-secondary" />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {pkg.stock < 10 && (
                    <Badge className="bg-secondary text-secondary-foreground">
                      Only {pkg.stock} left
                    </Badge>
                  )}
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
                
                {pkg.includes && pkg.includes.length > 0 && (
                  <ul className="space-y-2">
                    {pkg.includes.slice(0, 6).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                    {pkg.includes.length > 6 && (
                      <li className="text-sm text-primary font-medium">
                        + {pkg.includes.length - 6} more inclusions
                      </li>
                    )}
                  </ul>
                )}
              </CardContent>

              <CardFooter className="pt-0">
                <Button 
                  onClick={() => handleBookNow(pkg)}
                  className="w-full bg-gradient-primary hover:opacity-90 shadow-gold group-hover:scale-105 transition-transform"
                >
                  Book Now
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        package_info={selectedPackage}
      />
    </>
  );
};

export default DynamicPackages;
