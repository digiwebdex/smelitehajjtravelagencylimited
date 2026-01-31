import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import HotelCard from "./HotelCard";
import HotelDetailsModal from "./HotelDetailsModal";
import HotelBookingModal from "./HotelBookingModal";
import MakkahIcon from "./icons/MakkahIcon";
import MadinahIcon from "./icons/MadinahIcon";

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
  sort_by: string;
  sort_order: string;
  hotels_per_page: number;
  show_map_button: boolean;
  show_details_button: boolean;
}

interface HotelSectionProps {
  onClose: () => void;
}

const HotelSection = ({ onClose }: HotelSectionProps) => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCity, setActiveCity] = useState("makkah");
  const [sortBy, setSortBy] = useState("distance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [settings, setSettings] = useState<Record<string, SectionSettings>>({});

  useEffect(() => {
    fetchHotels();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("hotel_section_settings")
      .select("*");

    if (data) {
      const settingsMap: Record<string, SectionSettings> = {};
      data.forEach((setting) => {
        settingsMap[setting.section_key] = {
          title: setting.title || "",
          subtitle: setting.subtitle || "",
          is_enabled: setting.is_enabled,
          booking_enabled: setting.booking_enabled,
          star_label: setting.star_label || "Star",
          sort_by: setting.sort_by || "order_index",
          sort_order: setting.sort_order || "asc",
          hotels_per_page: setting.hotels_per_page || 12,
          show_map_button: setting.show_map_button ?? true,
          show_details_button: setting.show_details_button ?? true,
        };
      });
      setSettings(settingsMap);
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

  const getSortedHotels = (cityHotels: Hotel[]) => {
    return [...cityHotels].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "distance":
          comparison = a.distance_from_haram - b.distance_from_haram;
          break;
        case "rating":
          comparison = a.star_rating - b.star_rating;
          break;
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  const makkahHotels = getSortedHotels(hotels.filter(h => h.city === "makkah"));
  const madinahHotels = getSortedHotels(hotels.filter(h => h.city === "madinah"));

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

  const generalSettings = settings["general"] || {
    title: "Hotel Bookings",
    subtitle: "Find your perfect stay for Umrah",
    booking_enabled: true,
    star_label: "Star",
    show_map_button: true,
    show_details_button: true,
  };

  const makkahSettings = settings["makkah"] || {
    title: "Makkah Hotels",
    subtitle: "Premium accommodations near Masjid al-Haram",
  };

  const madinahSettings = settings["madinah"] || {
    title: "Madinah Hotels",
    subtitle: "Comfortable stays near Masjid an-Nabawi",
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">
                {generalSettings.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {generalSettings.subtitle}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Sorting Controls */}
        <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="distance">Distance</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs for Cities */}
        <Tabs value={activeCity} onValueChange={setActiveCity}>
          <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-8">
            <TabsTrigger value="makkah" className="gap-2">
              <MakkahIcon size={18} className="text-current" />
              Makkah ({makkahHotels.length})
            </TabsTrigger>
            <TabsTrigger value="madinah" className="gap-2">
              <MadinahIcon size={18} className="text-current" />
              Madinah ({madinahHotels.length})
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="makkah" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-heading text-xl md:text-2xl font-semibold">
                    {makkahSettings.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {makkahSettings.subtitle}
                  </p>
                </div>

                {makkahHotels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hotels available in Makkah at the moment.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {makkahHotels.map((hotel, index) => (
                      <HotelCard
                        key={hotel.id}
                        hotel={hotel}
                        index={index}
                        starLabel={generalSettings.star_label}
                        showDetailsButton={generalSettings.show_details_button}
                        showMapButton={generalSettings.show_map_button}
                        bookingEnabled={generalSettings.booking_enabled}
                        onViewDetails={() => handleViewDetails(hotel)}
                        onViewMap={() => handleViewMap(hotel)}
                        onBookNow={() => handleBookNow(hotel)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="madinah" className="mt-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-heading text-xl md:text-2xl font-semibold">
                    {madinahSettings.title}
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    {madinahSettings.subtitle}
                  </p>
                </div>

                {madinahHotels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No hotels available in Madinah at the moment.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {madinahHotels.map((hotel, index) => (
                      <HotelCard
                        key={hotel.id}
                        hotel={hotel}
                        index={index}
                        starLabel={generalSettings.star_label}
                        showDetailsButton={generalSettings.show_details_button}
                        showMapButton={generalSettings.show_map_button}
                        bookingEnabled={generalSettings.booking_enabled}
                        onViewDetails={() => handleViewDetails(hotel)}
                        onViewMap={() => handleViewMap(hotel)}
                        onBookNow={() => handleBookNow(hotel)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </div>

      {/* Modals */}
      <HotelDetailsModal
        hotel={selectedHotel}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        starLabel={generalSettings.star_label}
        bookingEnabled={generalSettings.booking_enabled}
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
