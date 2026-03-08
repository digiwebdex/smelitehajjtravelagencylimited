import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SEOSettings {
  site_title: string;
  site_description: string;
  site_keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  og_type: string;
  og_url: string;
  twitter_card: string;
  twitter_site: string;
  twitter_image: string;
  canonical_url: string;
  favicon_url: string;
  robots_index: boolean;
  robots_follow: boolean;
  json_ld_enabled: boolean;
  json_ld_business_name: string;
  json_ld_business_type: string;
  json_ld_phone: string;
  json_ld_email: string;
  json_ld_address: string;
  json_ld_city: string;
  json_ld_country: string;
  json_ld_logo: string;
  google_site_verification: string;
  bing_site_verification: string;
}

const DynamicSEOHead = () => {
  const [seo, setSeo] = useState<SEOSettings | null>(null);

  useEffect(() => {
    const fetchSEO = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "seo_settings")
        .maybeSingle();

      if (data?.setting_value) {
        setSeo(data.setting_value as unknown as SEOSettings);
      }
    };
    fetchSEO();
  }, []);

  useEffect(() => {
    if (!seo) return;

    // Title
    if (seo.site_title) {
      document.title = seo.site_title;
    }

    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Basic meta
    setMeta("description", seo.site_description);
    if (seo.site_keywords) setMeta("keywords", seo.site_keywords);

    // Robots
    const robotsContent = `${seo.robots_index ? "index" : "noindex"}, ${seo.robots_follow ? "follow" : "nofollow"}`;
    setMeta("robots", robotsContent);

    // Open Graph
    setMeta("og:title", seo.og_title || seo.site_title, "property");
    setMeta("og:description", seo.og_description || seo.site_description, "property");
    setMeta("og:type", seo.og_type || "website", "property");
    if (seo.og_url) setMeta("og:url", seo.og_url, "property");
    if (seo.og_image) setMeta("og:image", seo.og_image, "property");

    // Twitter
    setMeta("twitter:card", seo.twitter_card || "summary_large_image");
    if (seo.twitter_site) setMeta("twitter:site", seo.twitter_site);
    if (seo.twitter_image) setMeta("twitter:image", seo.twitter_image);

    // Canonical
    if (seo.canonical_url) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = seo.canonical_url;
    }

    // Favicon
    if (seo.favicon_url) {
      const updateFavicon = (selector: string, attr: string) => {
        let el = document.querySelector(selector) as HTMLLinkElement;
        if (el) el.href = seo.favicon_url;
      };
      updateFavicon('link[rel="icon"]', "href");
      updateFavicon('link[rel="shortcut icon"]', "href");
      updateFavicon('link[rel="apple-touch-icon"]', "href");
    }

    // Google verification
    if (seo.google_site_verification) {
      setMeta("google-site-verification", seo.google_site_verification);
    }

    // Bing verification
    if (seo.bing_site_verification) {
      setMeta("msvalidate.01", seo.bing_site_verification);
    }

    // JSON-LD
    if (seo.json_ld_enabled) {
      let script = document.querySelector('script[data-seo-jsonld]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.setAttribute("data-seo-jsonld", "true");
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": seo.json_ld_business_type || "TravelAgency",
        name: seo.json_ld_business_name,
        telephone: seo.json_ld_phone,
        email: seo.json_ld_email,
        url: seo.canonical_url || seo.og_url,
        logo: seo.json_ld_logo,
        address: {
          "@type": "PostalAddress",
          streetAddress: seo.json_ld_address,
          addressLocality: seo.json_ld_city,
          addressCountry: seo.json_ld_country,
        },
      });
    }
  }, [seo]);

  return null;
};

export default DynamicSEOHead;
