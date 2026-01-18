import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesOverview from "@/components/ServicesOverview";
import HajjPackages from "@/components/HajjPackages";
import UmrahPackages from "@/components/UmrahPackages";
import VisaServices from "@/components/VisaServices";
import TestimonialsSection from "@/components/TestimonialsSection";
import TeamSection from "@/components/TeamSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import GallerySection from "@/components/GallerySection";
import TerminalSection from "@/components/TerminalSection";
import AboutSection from "@/components/AboutSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface SectionSetting {
  section_key: string;
  is_active: boolean;
  order_index: number;
  bg_color: string | null;
  text_color: string | null;
  custom_css: string | null;
}

// Map section keys to components
const SECTION_COMPONENTS: Record<string, React.ComponentType<{ style?: React.CSSProperties; className?: string }>> = {
  hero: HeroSection,
  services: ServicesOverview,
  about: AboutSection,
  hajj: HajjPackages,
  umrah: UmrahPackages,
  visa: VisaServices,
  gallery: GallerySection,
  testimonials: TestimonialsSection,
  team: TeamSection,
  faq: FAQSection,
  terminal: TerminalSection,
  contact: ContactSection,
};

// Default section order (fallback)
const DEFAULT_SECTIONS: SectionSetting[] = [
  { section_key: 'hero', is_active: true, order_index: 1, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'about', is_active: true, order_index: 2, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'services', is_active: true, order_index: 3, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'hajj', is_active: true, order_index: 4, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'umrah', is_active: true, order_index: 5, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'visa', is_active: true, order_index: 6, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'gallery', is_active: true, order_index: 7, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'testimonials', is_active: true, order_index: 8, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'team', is_active: true, order_index: 9, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'faq', is_active: true, order_index: 10, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'terminal', is_active: true, order_index: 11, bg_color: null, text_color: null, custom_css: null },
  { section_key: 'contact', is_active: true, order_index: 12, bg_color: null, text_color: null, custom_css: null },
];

const Index = () => {
  const [sections, setSections] = useState<SectionSetting[]>(DEFAULT_SECTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectionSettings();
  }, []);

  const fetchSectionSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("section_settings")
        .select("section_key, is_active, order_index, bg_color, text_color, custom_css")
        .order("order_index");

      if (error) {
        console.error("Error fetching section settings:", error);
        setSections(DEFAULT_SECTIONS);
      } else if (data && data.length > 0) {
        // Merge with defaults for any missing sections
        const existingKeys = data.map(s => s.section_key);
        const mergedSections = [
          ...data,
          ...DEFAULT_SECTIONS.filter(d => !existingKeys.includes(d.section_key))
        ].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        
        setSections(mergedSections);
      }
    } catch (err) {
      console.error("Failed to fetch sections:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort active sections
  const activeSections = useMemo(() => {
    return sections
      .filter(s => s.is_active && SECTION_COMPONENTS[s.section_key])
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  }, [sections]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {activeSections.map((section) => {
          const Component = SECTION_COMPONENTS[section.section_key];
          if (!Component) return null;

          const style: React.CSSProperties = {};
          if (section.bg_color) style.backgroundColor = section.bg_color;
          if (section.text_color) style.color = section.text_color;

          return (
            <div
              key={section.section_key}
              style={Object.keys(style).length > 0 ? style : undefined}
              className={section.custom_css || undefined}
            >
              <Component />
            </div>
          );
        })}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
