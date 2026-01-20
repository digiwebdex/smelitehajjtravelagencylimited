import { useState, useEffect } from "react";
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
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MobileCTABar from "@/components/MobileCTABar";

interface SectionVisibility {
  [key: string]: boolean;
}

const Index = () => {
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    hero: true,
    services: true,
    hajj_packages: true,
    umrah_packages: true,
    visa_services: true,
    testimonials: true,
    team: true,
    faq: true,
    gallery: true,
    contact: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSectionVisibility();
  }, []);

  const fetchSectionVisibility = async () => {
    try {
      const { data } = await supabase
        .from("section_settings")
        .select("section_key, is_active");

      if (data && data.length > 0) {
        const visibility: SectionVisibility = { ...sectionVisibility };
        data.forEach((setting) => {
          visibility[setting.section_key] = setting.is_active;
        });
        setSectionVisibility(visibility);
      }
    } catch (error) {
      console.error("Error fetching section visibility:", error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton briefly
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <div className="h-screen animate-pulse bg-muted/30" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {sectionVisibility.hero && <HeroSection />}
        {sectionVisibility.services && <ServicesOverview />}
        {sectionVisibility.hajj_packages && <HajjPackages />}
        {sectionVisibility.umrah_packages && <UmrahPackages />}
        {sectionVisibility.visa_services && <VisaServices />}
        {sectionVisibility.testimonials && <TestimonialsSection />}
        {sectionVisibility.team && <TeamSection />}
        {sectionVisibility.faq && <FAQSection />}
        {sectionVisibility.gallery && <GallerySection />}
        {sectionVisibility.contact && <ContactSection />}
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileCTABar />
    </div>
  );
};

export default Index;
