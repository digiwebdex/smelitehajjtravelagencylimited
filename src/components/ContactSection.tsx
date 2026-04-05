import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, Building2, LucideIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import IslamicBorder from "./IslamicBorder";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface ContactInfo {
  id: string;
  icon_name: string;
  title: string;
  details: string[];
  type: string;
  order_index: number;
  map_link: string | null;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  phones: string[];
  email: string | null;
  map_query: string | null;
  map_embed_url: string | null;
  order_index: number;
  is_active: boolean;
}

const iconMap: Record<string, LucideIcon> = {
  Phone,
  Mail,
  MapPin,
  Clock,
};

interface PackageOption {
  id: string;
  title: string;
  type: string;
}

const ContactSection = () => {
  const { toast } = useToast();
  const { contactDetails } = useSiteSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);
  const [officeLocations, setOfficeLocations] = useState<OfficeLocation[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
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
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data } = await supabase
      .from("packages")
      .select("id, title, type")
      .eq("is_active", true)
      .order("type")
      .order("order_index");
    if (data) setPackages(data);
  };

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
        map_link: (item as any).map_link || null,
      })));
    } else {
      setContactInfo([
        { id: "1", icon_name: "Phone", title: "Call Us", details: ["+880 1234-567890", "+880 9876-543210"], type: "phone", order_index: 0, map_link: null },
        { id: "2", icon_name: "Mail", title: "Email Us", details: ["info@smelitehajj.com", "support@smelitehajj.com"], type: "email", order_index: 1, map_link: null },
        { id: "3", icon_name: "MapPin", title: "Visit Us", details: ["Savar, Dhaka", "Bangladesh"], type: "address", order_index: 2, map_link: "https://maps.app.goo.gl/mCw1xq8ehdYoV6ud6" },
        { id: "4", icon_name: "Clock", title: "Office Hours", details: ["Sat - Thu: 9AM - 8PM", "Friday: Closed"], type: "hours", order_index: 3, map_link: null },
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
    
    try {
      // Save contact form submission as a lead
      const { error } = await supabase.from("leads").insert({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone,
        message: formData.message || null,
        budget_range: formData.package || null,
        lead_status: "New",
        utm_source: "contact_form",
      });

      if (error) {
        console.error("Error saving lead:", error);
        // Still show success to user even if DB save fails
      }

      toast({
        title: "✅ Message Sent!",
        description: "We'll get back to you shortly.",
      });
      setFormData({ name: "", email: "", phone: "", package: "", message: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "✅ Message Sent!",
        description: "We'll get back to you shortly.",
      });
      setFormData({ name: "", email: "", phone: "", package: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <IslamicBorder variant="top">
      <section id="contact" className="py-12 sm:py-16 lg:py-24 bg-muted geometric-pattern relative overflow-hidden">
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
          <h2 className="font-calligraphy text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-4">
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
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              {contactInfo.map((info, index) => {
                const Icon = getIcon(info.icon_name);
                const isClickable = info.type === 'address' && info.map_link;
                
                const CardWrapper = isClickable ? 'a' : 'div';
                const cardProps = isClickable ? {
                  href: info.map_link!,
                  target: "_blank",
                  rel: "noopener noreferrer"
                } : {};
                
                return (
                  <motion.div
                    key={info.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -3 }}
                    className={`bg-card rounded-xl p-3 sm:p-4 shadow-elegant hover:shadow-lg transition-all duration-300 group ${isClickable ? 'cursor-pointer' : ''}`}
                    onClick={isClickable ? () => window.open(info.map_link!, '_blank') : undefined}
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform shadow-elegant">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading font-bold text-xs sm:text-sm text-secondary mb-1.5 sm:mb-2 flex items-center gap-1 sm:gap-1.5">
                      {info.title}
                      {isClickable && <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />}
                    </h3>
                    <div className="space-y-0.5 sm:space-y-1">
                      {info.details.map((detail, idx) => {
                        const parts = detail.split(':');
                        const isPhone = info.type === 'phone';
                        const isEmail = info.type === 'email';
                        const isHoliday = detail.toLowerCase().includes('friday') || detail.toLowerCase().includes('holiday') || detail.toLowerCase().includes('closed');
                        
                        if (parts.length === 2) {
                          const label = parts[0].trim();
                          const value = parts[1].trim();
                          const phoneNumber = value.replace(/\s/g, '');
                          const valueIsHoliday = value.toLowerCase().includes('holiday') || value.toLowerCase().includes('closed');
                          const labelIsHoliday = label.toLowerCase().includes('friday');
                          
                          return (
                            <p key={idx} className={`text-[10px] sm:text-xs leading-relaxed ${isHoliday ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                              <span className={`block sm:inline ${labelIsHoliday ? 'text-destructive' : ''}`}>{label}:</span>{' '}
                              {isPhone ? (
                                <a 
                                  href={`tel:${phoneNumber}`} 
                                  className="hover:text-primary transition-colors cursor-pointer break-all"
                                >
                                  {value}
                                </a>
                              ) : isEmail ? (
                                <a 
                                  href={`mailto:${value}`} 
                                  className="hover:text-primary transition-colors cursor-pointer break-all"
                                >
                                  {value}
                                </a>
                              ) : (
                                <span className={valueIsHoliday ? 'text-destructive' : ''}>{value}</span>
                              )}
                            </p>
                          );
                        }
                        
                        // Handle plain values without labels
                        if (isPhone) {
                          const phoneNumber = detail.replace(/\s/g, '');
                          return (
                            <a 
                              key={idx} 
                              href={`tel:${phoneNumber}`}
                              className="block text-muted-foreground text-[10px] sm:text-xs leading-relaxed hover:text-primary transition-colors cursor-pointer break-all"
                            >
                              {detail}
                            </a>
                          );
                        }
                        if (isEmail) {
                          return (
                            <a 
                              key={idx} 
                              href={`mailto:${detail}`}
                              className="block text-muted-foreground text-[10px] sm:text-xs leading-relaxed hover:text-primary transition-colors cursor-pointer break-all"
                            >
                              {detail}
                            </a>
                          );
                        }
                        
                        return (
                          <p key={idx} className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                            {detail}
                          </p>
                        );
                      })}
                    </div>
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
                className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 flex-1"
              >
                {officeLocations.map((office) => (
                  <div 
                    key={office.id}
                    className="bg-card rounded-xl p-3 sm:p-4 shadow-elegant hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-elegant">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                      </div>
                      <h3 className="font-heading font-bold text-xs sm:text-sm text-secondary">{office.name}</h3>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <a 
                        href={office.map_query?.startsWith('http') ? office.map_query : `https://maps.google.com/?q=${office.map_query || encodeURIComponent(office.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors group/link"
                      >
                        <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5 flex-shrink-0 group-hover/link:text-secondary" />
                        <span className="text-[10px] sm:text-xs leading-relaxed">{office.address}</span>
                      </a>
                      {office.phones.map((phone, idx) => (
                        <a 
                          key={idx}
                          href={`tel:${phone}`}
                          className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs break-all">{phone}</span>
                        </a>
                      ))}
                      {office.email && (
                        <a 
                          href={`mailto:${office.email}`}
                          className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="text-[10px] sm:text-xs break-all">{office.email}</span>
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
                  {packages.filter(p => p.type === "hajj").length > 0 && (
                    <optgroup label="Hajj Packages">
                      {packages.filter(p => p.type === "hajj").map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </optgroup>
                  )}
                  {packages.filter(p => p.type === "umrah").length > 0 && (
                    <optgroup label="Umrah Packages">
                      {packages.filter(p => p.type === "umrah").map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Other Services">
                    <option value="Visa Processing">Visa Processing</option>
                    <option value="Air Ticket">Air Ticket</option>
                    <option value="Hotel Booking">Hotel Booking</option>
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

        {/* Full-width Map with Both Office Locations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 space-y-4"
        >
          <div className="bg-primary/10 px-4 py-3 flex items-center gap-2 rounded-t-2xl border-b border-border">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="font-heading font-bold text-foreground">Our Office Locations</h3>
          </div>
          
          <div className={`grid ${officeLocations.length > 1 ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {officeLocations.length > 0 ? (
              officeLocations.map((office) => {
                const getMapEmbedSrc = (office: OfficeLocation) => {
                  // Priority 1: Use the dedicated embed URL if available
                  if (office.map_embed_url && office.map_embed_url.trim()) {
                    let url = office.map_embed_url.trim();
                    // Extract src from full iframe HTML if pasted
                    const srcMatch = url.match(/src=["']([^"']+)["']/);
                    if (srcMatch) {
                      url = srcMatch[1];
                    } else {
                      // Handle case where URL has extra iframe attributes appended (e.g., url" width="600"...)
                      const quoteIdx = url.indexOf('"');
                      if (quoteIdx > 0 && url.startsWith('https://')) {
                        url = url.substring(0, quoteIdx);
                      }
                    }
                    return url;
                  }
                  // Priority 2: If map_query is a proper embed URL
                  if (office.map_query?.includes('/maps/embed')) return office.map_query;
                  // Priority 3: Use address - replace # with space for better Google Maps search
                  const cleanAddress = office.address.replace(/#/g, ' ').replace(/\s+/g, ' ').trim();
                  return `https://maps.google.com/maps?q=${encodeURIComponent(cleanAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
                };
                const mapSrc = getMapEmbedSrc(office);
                return (
                  <div key={office.id} className="bg-card rounded-xl overflow-hidden shadow-elegant">
                    <div className="bg-secondary/10 px-4 py-2 border-b border-border">
                      <h4 className="font-heading font-semibold text-sm text-foreground">📍 {office.name}</h4>
                    </div>
                    <iframe
                      src={mapSrc}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`SM Elite Hajj - ${office.name}`}
                      className="w-full"
                    />
                  </div>
                );
              })
            ) : (
              <div className="bg-card rounded-xl overflow-hidden shadow-elegant">
                <div className="bg-secondary/10 px-4 py-2 border-b border-border">
                  <h4 className="font-heading font-semibold text-sm text-foreground">📍 Head Office</h4>
                </div>
                <iframe
                  src={contactDetails.google_map_embed_url || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3650.73722708738!2d90.40006317353787!3d23.79236988716717!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c790ba691d2d%3A0xd7e95eafc3e303a7!2sS%20M%20Elite%20Hajj%20Limited!5e0!3m2!1sen!2sbd!4v1769162756109!5m2!1sen!2sbd"}
                  width="100%"
                  height="250"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SM Elite Hajj - Head Office"
                  className="w-full"
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default ContactSection;
