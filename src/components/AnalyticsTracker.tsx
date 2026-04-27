import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useVisitTracker } from "@/hooks/useVisitTracker";

interface AnalyticsSettings {
  measurement_id: string;
  is_enabled: boolean;
}

// Lazy ref to react-ga4 — heavy lib, only loaded when GA is actually configured
type GA = typeof import("react-ga4").default;
let gaPromise: Promise<GA> | null = null;
const loadGA = () => {
  if (!gaPromise) gaPromise = import("react-ga4").then(m => m.default);
  return gaPromise;
};

const AnalyticsTracker = () => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null);
  const gaRef = useRef<GA | null>(null);

  // Track every public page visit into our own DB for admin Traffic Status
  useVisitTracker();

  // Fetch analytics settings from database — heavily deferred so it never competes with LCP/TBT
  useEffect(() => {
    let cancelled = false;
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("setting_value")
          .eq("setting_key", "analytics")
          .maybeSingle();

        if (cancelled) return;
        if (!error && data?.setting_value) {
          setSettings(data.setting_value as unknown as AnalyticsSettings);
        }
      } catch (error) {
        console.error("Error fetching analytics settings:", error);
      }
    };

    // Wait for window 'load' (everything painted), THEN idle, THEN fetch.
    // On mobile this typically pushes execution well past LCP.
    const schedule = () => {
      const idle = (cb: () => void) => {
        if (typeof (window as any).requestIdleCallback === "function") {
          (window as any).requestIdleCallback(cb, { timeout: 5000 });
        } else {
          setTimeout(cb, 3000);
        }
      };
      idle(fetchSettings);
    };

    if (document.readyState === "complete") {
      setTimeout(schedule, 1500);
    } else {
      window.addEventListener("load", () => setTimeout(schedule, 1500), { once: true });
    }

    return () => { cancelled = true; };
  }, []);

  // Initialize GA4 lazily when settings are loaded
  useEffect(() => {
    if (!settings?.is_enabled || !settings?.measurement_id || isInitialized) return;
    const measurementId = settings.measurement_id.trim();
    if (!/^G-[A-Z0-9]+$/.test(measurementId)) {
      console.warn("Invalid GA4 Measurement ID format:", measurementId);
      return;
    }
    loadGA().then(ReactGA => {
      try {
        ReactGA.initialize(measurementId, {
          gaOptions: { siteSpeedSampleRate: 100 },
        });
        gaRef.current = ReactGA;
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize Google Analytics:", error);
      }
    });
  }, [settings, isInitialized]);

  // Track page views on route change
  useEffect(() => {
    if (isInitialized && gaRef.current) {
      gaRef.current.send({
        hitType: "pageview",
        page: location.pathname + location.search,
        title: document.title,
      });
    }
  }, [location, isInitialized]);

  return null;
};

export default AnalyticsTracker;
