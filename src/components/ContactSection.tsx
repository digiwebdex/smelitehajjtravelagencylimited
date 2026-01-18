import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Building2, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import IslamicBorder from "./IslamicBorder";

interface ContactInfo {
  id: string;
  icon_name: string;
  title: string;
  details: string[];
  type: string;
  order_index: number;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  phones: string[];
  email: string | null;
  map_query: string | null;
  order_index: number;
  is_active: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Phone,
  Mail,
  MapPin,
  Clock,
};

const ContactSection = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    package: "",
    message: "",
  });

  useEffect(() => {
    fetchContactInfo();
    fetchOfficeLocations();
  }, []);

  const fetchContactInfo = async () => {
    const { data } = await supabase
      .from("contact_info")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setContactInfo(data.map(item => ({
        ...item,
        details: Array.isArray(item.details) ? item.details as string[] : [],
      })));
    } else {
      setContactInfo([
        { id: "1", icon_name: "Phone", title: "Call Us", details: ["+880 1234-567890", "+880 9876-543210"], type: "phone", order_index: 0 },
        { id: "2", icon_name: "Mail", title: "Email Us", details: ["info@smelitehajj.com", "support@smelitehajj.com"], type: "email", order_index: 1 },
        { id: "3", icon_name: "MapPin", title: "Visit Us", details: ["Savar, Dhaka", "Bangladesh"], type: "address", order_index: 2 },
        { id: "4", icon_name: "Clock", title: "Office Hours", details: ["Sat - Thu: 9AM - 8PM", "Friday: Closed"], type: "hours", order_index: 3 },
      ]);
    }
  };

  const fetchOfficeLocations = async () => {
    const { data } = await supabase
      .from("office_locations")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (data) {
      setOfficeLocations(data as OfficeLocation[]);
    }
  };

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "✅ Message Sent!",
      description: "We'll get back to you shortly.",
    });
    setFormData({ name: "", email: "", phone: "", package: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <IslamicBorder variant="top">
      <section id="contact" className="py-24 bg-muted geometric-pattern relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Get In Touch
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-2">
            Contact Us
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">اتصل بنا</span>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Ready to start your sacred journey? Contact us today for personalized assistance with your Hajj or Umrah booking.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {contactInfo.map((info, index) => {
                const Icon = getIcon(info.icon_name);
                return (
                  <motion.div
                    key={info.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -3 }}
                    className="bg-card rounded-xl p-4 shadow-elegant hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-elegant">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading font-bold text-sm text-foreground mb-2">
                      {info.title}
                    </h3>
                    {info.type === 'address' ? (
                      <a 
                        href="https://maps.app.goo.gl/sH15fPhiGdKLARod9?g_st=aw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground text-xs leading-relaxed hover:text-primary transition-colors block"
                      >
                        {info.details.map((detail, idx) => (
                          <span key={idx} className="block">{detail}</span>
                        ))}
                      </a>
                    ) : (
                      info.details.map((detail, idx) => (
                        <p key={idx} className="text-muted-foreground text-xs leading-relaxed">
                          {detail}
                        </p>
                      ))
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Office Locations */}
            {officeLocations.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4 flex-1"
              >
                {officeLocations.map((office) => (
                  <div 
                    key={office.id}
                    className="bg-card rounded-xl p-4 shadow-elegant hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
                        <Building2 className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-heading font-bold text-sm text-secondary">{office.name}</h3>
                    </div>
                    <div className="space-y-2">
                      <a 
                        href={`https://maps.google.com/?q=${office.map_query || encodeURIComponent(office.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-muted-foreground hover:text-primary transition-colors group/link"
                      >
                        <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 group-hover/link:text-secondary" />
                        <span className="text-xs leading-relaxed">{office.address}</span>
                      </a>
                      {office.phones.map((phone, idx) => (
                        <a 
                          key={idx}
                          href={`tel:${phone}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs">{phone}</span>
                        </a>
                      ))}
                      {office.email && (
                        <a 
                          href={`mailto:${office.email}`}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs">{office.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-2xl p-6 md:p-8 shadow-elegant relative overflow-hidden h-fit"
          >
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            
            <h3 className="font-heading text-xl md:text-2xl font-bold text-foreground mb-6 relative z-10">
              Send us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Full Name *
                  </label>
                  <Input
                    required
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Phone *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Package Interest
                </label>
                <select
                  className="w-full h-10 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                >
                  <option value="">Select a package</option>
                  <optgroup label="Hajj Packages">
                    <option value="hajj-economy">Hajj - Super Economy</option>
                    <option value="hajj-classic">Hajj - Classic</option>
                    <option value="hajj-premium">Hajj - Premium</option>
                    <option value="hajj-vip">Hajj - VIP</option>
                  </optgroup>
                  <optgroup label="Umrah Packages">
                    <option value="umrah-economy">Umrah - Economy</option>
                    <option value="umrah-etekaf">Umrah - Etekaf</option>
                    <option value="umrah-vip">Umrah - VIP</option>
                  </optgroup>
                  <optgroup label="Other Services">
                    <option value="visa">Visa Processing</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us about your requirements..."
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-primary hover:opacity-90 shadow-gold text-base group"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </div>

        {/* Full-width Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-card rounded-2xl overflow-hidden shadow-elegant"
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-secondary" />
              <span className="font-heading font-semibold text-foreground">Our Location</span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-secondary hover:text-secondary-foreground hover:border-secondary"
            >
              <a 
                href="https://maps.app.goo.gl/sH15fPhiGdKLARod9?g_st=aw"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </Button>
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.5484611458387!2d90.39729221498282!3d23.79416879319868!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c709be6be7b5%3A0x7e53f4e8b8be1a24!2sBanani%2C%20Dhaka!5e0!3m2!1sen!2sbd!4v1700000000000!5m2!1sen!2sbd"
            width="100%"
            height="300"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="SM Elite Hajj Head Office Location - Banani, Dhaka"
            className="w-full"
          />
        </motion.div>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default ContactSection;
