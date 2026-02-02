import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plane, 
  Hotel, 
  Shield, 
  Users, 
  Clock, 
  HeartHandshake, 
  LucideIcon,
  FileCheck,
  Bus,
  Headset,
  Building2,
  PlaneTakeoff,
  Ticket,
  Map,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import IslamicBorder from "./IslamicBorder";
import MakkahIcon from "./icons/MakkahIcon";
import MadinahIcon from "./icons/MadinahIcon";
import AirTicketBookingModal from "./AirTicketBookingModal";

interface Service {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  link_url: string | null;
  order_index: number;
}

interface ParentCompanySettings {
  button_text: string;
  button_link: string;
  is_enabled: boolean;
}

interface SectionHeaderSettings {
  badge_text: string;
  title: string;
  arabic_text: string;
}

// Extended icon map with more travel/pilgrimage relevant icons
const iconMap: Record<string, LucideIcon> = {
  Plane,
  PlaneTakeoff,
  Hotel,
  Building: Building2,
  Building2,
  Shield,
  FileCheck,
  Users,
  Clock,
  Headset,
  Headphones: Headset,
  HeartHandshake,
  Bus,
  Ticket,
  Map,
  Globe: Map,
  Compass: Map,
};

// Custom icon names for Makkah and Madinah
const customIconMap: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Makkah: MakkahIcon,
  Madinah: MadinahIcon,
  Kaaba: MakkahIcon,
  Mosque: MadinahIcon,
};

// Consistent icon container component for Lucide icons
const ServiceIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/90 shadow-md">
    <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
  </div>
);

// Custom icon container component for Makkah/Madinah icons
const CustomServiceIcon = ({ icon: Icon }: { icon: React.FC<{ size?: number; className?: string }> }) => (
  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/90 shadow-md">
    <Icon size={28} className="text-primary-foreground" />
  </div>
);

const ServicesOverview = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [airTicketModalOpen, setAirTicketModalOpen] = useState(false);
  const [parentCompany, setParentCompany] = useState<ParentCompanySettings>({
    button_text: "Visit Parent Company",
    button_link: "",
    is_enabled: false
  });
  const [sectionHeader, setSectionHeader] = useState<SectionHeaderSettings>({
    badge_text: "Why Choose Us",
    title: "Our Service",
    arabic_text: "خدماتنا"
  });

  useEffect(() => {
    fetchServices();
    fetchParentCompanySettings();
    fetchSectionHeaderSettings();
  }, []);

  const fetchSectionHeaderSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("setting_key", "services_section_header")
      .single();
    
    if (data?.setting_value) {
      const settings = data.setting_value as unknown as SectionHeaderSettings;
      setSectionHeader({
        badge_text: settings.badge_text || "Why Choose Us",
        title: settings.title || "Our Service",
        arabic_text: settings.arabic_text || "خدماتنا"
      });
    }
  };

  const fetchParentCompanySettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("*")
      .eq("setting_key", "parent_company")
      .single();
    
    if (data?.setting_value) {
      const settings = data.setting_value as unknown as ParentCompanySettings;
      setParentCompany({
        button_text: settings.button_text || "Visit Parent Company",
        button_link: settings.button_link || "",
        is_enabled: settings.is_enabled ?? false
      });
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setServices(data);
    } else {
      setServices([
        { id: "1", icon_name: "Plane", title: "Flight Booking", description: "Premium airlines with comfortable travel arrangements to Saudi Arabia", link_url: null, order_index: 0 },
        { id: "2", icon_name: "Hotel", title: "Hotel Accommodation", description: "Hand-picked hotels near Haram for convenient access to worship", link_url: null, order_index: 1 },
        { id: "3", icon_name: "Shield", title: "Visa Processing", description: "100% success rate in Hajj & Umrah visa processing", link_url: "#visa", order_index: 2 },
        { id: "4", icon_name: "Users", title: "Expert Guides", description: "Experienced Islamic scholars to guide you through rituals", link_url: null, order_index: 3 },
        { id: "5", icon_name: "Clock", title: "24/7 Support", description: "Round-the-clock assistance throughout your spiritual journey", link_url: "#contact", order_index: 4 },
        { id: "6", icon_name: "HeartHandshake", title: "Complete Care", description: "From departure to return, we handle every detail with care", link_url: null, order_index: 5 },
        { id: "7", icon_name: "Ticket", title: "Air Ticket", description: "Affordable air tickets to destinations worldwide with trusted airlines", link_url: null, order_index: 6 },
        { id: "8", icon_name: "Map", title: "Tour Package", description: "Exciting tour packages to explore beautiful destinations around the world", link_url: null, order_index: 7 },
      ]);
    }
    setLoading(false);
  };

  const getIcon = (iconName: string): LucideIcon | null => {
    return iconMap[iconName] || null;
  };

  const getCustomIcon = (iconName: string): React.FC<{ size?: number; className?: string }> | null => {
    return customIconMap[iconName] || null;
  };

  const isCustomIcon = (iconName: string): boolean => {
    return iconName in customIconMap;
  };

  const handleServiceClick = (service: Service) => {
    // Check if this is the Air Ticket service
    if (service.title.toLowerCase().includes('air ticket') || service.icon_name === 'Ticket') {
      setAirTicketModalOpen(true);
      return;
    }
    
    // Check if this is the Hotel service - navigate to /hotels page
    if (service.title.toLowerCase().includes('hotel') || service.icon_name === 'Hotel' || service.icon_name === 'Building2') {
      navigate('/hotels');
      return;
    }
    
    if (!service.link_url) return;
    
    const url = service.link_url;
    
    // Handle section links (starting with #)
    if (url.startsWith('#')) {
      const element = document.querySelector(url);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } 
    // Handle external URLs
    else if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // Handle relative URLs
    else {
      window.location.href = url;
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-card relative overflow-hidden">
        <div className="container">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <IslamicBorder>
      <section id="services" className="py-20 bg-card relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/5 rounded-full translate-x-1/2 translate-y-1/2" />
      
      <div className="container relative z-10">
        <div className="text-center mb-12">
          <span className="text-secondary font-semibold uppercase tracking-wider">
            {sectionHeader.badge_text}
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl font-bold text-foreground mt-3 mb-4">
            {sectionHeader.title}
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">{sectionHeader.arabic_text}</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {services.map((service, index) => {
            const isCustom = isCustomIcon(service.icon_name);
            const CustomIcon = isCustom ? getCustomIcon(service.icon_name) : null;
            const LucideIconComponent = !isCustom ? (getIcon(service.icon_name) || Plane) : null;
            
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -4,
                }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  scale: { duration: 0.2 },
                  y: { duration: 0.2 },
                }}
                onClick={() => handleServiceClick(service)}
                className={`group relative flex items-start gap-4 p-6 rounded-xl transition-all duration-300 overflow-hidden cursor-pointer
                  ${index % 2 === 0 ? 'bg-muted/30' : 'bg-card'}
                  hover:bg-gradient-to-br hover:from-primary/5 hover:to-secondary/10
                  before:absolute before:inset-0 before:rounded-xl before:border-2 before:border-transparent before:transition-all before:duration-300
                  hover:before:border-primary/30 hover:before:shadow-[0_0_20px_rgba(30,58,95,0.15)]
                `}
              >
                {/* Gradient border overlay on hover */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
                
                {isCustom && CustomIcon ? (
                  <CustomServiceIcon icon={CustomIcon} />
                ) : LucideIconComponent ? (
                  <ServiceIcon icon={LucideIconComponent} />
                ) : null}
                <div className="relative z-10">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                    {service.link_url && (
                      <span className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    )}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Parent Company Button */}
        {parentCompany.is_enabled && parentCompany.button_link && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center mt-12"
          >
            <button
              onClick={() => window.open(parentCompany.button_link, '_blank')}
              className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold overflow-hidden rounded-xl transition-all duration-500"
            >
              {/* Fixed green background */}
              <span className="absolute inset-0 bg-primary rounded-xl" />
              
              {/* Animated golden shine sweep - continuous animation */}
              <span 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/60 to-transparent animate-[shine-sweep_2.5s_ease-in-out_infinite]"
                style={{
                  backgroundSize: '200% 100%',
                }}
              />
              
              {/* Golden glow pulse */}
              <span className="absolute -inset-1 rounded-xl bg-gradient-to-r from-secondary/40 via-secondary/60 to-secondary/40 blur-md animate-[glow-pulse_2s_ease-in-out_infinite] -z-10" />
              
              {/* Border with golden accent */}
              <span className="absolute inset-0 rounded-xl border-2 border-secondary/30 group-hover:border-secondary/60 transition-colors duration-300" />
              
              {/* Icon */}
              <ExternalLink className="relative z-10 w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              
              {/* Text */}
              <span className="relative z-10 text-white tracking-wide drop-shadow-md">
                {parentCompany.button_text}
              </span>
              
              {/* Arrow indicator */}
              <span className="relative z-10 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-white">
                →
              </span>
            </button>
          </motion.div>
        )}
      </div>
      </section>

      {/* Air Ticket Booking Modal */}
      <AirTicketBookingModal 
        open={airTicketModalOpen} 
        onOpenChange={setAirTicketModalOpen} 
      />
    </IslamicBorder>
  );
};

export default ServicesOverview;
