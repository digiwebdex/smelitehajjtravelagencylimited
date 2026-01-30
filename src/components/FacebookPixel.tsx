import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface FacebookPixelSettings {
  pixel_id: string;
  is_enabled: boolean;
  test_event_code?: string;
}

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

// Generate unique event ID for deduplication
export const generateEventId = (eventName: string): string => {
  return `${eventName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get Facebook cookies for Conversions API
export const getFacebookCookies = () => {
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
  };

  return {
    fbc: getCookie('_fbc'),
    fbp: getCookie('_fbp'),
  };
};

const FacebookPixel = () => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<FacebookPixelSettings | null>(null);

  // Fetch pixel settings from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "facebook_pixel")
          .maybeSingle();

        if (!error && data?.setting_value) {
          const pixelSettings = data.setting_value as unknown as FacebookPixelSettings;
          setSettings(pixelSettings);
        }
      } catch (error) {
        console.error("Error fetching Facebook Pixel settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Initialize Facebook Pixel when settings are loaded
  useEffect(() => {
    if (settings?.is_enabled && settings?.pixel_id && !isInitialized) {
      const pixelId = settings.pixel_id.trim();
      
      // Validate pixel ID format (numeric string)
      if (!/^\d+$/.test(pixelId)) {
        console.warn("Invalid Facebook Pixel ID format:", pixelId);
        return;
      }

      try {
        // Facebook Pixel base code
        (function(f: Window, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
          if (f.fbq) return;
          n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          n.push = n;
          n.loaded = true;
          n.version = '2.0';
          n.queue = [];
          t = b.createElement(e) as HTMLScriptElement;
          t.async = true;
          t.src = v;
          s = b.getElementsByTagName(e)[0];
          s?.parentNode?.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

        window.fbq('init', pixelId);
        
        // Track initial page view
        const eventId = generateEventId('PageView');
        window.fbq('track', 'PageView', {}, { eventID: eventId });
        
        setIsInitialized(true);
        console.log("Facebook Pixel initialized:", pixelId);
      } catch (error) {
        console.error("Failed to initialize Facebook Pixel:", error);
      }
    }
  }, [settings, isInitialized]);

  // Track page views on route change
  useEffect(() => {
    if (isInitialized && window.fbq) {
      const eventId = generateEventId('PageView');
      window.fbq('track', 'PageView', {}, { eventID: eventId });
    }
  }, [location, isInitialized]);

  return null; // This component doesn't render anything
};

export default FacebookPixel;
