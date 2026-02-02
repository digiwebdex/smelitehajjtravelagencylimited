import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OfferPopupSettings {
  is_enabled: boolean;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  button_text: string;
  button_link: string;
  badge_text: string;
  discount_text: string;
  display_delay_seconds: number;
  show_once_per_session: boolean;
  background_color: string;
  text_color: string;
  overlay_opacity: number;
}

const STORAGE_KEY = "offer_popup_shown";

const OfferPopup = () => {
  const [settings, setSettings] = useState<OfferPopupSettings | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings || !settings.is_enabled || loading) return;

    // Check if already shown this session
    if (settings.show_once_per_session) {
      const alreadyShown = sessionStorage.getItem(STORAGE_KEY);
      if (alreadyShown) return;
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsOpen(true);
      if (settings.show_once_per_session) {
        sessionStorage.setItem(STORAGE_KEY, "true");
      }
    }, settings.display_delay_seconds * 1000);

    return () => clearTimeout(timer);
  }, [settings, loading]);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "offer_popup")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching popup settings:", error);
        return;
      }

      if (data?.setting_value) {
        setSettings(data.setting_value as unknown as OfferPopupSettings);
      }
    } catch (error) {
      console.error("Error fetching popup settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    setIsOpen(false);
    if (settings?.button_link) {
      if (settings.button_link.startsWith("#")) {
        const element = document.querySelector(settings.button_link);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.location.href = settings.button_link;
      }
    }
  };

  if (!settings || !settings.is_enabled) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent 
            className="p-0 border-0 bg-transparent shadow-none max-w-md sm:max-w-lg overflow-hidden"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative rounded-2xl overflow-hidden shadow-2xl bg-card max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 transition-colors text-white"
                aria-label="Close popup"
              >
                <X className="w-4 h-4" />
              </button>

            {/* Offer Content Section */}
            <div 
              className="rounded-xl mx-2 my-2 overflow-hidden"
              style={{ 
                backgroundColor: settings.background_color,
                color: settings.text_color
              }}
            >
                {/* Badge */}
                {settings.badge_text && (
                  <div className="text-center py-2" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
                    <span className="text-sm font-medium tracking-wide">
                      {settings.badge_text}
                    </span>
                  </div>
                )}

                {/* Banner Image */}
                {settings.image_url && (
                  <div className="relative h-32 sm:h-40 overflow-hidden">
                    <img
                      src={settings.image_url}
                      alt="Offer Banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 text-center space-y-3">
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-xl sm:text-2xl font-bold"
                  >
                    ✨ {settings.title} ✨
                  </motion.h2>

                  {settings.subtitle && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm opacity-90 font-medium"
                    >
                      {settings.subtitle}
                    </motion.p>
                  )}

                  {settings.description && (
                    <motion.p 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-xs opacity-80 leading-relaxed"
                    >
                      {settings.description}
                    </motion.p>
                  )}

                  {settings.discount_text && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="py-2"
                    >
                      <span 
                        className="inline-block px-4 py-1.5 rounded-full text-base font-bold"
                        style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                      >
                        {settings.discount_text}
                      </span>
                    </motion.div>
                  )}

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-2 justify-center items-center pt-2"
                  >
                    <Button 
                      onClick={handleButtonClick}
                      size="default"
                      variant="secondary"
                      className="font-semibold px-6 py-5 text-sm rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      {settings.button_text} →
                    </Button>
                    <Button 
                      onClick={() => {
                        setIsOpen(false);
                        const element = document.querySelector("#contact");
                        if (element) element.scrollIntoView({ behavior: "smooth" });
                      }}
                      size="default"
                      className="font-semibold px-6 py-5 text-sm rounded-xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-lg hover:shadow-xl transition-all"
                    >
                      Book Now →
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default OfferPopup;
