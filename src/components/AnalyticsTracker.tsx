import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactGA from "react-ga4";
import { supabase } from "@/integrations/supabase/client";
import { useVisitTracker } from "@/hooks/useVisitTracker";

interface AnalyticsSettings {
  measurement_id: string;
  is_enabled: boolean;
}

const AnalyticsTracker = () => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);

  // Track every public page visit into our own DB for admin Traffic Status
  useVisitTracker();

  // Fetch analytics settings from database — deferred to idle time so it doesn't block LCP/TBT
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "analytics")
          .maybeSingle();

        if (!error && data?.setting_value) {
          const analyticsSettings = data.setting_value as unknown as AnalyticsSettings;
          setSettings(analyticsSettings);
        }
      } catch (error) {
        console.error("Error fetching analytics settings:", error);
      }
    };

    const idle = (cb: () => void) => {
      if (typeof (window as any).requestIdleCallback === "function") {
        (window as any).requestIdleCallback(cb, { timeout: 3000 });
      } else {
        setTimeout(cb, 2000);
      }
    };
    idle(fetchSettings);
  }, []);

  // Initialize GA4 when settings are loaded
  useEffect(() => {
    if (settings?.is_enabled && settings?.measurement_id && !isInitialized) {
      const measurementId = settings.measurement_id.trim();
      
      // Validate measurement ID format (G-XXXXXXXXXX)
      if (/^G-[A-Z0-9]+$/.test(measurementId)) {
        try {
          ReactGA.initialize(measurementId, {
            gaOptions: {
              siteSpeedSampleRate: 100,
            },
          });
          setIsInitialized(true);
          console.log("Google Analytics initialized:", measurementId);
        } catch (error) {
          console.error("Failed to initialize Google Analytics:", error);
        }
      } else {
        console.warn("Invalid GA4 Measurement ID format:", measurementId);
      }
    }
  }, [settings, isInitialized]);

  // Track page views on route change
  useEffect(() => {
    if (isInitialized) {
      ReactGA.send({
        hitType: "pageview",
        page: location.pathname + location.search,
        title: document.title,
      });
    }
  }, [location, isInitialized]);

  return null; // This component doesn't render anything
};

export default AnalyticsTracker;
