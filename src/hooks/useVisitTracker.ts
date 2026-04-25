import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "smelite_visitor_id";
const SESSION_KEY = "smelite_session_id";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

const genId = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = genId();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
};

const getSessionId = () => {
  const stored = sessionStorage.getItem(SESSION_KEY);
  const lastTouch = parseInt(sessionStorage.getItem(SESSION_KEY + "_t") || "0", 10);
  const now = Date.now();
  if (stored && now - lastTouch < SESSION_TTL_MS) {
    sessionStorage.setItem(SESSION_KEY + "_t", String(now));
    return stored;
  }
  const id = genId();
  sessionStorage.setItem(SESSION_KEY, id);
  sessionStorage.setItem(SESSION_KEY + "_t", String(now));
  return id;
};

const detectDevice = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/.test(ua)) return "Mobile";
  return "Desktop";
};

const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua)) return "Safari";
  return "Other";
};

const detectOS = (): string => {
  const ua = navigator.userAgent;
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
};

const detectReferrerSource = (referrer: string): string => {
  if (!referrer) return "Direct";
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    if (host.includes("google.")) return "Google";
    if (host.includes("bing.")) return "Bing";
    if (host.includes("yahoo.")) return "Yahoo";
    if (host.includes("duckduckgo.")) return "DuckDuckGo";
    if (host.includes("facebook.") || host.includes("fb.")) return "Facebook";
    if (host.includes("instagram.")) return "Instagram";
    if (host.includes("twitter.") || host.includes("t.co") || host.includes("x.com")) return "Twitter/X";
    if (host.includes("youtube.")) return "YouTube";
    if (host.includes("tiktok.")) return "TikTok";
    if (host.includes("linkedin.")) return "LinkedIn";
    if (host.includes("whatsapp.")) return "WhatsApp";
    if (host.includes("telegram.") || host.includes("t.me")) return "Telegram";
    if (host.includes(window.location.hostname)) return "Internal";
    return host;
  } catch {
    return "Other";
  }
};

let geoCache: { country?: string; city?: string } | null = null;
const fetchGeo = async (): Promise<{ country?: string; city?: string }> => {
  if (geoCache) return geoCache;
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "force-cache" });
    if (!res.ok) return {};
    const data = await res.json();
    geoCache = {
      country: data?.country_name || undefined,
      city: data?.city || undefined,
    };
    return geoCache;
  } catch {
    return {};
  }
};

export const useVisitTracker = () => {
  const location = useLocation();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // Skip admin & auth pages
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/auth")) {
      return;
    }
    const key = location.pathname + location.search;
    if (lastTracked.current === key) return;
    lastTracked.current = key;

    const track = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const referrer = document.referrer || "";
        const geo = await fetchGeo();
        await supabase.from("page_visits").insert({
          visitor_id: getVisitorId(),
          session_id: getSessionId(),
          page_path: location.pathname,
          page_title: document.title,
          referrer: referrer || null,
          referrer_source: detectReferrerSource(referrer),
          country: geo.country || null,
          city: geo.city || null,
          device_type: detectDevice(),
          browser: detectBrowser(),
          os: detectOS(),
          language: navigator.language,
          user_agent: navigator.userAgent,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
        });
      } catch (err) {
        console.warn("Visit tracking failed:", err);
      }
    };

    track();
  }, [location.pathname, location.search]);
};
