import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Phone, Mail, User, LogOut, LayoutDashboard, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import companyLogo from "@/assets/company-logo.jpeg";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  order_index: number;
}

const ANNOUNCEMENT_DISMISSED_KEY = "smEliteHajj_announcementDismissed";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [announcementDismissed, setAnnouncementDismissed] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY) === 'true';
    }
    return false;
  });
  const { user, isAdmin, signOut } = useAuth();
  const { companyInfo, contactDetails, appearance } = useSiteSettings();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

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

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const headerOffset = 120;
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

  const logoSrc = companyInfo.logo_url || companyLogo;

  const showAnnouncement = appearance.show_announcement_bar && appearance.announcement_text && !announcementDismissed;

  const dismissAnnouncement = () => {
    setAnnouncementDismissed(true);
    sessionStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, 'true');
  };

  return (
    <>
      {/* Announcement Bar */}
      {showAnnouncement && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-secondary text-secondary-foreground py-2 text-sm font-medium animate-fade-down">
          <div className="container flex items-center justify-center gap-2 relative">
            <span>📢</span>
            <span>{appearance.announcement_text}</span>
            <button 
              onClick={dismissAnnouncement}
              className="absolute right-0 p-1 hover:bg-secondary-foreground/10 rounded transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <header className={`fixed left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-elegant transition-all duration-300 ${isScrolled ? 'shadow-lg' : ''} ${showAnnouncement ? 'top-[36px]' : 'top-0'}`}>
        {/* Top Bar - Hide when scrolled */}
        <div className={`bg-primary text-primary-foreground overflow-hidden transition-all duration-300 ${isScrolled ? 'h-0 py-0' : 'h-auto py-2'}`}>
          <div className="container flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-2 text-sm">
            <div className="flex items-center gap-4 sm:gap-6">
              <a href={`tel:${contactDetails.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{contactDetails.phone}</span>
              </a>
              <a href={`mailto:${contactDetails.email}`} className="flex items-center gap-1.5 hover:text-secondary transition-colors">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">{contactDetails.email}</span>
              </a>
              <a 
                href={`https://wa.me/${contactDetails.whatsapp?.replace(/[^0-9]/g, '') || '8801867666888'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-[#25D366] transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">WhatsApp</span>
              </a>
            </div>
            <div className="text-secondary font-medium text-xs sm:text-sm text-center leading-tight">
              {companyInfo.description}
            </div>
          </div>
        </div>

        {/* Main Nav */}
        <nav className={`container transition-all duration-300 ${isScrolled ? 'py-2' : 'py-4'}`}>
          <div className="flex items-center justify-between">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
              className="flex items-center gap-2 sm:gap-3 group cursor-pointer"
            >
              <img 
                src={logoSrc} 
                alt={companyInfo.name} 
                className={`object-contain ring-2 ring-primary/20 rounded-lg p-1 bg-white shadow-elegant group-hover:ring-primary/40 transition-all duration-300 ${isScrolled ? 'h-10 w-auto' : 'h-12 sm:h-14 w-auto'}`}
              />
              <span className={`font-calligraphy font-bold text-primary group-hover:text-primary/80 transition-all duration-300 ${isScrolled ? 'text-base sm:text-xl' : 'text-lg sm:text-2xl'}`}>
                {companyInfo.name}
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {menuItems.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-foreground hover:text-primary font-medium transition-colors relative group cursor-pointer"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-secondary group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <Link to="/track-order">
                <Button variant="ghost" size="sm" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Track Order
                </Button>
              </Link>
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <User className="w-4 h-4" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate("/my-bookings")}>
                      My Bookings
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {appearance.show_book_now_button !== false && (
                <a href="#hajj">
                  <Button className="bg-gradient-primary hover:opacity-90 shadow-gold">
                    Book Now
                  </Button>
                </a>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation - Only show user actions, not full menu */}
          {isMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-up">
              <div className="flex flex-col gap-2">
                <Link to="/track-order" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <MapPin className="w-4 h-4" />
                    Track Order
                  </Button>
                </Link>
                {user && (
                  <>
                    <Button variant="outline" className="w-full gap-2" onClick={() => { navigate("/my-bookings"); setIsMenuOpen(false); }}>
                      My Bookings
                    </Button>
                    {isAdmin && (
                      <Button variant="outline" className="w-full gap-2" onClick={() => { navigate("/admin"); setIsMenuOpen(false); }}>
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Button>
                    )}
                    <Button variant="ghost" className="w-full gap-2 text-destructive" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                )}
                {appearance.show_book_now_button !== false && (
                  <a href="#hajj" onClick={() => setIsMenuOpen(false)}>
                    <Button className="bg-gradient-primary w-full">
                      Book Now
                    </Button>
                  </a>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  );
};

export default Header;