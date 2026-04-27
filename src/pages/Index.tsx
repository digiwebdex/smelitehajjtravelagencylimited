import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load non-critical components for faster initial page load
const OfferPopup = lazy(() => import("@/components/OfferPopup"));
const NoticeBoard = lazy(() => import("@/components/NoticeBoard"));
const ServicesOverview = lazy(() => import("@/components/ServicesOverview"));
const HajjPackages = lazy(() => import("@/components/HajjPackages"));
const UmrahPackages = lazy(() => import("@/components/UmrahPackages"));
const VisaServices = lazy(() => import("@/components/VisaServices"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const TeamSection = lazy(() => import("@/components/TeamSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const GallerySection = lazy(() => import("@/components/GallerySection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const Footer = lazy(() => import("@/components/Footer"));
const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton"));
const MobileCTABar = lazy(() => import("@/components/MobileCTABar"));

interface SectionVisibility {
  [key: string]: boolean;
}

// Loading placeholder for lazy components
const SectionSkeleton = ({ height = "h-96" }: { height?: string }) => (
  <div className={`${height} w-full animate-pulse bg-muted/30`}>
    <div className="container py-12">
      <Skeleton className="h-8 w-48 mx-auto mb-4" />
      <Skeleton className="h-4 w-64 mx-auto mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    </div>
  </div>
);

const Index = () => {
  const [sectionVisibility, setSectionVisibility] = useState<SectionVisibility>({
    hero: true,
    notices: true,
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
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Offer Popup - shows once per session when enabled */}
      <Suspense fallback={null}>
        <OfferPopup />
      </Suspense>
      
      <main>
        {sectionVisibility.hero && <HeroSection />}
        
        <Suspense fallback={<SectionSkeleton height="h-32" />}>
          {sectionVisibility.notices && <NoticeBoard />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.services && <ServicesOverview />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.hajj_packages && <HajjPackages />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.umrah_packages && <UmrahPackages />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.visa_services && <VisaServices />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.testimonials && <TestimonialsSection />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.team && <TeamSection />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.faq && <FAQSection />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.gallery && <GallerySection />}
        </Suspense>
        
        <Suspense fallback={<SectionSkeleton />}>
          {sectionVisibility.contact && <ContactSection />}
        </Suspense>
      </main>
      
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      
      <Suspense fallback={null}>
        <WhatsAppButton />
        <MobileCTABar />
      </Suspense>
    </div>
  );
};

export default Index;
