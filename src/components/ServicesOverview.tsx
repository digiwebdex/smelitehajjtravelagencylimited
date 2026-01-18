import { useState, useEffect } from "react";
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
  PlaneTakeoff
} from "lucide-react";
import IslamicBorder from "./IslamicBorder";

interface Service {
  id: string;
  icon_name: string;
  title: string;
  description: string;
  order_index: number;
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
};

// Consistent icon container component
const ServiceIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 hover:bg-primary/90 shadow-md">
    <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
  </div>
);

const ServicesOverview = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

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
        { id: "1", icon_name: "Plane", title: "Flight Booking", description: "Premium airlines with comfortable travel arrangements to Saudi Arabia", order_index: 0 },
        { id: "2", icon_name: "Hotel", title: "Hotel Accommodation", description: "Hand-picked hotels near Haram for convenient access to worship", order_index: 1 },
        { id: "3", icon_name: "Shield", title: "Visa Processing", description: "100% success rate in Hajj & Umrah visa processing", order_index: 2 },
        { id: "4", icon_name: "Users", title: "Expert Guides", description: "Experienced Islamic scholars to guide you through rituals", order_index: 3 },
        { id: "5", icon_name: "Clock", title: "24/7 Support", description: "Round-the-clock assistance throughout your spiritual journey", order_index: 4 },
        { id: "6", icon_name: "HeartHandshake", title: "Complete Care", description: "From departure to return, we handle every detail with care", order_index: 5 },
      ]);
    }
    setLoading(false);
  };

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Plane;
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
            Why Choose Us
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl font-bold text-foreground mt-3">
            Complete Hajj & Umrah Services
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mt-2">خدماتنا</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = getIcon(service.icon_name);
            return (
              <div
                key={service.id}
                className="group flex items-start gap-4 p-6 rounded-xl hover:bg-muted/50 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ServiceIcon icon={Icon} />
                <div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default ServicesOverview;
