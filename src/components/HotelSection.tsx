import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
}

// Demo fallback data
const DEMO_HOTELS: Record<string, Record<string, { name: string; city: string; price: string; country: string }[]>> = {
  "Saudi Arabia": {
    "3": [
      { name: "Al Ebaa Hotel", city: "Makkah", price: "৳8,000/night", country: "Saudi Arabia" },
      { name: "Diyar Al Salam", city: "Madinah", price: "৳7,500/night", country: "Saudi Arabia" }
    ],
    "4": [
      { name: "Elaf Ajyad Hotel", city: "Makkah", price: "৳12,000/night", country: "Saudi Arabia" },
      { name: "Saja Al Madinah", city: "Madinah", price: "৳11,000/night", country: "Saudi Arabia" }
    ],
    "5": [
      { name: "Swissotel Makkah", city: "Makkah", price: "৳25,000/night", country: "Saudi Arabia" },
      { name: "Anwar Al Madinah Mövenpick", city: "Madinah", price: "৳23,000/night", country: "Saudi Arabia" }
    ]
  },
  "Dubai": {
    "3": [
      { name: "Citymax Hotel", city: "Dubai", price: "৳7,000/night", country: "Dubai" }
    ],
    "4": [
      { name: "Golden Tulip Deira", city: "Dubai", price: "৳13,000/night", country: "Dubai" }
    ],
    "5": [
      { name: "Atlantis The Palm", city: "Dubai", price: "৳45,000/night", country: "Dubai" }
    ]
  }
};

const COUNTRY_FLAGS: Record<string, string> = {
  "Saudi Arabia": "🇸🇦",
  "Dubai": "🇦🇪",
  "Malaysia": "🇲🇾",
  "Turkey": "🇹🇷",
};

const HotelSection = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
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
  });

  const useDemoData = hotels.length === 0 && !loading;

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

  // Get countries from database or demo data
  const getCountries = () => {
    if (useDemoData) {
      return Object.keys(DEMO_HOTELS);
    }
    const countrySet = new Set(hotels.map(h => h.country || "Saudi Arabia"));
    return Array.from(countrySet);
  };

  // Get star ratings for selected country
  const getStarRatings = () => {
    if (useDemoData && selectedCountry) {
      return Object.keys(DEMO_HOTELS[selectedCountry] || {}).map(r => parseInt(r));
    }
    const filtered = hotels.filter(h => (h.country || "Saudi Arabia") === selectedCountry);
    const ratings = new Set(filtered.map(h => h.star_rating));
    return Array.from(ratings).sort((a, b) => a - b);
  };

  // Get hotels for selected country and star rating
  const getFilteredHotels = () => {
    return hotels.filter(
      h => (h.country || "Saudi Arabia") === selectedCountry && h.star_rating === selectedStarRating
    );
  };

  // Get demo hotels for selected country and star rating
  const getDemoHotels = () => {
    if (!selectedCountry || !selectedStarRating) return [];
    return DEMO_HOTELS[selectedCountry]?.[String(selectedStarRating)] || [];
  };

  const handleBookNow = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setBookingModalOpen(true);
  };

  // Handle demo hotel booking - create a temporary hotel object
  const handleDemoBookNow = (demoHotel: { name: string; city: string; price: string; country: string }) => {
    const tempHotel: Hotel = {
      id: `demo-${Date.now()}`,
      name: demoHotel.name,
      city: demoHotel.city,
      country: demoHotel.country,
      star_rating: selectedStarRating || 3,
      distance_from_haram: 0,
      description: null,
      facilities: [],
      images: [],
      google_map_link: null,
      google_map_embed_url: null,
      contact_phone: null,
      contact_email: null,
      is_active: true,
    };
    setSelectedHotel(tempHotel);
    setBookingModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const countries = getCountries();
  const starRatings = getStarRatings();
  const filteredHotels = getFilteredHotels();
  const demoHotels = getDemoHotels();

  return (
    <div className="min-h-[60vh]">
      {/* Page Header */}
      <div className="bg-primary/5 border-b">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                {settings.title}
              </h1>
              <p className="text-muted-foreground mt-1">{settings.subtitle}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Country Selection */}
          {!selectedCountry && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-xl font-semibold mb-6">Select Destination Country</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {countries.map((country) => (
                  <button
                    key={country}
                    onClick={() => setSelectedCountry(country)}
                    className="bg-card p-6 shadow-md rounded-xl hover:bg-primary/10 transition-colors text-left border"
                  >
                    <span className="text-3xl mb-2 block">{COUNTRY_FLAGS[country] || "🌍"}</span>
                    <span className="font-medium">{country}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Star Category Selection */}
          {selectedCountry && !selectedStarRating && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button
                onClick={() => setSelectedCountry(null)}
                className="mb-4 text-muted-foreground flex items-center gap-1 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="text-xl font-semibold mb-6">
                {selectedCountry} - Select Category
              </h2>
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                {starRatings.map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedStarRating(rating)}
                    className="bg-card p-6 shadow-md rounded-xl hover:bg-primary/10 transition-colors border"
                  >
                    <div className="flex justify-center gap-0.5 mb-2">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <span className="font-medium">{rating} {settings.star_label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Hotel Listings */}
          {selectedCountry && selectedStarRating && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <button
                onClick={() => setSelectedStarRating(null)}
                className="mb-4 text-muted-foreground flex items-center gap-1 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <h2 className="text-xl font-semibold mb-6">
                {selectedStarRating} {settings.star_label} Hotels in {selectedCountry}
              </h2>

              {/* Database Hotels */}
              {filteredHotels.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredHotels.map((hotel) => (
                    <div key={hotel.id} className="bg-card p-6 shadow-lg rounded-xl border">
                      {hotel.images?.[0] && (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                      )}
                      <h3 className="text-lg font-bold">{hotel.name}</h3>
                      <p className="text-muted-foreground">{hotel.city}</p>
                      {hotel.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {hotel.description}
                        </p>
                      )}
                      {settings.booking_enabled && (
                        <Button
                          className="mt-4 w-full"
                          onClick={() => handleBookNow(hotel)}
                        >
                          Book Now
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Demo Hotels (when no database hotels) */}
              {filteredHotels.length === 0 && demoHotels.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {demoHotels.map((hotel, index) => (
                    <div key={index} className="bg-card p-6 shadow-lg rounded-xl border">
                      <h3 className="text-lg font-bold">{hotel.name}</h3>
                      <p className="text-muted-foreground">{hotel.city}</p>
                      <p className="text-primary font-semibold mt-2">{hotel.price}</p>
                      <Button className="mt-4 w-full" onClick={() => handleDemoBookNow(hotel)}>
                        Book Now
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {filteredHotels.length === 0 && demoHotels.length === 0 && (
                <p className="text-muted-foreground text-center py-12">
                  No hotels available for this selection.
                </p>
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
    </div>
  );
};

export default HotelSection;
