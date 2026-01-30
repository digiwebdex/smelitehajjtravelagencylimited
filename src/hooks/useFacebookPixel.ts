import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateEventId, getFacebookCookies } from "@/components/FacebookPixel";

interface FacebookPixelSettings {
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
  is_enabled: boolean;
}

interface TrackEventParams {
  eventName: string;
  value?: number;
  currency?: string;
  contentName?: string;
  contentId?: string;
  contentType?: string;
  userData?: {
    email?: string;
    phone?: string;
  };
  customData?: Record<string, unknown>;
}

export const useFacebookPixel = () => {
  const [settings, setSettings] = useState<FacebookPixelSettings | null>(null);
  const [isReady, setIsReady] = useState(false);

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
          setIsReady(pixelSettings.is_enabled && !!pixelSettings.pixel_id);
        }
      } catch (error) {
        console.error("Error fetching Facebook Pixel settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // Track event on both browser (Pixel) and server (Conversions API)
  const trackEvent = useCallback(async ({
    eventName,
    value,
    currency = "BDT",
    contentName,
    contentId,
    contentType,
    userData,
    customData = {},
  }: TrackEventParams) => {
    if (!isReady || !settings?.is_enabled) return;

    const eventId = generateEventId(eventName);
    const fbCookies = getFacebookCookies();
    const eventSourceUrl = window.location.href;

    // Browser-side tracking via Pixel
    if (window.fbq) {
      const pixelData: Record<string, unknown> = { ...customData };
      if (value !== undefined) pixelData.value = value;
      if (currency) pixelData.currency = currency;
      if (contentName) pixelData.content_name = contentName;
      if (contentId) pixelData.content_ids = [contentId];
      if (contentType) pixelData.content_type = contentType;

      window.fbq('track', eventName, pixelData, { eventID: eventId });
    }

    // Server-side tracking via Conversions API (edge function)
    try {
      await supabase.functions.invoke("fb-event", {
        body: {
          event_name: eventName,
          event_id: eventId,
          event_source_url: eventSourceUrl,
          user_data: {
            email: userData?.email,
            phone: userData?.phone,
            client_user_agent: navigator.userAgent,
            fbc: fbCookies.fbc,
            fbp: fbCookies.fbp,
          },
          custom_data: {
            value,
            currency,
            content_name: contentName,
            content_ids: contentId ? [contentId] : undefined,
            content_type: contentType,
            ...customData,
          },
        },
      });
    } catch (error) {
      console.error("Failed to send server-side event:", error);
    }
  }, [isReady, settings]);

  // Convenience methods for common events
  const trackPageView = useCallback(() => {
    trackEvent({ eventName: "PageView" });
  }, [trackEvent]);

  const trackViewContent = useCallback((params: {
    contentId: string;
    contentName: string;
    contentType?: string;
    value?: number;
  }) => {
    trackEvent({
      eventName: "ViewContent",
      contentId: params.contentId,
      contentName: params.contentName,
      contentType: params.contentType || "product",
      value: params.value,
    });
  }, [trackEvent]);

  const trackInitiateCheckout = useCallback((params: {
    contentId: string;
    contentName: string;
    value: number;
    currency?: string;
  }) => {
    trackEvent({
      eventName: "InitiateCheckout",
      contentId: params.contentId,
      contentName: params.contentName,
      value: params.value,
      currency: params.currency || "BDT",
    });
  }, [trackEvent]);

  const trackPurchase = useCallback((params: {
    contentId: string;
    contentName: string;
    value: number;
    currency?: string;
    userData?: { email?: string; phone?: string };
  }) => {
    trackEvent({
      eventName: "Purchase",
      contentId: params.contentId,
      contentName: params.contentName,
      value: params.value,
      currency: params.currency || "BDT",
      userData: params.userData,
    });
  }, [trackEvent]);

  const trackLead = useCallback((params?: {
    contentName?: string;
    value?: number;
    userData?: { email?: string; phone?: string };
  }) => {
    trackEvent({
      eventName: "Lead",
      contentName: params?.contentName,
      value: params?.value,
      userData: params?.userData,
    });
  }, [trackEvent]);

  return {
    isReady,
    trackEvent,
    trackPageView,
    trackViewContent,
    trackInitiateCheckout,
    trackPurchase,
    trackLead,
  };
};
