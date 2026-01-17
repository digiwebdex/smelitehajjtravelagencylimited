import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Mail, User, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import companyLogo from "@/assets/company-logo.jpeg";
import LanguageSelector from "./LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  order_index: number;
}

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setMenuItems(data);
    } else {
      // Fallback to default menu items
      setMenuItems([
        { id: "1", label: "Services", href: "#services", order_index: 0 },
        { id: "2", label: "Hajj Packages", href: "#hajj", order_index: 1 },
        { id: "3", label: "Umrah Packages", href: "#umrah", order_index: 2 },
        { id: "4", label: "Visa Services", href: "#visa", order_index: 3 },
        { id: "5", label: "Our Team", href: "#team", order_index: 4 },
        { id: "6", label: "Testimonials", href: "#testimonials", order_index: 5 },
        { id: "7", label: "FAQ", href: "#faq", order_index: 6 },
        { id: "8", label: "Contact", href: "#contact", order_index: 7 },
      ]);
    }
  };

  // Map href to translation key
  const getTranslatedLabel = (href: string, fallbackLabel: string): string => {
    const translationMap: Record<string, string> = {
      '#services': 'nav.services',
      '#hajj': 'nav.hajj',
      '#umrah': 'nav.umrah',
      '#visa': 'nav.visa',
      '#team': 'nav.about',
      '#testimonials': 'nav.about',
      '#faq': 'nav.contact',
      '#contact': 'nav.contact',
    };
    
    const key = translationMap[href];
    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
    }
    return fallbackLabel;
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 120; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-elegant transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''}`}>
      {/* Top Bar - Hide when scrolled */}
      <div className={`bg-primary text-primary-foreground overflow-hidden transition-all duration-300 ${isScrolled ? 'h-0 py-0' : 'h-auto py-2'}`}>
        <div className={`container flex justify-between items-center text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="tel:+8801234567890" className={`flex items-center gap-2 hover:text-secondary transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">+880 1234-567890</span>
            </a>
            <a href="mailto:info@smelitehajj.com" className={`flex items-center gap-2 hover:text-secondary transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">info@smelitehajj.com</span>
            </a>
          </div>
          <div className="text-secondary font-medium">
            {t('hero.badge')}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <nav className={`container transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className={`flex items-center gap-3 group cursor-pointer ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <img 
              src={companyLogo} 
              alt="S.M. Elite Hajj Limited" 
              className={`object-contain ring-2 ring-primary/20 rounded-lg p-1 bg-white shadow-elegant group-hover:ring-primary/40 transition-all duration-300 ${isScrolled ? 'h-10 w-auto' : 'h-14 w-auto'}`}
            />
            <span className={`font-calligraphy font-bold text-primary hidden sm:inline group-hover:text-primary/80 transition-all duration-300 ${isScrolled ? 'text-xl' : 'text-2xl'}`}>S. M. Elite Hajj</span>
          </button>

          {/* Desktop Navigation */}
          <div className={`hidden lg:flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {menuItems.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="text-foreground hover:text-primary font-medium transition-colors relative group cursor-pointer"
              >
                {link.label}
                <span className={`absolute -bottom-1 ${isRTL ? 'right-0' : 'left-0'} w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-300`} />
              </a>
            ))}
          </div>

          <div className={`hidden lg:flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <LanguageSelector />
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User className="w-4 h-4" />
                    {t('nav.login')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                  <DropdownMenuItem onClick={() => navigate("/my-bookings")}>
                    {t('nav.myBookings')}
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      <LayoutDashboard className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('nav.adminDashboard')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('nav.signOut')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <a href="#hajj">
              <Button className="bg-gradient-primary hover:opacity-90 shadow-gold">
                {t('nav.bookNow')}
              </Button>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`lg:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-up ${isRTL ? 'text-right' : ''}`}>
            <div className="flex flex-col gap-4">
              {/* Mobile Language Selector */}
              <div className={`pb-4 border-b border-border ${isRTL ? 'flex justify-end' : ''}`}>
                <LanguageSelector variant="compact" />
              </div>
              
              {menuItems.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="text-foreground hover:text-primary font-medium py-2"
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <a href="#hajj">
                  <Button className="bg-gradient-primary w-full">
                    {t('nav.bookNow')}
                  </Button>
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
