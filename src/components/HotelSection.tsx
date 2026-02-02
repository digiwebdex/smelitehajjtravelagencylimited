import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X, Star, Globe, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import HotelCard from "./HotelCard";
import HotelDetailsModal from "./HotelDetailsModal";
import HotelBookingModal from "./HotelBookingModal";

interface Hotel {
  id: string;
  name: string;
  city: string;
  country: string;
  star_rating: number;
  distance_from_haram: number;
  description: string | null;
  facilities: string[];
  images: string[];
  google_map_link: string | null;
  google_map_embed_url: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_active: boolean;
}

interface SectionSettings {
  title: string;
  subtitle: string;
  is_enabled: boolean;
  booking_enabled: boolean;
  star_label: string;
  show_map_button: boolean;
  show_details_button: boolean;
}

interface HotelSectionProps {
  onClose: () => void;
}

type Step = 1 | 2 | 3;

const COUNTRY_FLAGS: Record<string, string> = {
  "Saudi Arabia": "🇸🇦",
  "Dubai": "🇦🇪",
  "Malaysia": "🇲🇾",
  "Turkey": "🇹🇷",
  "Indonesia": "🇮🇩",
  "Egypt": "🇪🇬",
};

const HotelSection = ({ onClose }: HotelSectionProps) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedStarRating, setSelectedStarRating] = useState<number | null>(null);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [settings, setSettings] = useState<SectionSettings>({
    title: "Hotel Bookings",
    subtitle: "Find your perfect stay",
    is_enabled: true,
    booking_enabled: true,
    star_label: "Star",
    show_map_button: true,
    show_details_button: true,
  });

  useEffect(() => {
    fetchHotels();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("hotel_section_settings")
      .select("*")
      .eq("section_key", "general")
      .single();

    if (data) {
      setSettings({
        title: data.title || "Hotel Bookings",
        subtitle: data.subtitle || "Find your perfect stay",
        is_enabled: data.is_enabled ?? true,
        booking_enabled: data.booking_enabled ?? true,
        star_label: data.star_label || "Star",
        show_map_button: data.show_map_button ?? true,
        show_details_button: data.show_details_button ?? true,
      });
    }
  };

  const fetchHotels = async () => {
    const { data, error } = await supabase
      .from("hotels")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (error) {
      console.error("Error fetching hotels:", error);
    } else {
      setHotels(data || []);
    }
    setLoading(false);
  };

  // Get unique countries with hotel counts
  const countries = hotels.reduce((acc, hotel) => {
    const country = hotel.country || "Saudi Arabia";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get star ratings for selected country with counts
  const getStarRatings = () => {
    const filtered = hotels.filter(h => (h.country || "Saudi Arabia") === selectedCountry);
    const ratings: Record<number, number> = {};
    filtered.forEach(h => {
      ratings[h.star_rating] = (ratings[h.star_rating] || 0) + 1;
    });
    return Object.entries(ratings)
      .map(([rating, count]) => ({ rating: parseInt(rating), count }))
      .sort((a, b) => a.rating - b.rating);
  };

  // Get hotels for selected country and star rating
  const getFilteredHotels = () => {
    return hotels.filter(
      h => (h.country || "Saudi Arabia") === selectedCountry && h.star_rating === selectedStarRating
    );
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
    setStep(2);
  };

  const handleStarSelect = (rating: number) => {
    setSelectedStarRating(rating);
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setSelectedCountry(null);
      setStep(1);
    } else if (step === 3) {
      setSelectedStarRating(null);
      setStep(2);
    }
  };

  const handleViewDetails = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setDetailsModalOpen(true);
  };

  const handleBookNow = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setBookingModalOpen(true);
  };

  const handleViewMap = (hotel: Hotel) => {
    if (hotel.google_map_link) {
      window.open(hotel.google_map_link, "_blank");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredHotels = getFilteredHotels();
  const starRatings = getStarRatings();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step > 1 && (
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold">
                  {settings.title}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  {settings.subtitle}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-4 text-sm">
            <span className={step === 1 ? "text-primary font-medium" : "text-muted-foreground"}>
              Country
            </span>
            <span className="text-muted-foreground">/</span>
            <span className={step === 2 ? "text-primary font-medium" : "text-muted-foreground"}>
              Category
            </span>
            <span className="text-muted-foreground">/</span>
            <span className={step === 3 ? "text-primary font-medium" : "text-muted-foreground"}>
              Hotels
            </span>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Country Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-heading text-xl md:text-2xl font-semibold">
                  Select Destination Country
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Choose your preferred destination to explore hotels
                </p>
              </div>

              {Object.keys(countries).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hotels available at the moment.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
                  {Object.entries(countries).map(([country, count], index) => (
                    <motion.div
                      key={country}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
                        onClick={() => handleCountrySelect(country)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="text-5xl mb-4">
                            {COUNTRY_FLAGS[country] || <Globe className="h-12 w-12 mx-auto text-primary" />}
                          </div>
                          <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                            {country}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {count} {count === 1 ? "hotel" : "hotels"}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 2: Star Category Selection */}
          {step === 2 && selectedCountry && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-heading text-xl md:text-2xl font-semibold">
                  {selectedCountry} - Select Hotel Category
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Choose your preferred star rating
                </p>
              </div>

              {starRatings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hotels available in {selectedCountry}.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {starRatings.map(({ rating, count }, index) => (
                    <motion.div
                      key={rating}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
                        onClick={() => handleStarSelect(rating)}
                      >
                        <CardContent className="p-6 text-center">
                          <div className="flex justify-center gap-1 mb-4">
                            {Array.from({ length: rating }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-6 w-6 fill-primary text-primary"
                              />
                            ))}
                          </div>
                          <h3 className="font-heading font-semibold text-lg group-hover:text-primary transition-colors">
                            {rating} {settings.star_label}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {count} {count === 1 ? "hotel" : "hotels"}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Step 3: Hotel Listings */}
          {step === 3 && selectedCountry && selectedStarRating && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="font-heading text-xl md:text-2xl font-semibold flex items-center justify-center gap-2">
                  <span>{selectedStarRating} {settings.star_label}</span>
                  <span className="text-muted-foreground">Hotels in</span>
                  <span>{selectedCountry}</span>
                </h2>
                <p className="text-muted-foreground text-sm mt-2">
                  {filteredHotels.length} {filteredHotels.length === 1 ? "hotel" : "hotels"} available
                </p>
              </div>

              {filteredHotels.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No hotels found for this selection.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredHotels.map((hotel, index) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      index={index}
                      starLabel={settings.star_label}
                      showDetailsButton={settings.show_details_button}
                      showMapButton={settings.show_map_button}
                      bookingEnabled={settings.booking_enabled}
                      onViewDetails={() => handleViewDetails(hotel)}
                      onViewMap={() => handleViewMap(hotel)}
                      onBookNow={() => handleBookNow(hotel)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <HotelDetailsModal
        hotel={selectedHotel}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        starLabel={settings.star_label}
        bookingEnabled={settings.booking_enabled}
        onBookNow={() => {
          setDetailsModalOpen(false);
          setBookingModalOpen(true);
        }}
      />

      <HotelBookingModal
        hotel={selectedHotel}
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
      />
    </motion.div>
  );
};

export default HotelSection;
