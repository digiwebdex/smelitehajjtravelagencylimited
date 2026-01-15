import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Clock, Send, MessageSquare, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface ContactInfo {
  id: string;
  icon_name: string;
  title: string;
  details: string[];
  type: string;
  order_index: number;
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    package: "",
    message: "",
  });

  useEffect(() => {
    fetchContactInfo();
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
      // Fallback to default contact info
      setContactInfo([
        { id: "1", icon_name: "Phone", title: "Call Us", details: ["+880 1234-567890", "+880 9876-543210"], type: "phone", order_index: 0 },
        { id: "2", icon_name: "Mail", title: "Email Us", details: ["info@smelitehajj.com", "support@smelitehajj.com"], type: "email", order_index: 1 },
        { id: "3", icon_name: "MapPin", title: "Visit Us", details: ["Savar, Dhaka", "Bangladesh"], type: "address", order_index: 2 },
        { id: "4", icon_name: "Clock", title: "Office Hours", details: ["Sat - Thu: 9AM - 8PM", "Friday: Closed"], type: "hours", order_index: 3 },
      ]);
    }
  };

  const getIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "✅ Inquiry Submitted Successfully!",
      description: "Thank you for your interest. Our team will contact you within 24 hours.",
    });
    setFormData({ name: "", email: "", phone: "", package: "", message: "" });
    setIsSubmitting(false);
  };

  return (
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
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-6">
            Contact Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Have questions about our packages or need assistance? 
            Reach out to us and our team will be happy to help.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {contactInfo.map((info, index) => {
                const Icon = getIcon(info.icon_name);
                return (
                  <motion.div
                    key={info.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-card rounded-2xl p-6 shadow-elegant hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-elegant">
                      <Icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <h3 className="font-heading font-bold text-lg text-foreground mb-3">
                      {info.title}
                    </h3>
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-muted-foreground text-sm">
                        {detail}
                      </p>
                    ))}
                  </motion.div>
                );
              })}
            </div>

            {/* Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-card rounded-2xl overflow-hidden shadow-elegant h-72"
            >
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58399.55577816851!2d90.2227881!3d23.8584712!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755eb3a0a09f5b3%3A0x7dfcceb1c4cc3cbb!2sSavar%2C%20Bangladesh!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="SM Elite Hajj Location"
              />
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-3xl p-8 md:p-10 shadow-elegant relative overflow-hidden"
          >
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full" />
            
            <h3 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-8 relative z-10">
              Send Us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name *
                  </label>
                  <Input
                    required
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Phone Number *
                  </label>
                  <Input
                    required
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-12"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Interested Package
                </label>
                <select
                  className="w-full h-12 rounded-lg border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  value={formData.package}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                >
                  <option value="">Select a package</option>
                  <optgroup label="Hajj Packages">
                    <option value="hajj-economy">Hajj - Super Economy</option>
                    <option value="hajj-classic">Hajj - Classic</option>
                    <option value="hajj-premium">Hajj - Premium (Popular)</option>
                    <option value="hajj-vip">Hajj - VIP</option>
                  </optgroup>
                  <optgroup label="Umrah Packages">
                    <option value="umrah-economy">Umrah - Economy</option>
                    <option value="umrah-etekaf">Umrah - Etekaf (Popular)</option>
                    <option value="umrah-vip">Umrah - VIP</option>
                  </optgroup>
                  <optgroup label="Other Services">
                    <option value="visa">Visa Processing</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Your Message
                </label>
                <Textarea
                  placeholder="Tell us about your requirements, preferred travel dates, number of travelers..."
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className="w-full h-14 bg-gradient-primary hover:opacity-90 shadow-gold text-lg group"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    Send Inquiry
                  </span>
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
