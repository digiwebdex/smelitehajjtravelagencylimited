import { useState, useEffect } from "react";
import { Phone, Mail, MapPin, Facebook, Instagram, Youtube, ArrowUp } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import companyLogo from "@/assets/company-logo.jpeg";

interface FooterLink {
  name: string;
  href: string;
}

interface SocialLink {
  platform: string;
  href: string;
}

interface FooterContent {
  company_description?: string;
  copyright_text?: string;
  quick_links: FooterLink[];
  services_links: string[];
  social_links: SocialLink[];
}

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [content, setContent] = useState<FooterContent>({
    company_description: "Your trusted partner for Hajj & Umrah journeys. We provide comprehensive packages with premium services to ensure a spiritually fulfilling experience.",
    copyright_text: `© ${currentYear} SM Elite Hajj & Umrah Services. All rights reserved.`,
    quick_links: [
      { name: "Home", href: "#home" },
      { name: "Hajj Packages", href: "#hajj" },
      { name: "Umrah Packages", href: "#umrah" },
      { name: "Visa Services", href: "#visa" },
      { name: "Our Team", href: "#team" },
      { name: "Contact", href: "#contact" },
    ],
    services_links: [
      "Hajj Packages",
      "Umrah Packages",
      "Visa Processing",
      "Air Tickets",
      "Hotel Booking",
      "Travel Insurance",
    ],
    social_links: [
      { platform: "Facebook", href: "#" },
      { platform: "Instagram", href: "#" },
      { platform: "Youtube", href: "#" },
    ],
  });

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const fetchFooterContent = async () => {
    const { data } = await supabase
      .from("footer_content")
      .select("*")
      .limit(1)
      .single();
    
    if (data) {
      setContent({
        company_description: data.company_description || content.company_description,
        copyright_text: data.copyright_text || content.copyright_text,
        quick_links: Array.isArray(data.quick_links) ? (data.quick_links as unknown as FooterLink[]) : content.quick_links,
        services_links: Array.isArray(data.services_links) ? (data.services_links as unknown as string[]) : content.services_links,
        social_links: Array.isArray(data.social_links) ? (data.social_links as unknown as SocialLink[]) : content.social_links,
      });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return Facebook;
      case "instagram":
        return Instagram;
      case "youtube":
        return Youtube;
      default:
        return Facebook;
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground relative overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 geometric-pattern" />
      </div>

      {/* Scroll to top button */}
      <motion.button
        onClick={scrollToTop}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-gold flex items-center justify-center hover:bg-secondary/90 transition-colors"
      >
        <ArrowUp className="w-6 h-6" />
      </motion.button>

      <div className="container py-20 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={companyLogo} 
                alt="S.M. Elite Hajj Limited" 
                className="h-16 w-auto object-contain bg-white/10 rounded-xl p-1"
              />
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed mb-6">
              {content.company_description}
            </p>
            <div className="flex gap-3">
              {content.social_links.map((social) => {
                const Icon = getSocialIcon(social.platform);
                return (
                  <motion.a
                    key={social.platform}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="w-11 h-11 bg-primary-foreground/10 rounded-xl flex items-center justify-center hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                    aria-label={social.platform}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Quick Links
            </h4>
            <ul className="space-y-3">
              {content.quick_links.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-0.5 bg-secondary transition-all duration-300" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Our Services
            </h4>
            <ul className="space-y-3">
              {content.services_links.map((service) => (
                <li key={service}>
                  <span className="text-primary-foreground/80 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-secondary/50 rounded-full" />
                    {service}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-8 h-0.5 bg-secondary" />
              Contact Info
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-primary-foreground/80 text-sm pt-2">
                  Savar, Dhaka, Bangladesh
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-secondary" />
                </div>
                <div className="text-primary-foreground/80 text-sm pt-2">
                  <div>+880 1234-567890</div>
                  <div>+880 9876-543210</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-secondary" />
                </div>
                <span className="text-primary-foreground/80 text-sm pt-2">
                  info@smelitehajj.com
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-foreground/10 relative z-10">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/70 text-sm text-center md:text-left">
            {content.copyright_text}
          </p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
              Refund Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
