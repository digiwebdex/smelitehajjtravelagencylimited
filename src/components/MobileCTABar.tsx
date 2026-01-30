import { Phone, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";

const MobileCTABar = () => {
  const { contactDetails, appearance } = useSiteSettings();
  const { trackEvent } = useFacebookPixel();

  const whatsappNumber = contactDetails.whatsapp?.replace(/[^0-9]/g, '') || '8801867666888';

  // Don't render if disabled in settings
  if (appearance.show_mobile_cta_bar === false) {
    return null;
  }

  const handleWhatsAppClick = () => {
    // Track Contact event via Facebook Pixel
    trackEvent({
      eventName: 'Contact',
      contentName: 'Mobile CTA WhatsApp Click',
      customData: {
        contact_method: 'whatsapp',
        whatsapp_number: whatsappNumber,
        source: 'mobile_cta_bar',
      },
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around py-2 px-3 gap-2">
        {/* Call Button */}
        <a 
          href={`tel:${contactDetails.phone.replace(/\s/g, '')}`}
          className="flex-1"
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-1.5 text-xs h-10 border-primary/30 hover:bg-primary/10"
          >
            <Phone className="w-4 h-4 text-primary" />
            <span>Call</span>
          </Button>
        </a>

        {/* Book Now Button - Primary CTA */}
        <a href="#hajj" className="flex-[1.5]">
          <Button 
            size="sm" 
            className="w-full gap-1.5 text-xs h-10 bg-gradient-primary hover:opacity-90 shadow-gold"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Now</span>
          </Button>
        </a>

        {/* WhatsApp Button */}
        <a 
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
          onClick={handleWhatsAppClick}
        >
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-1.5 text-xs h-10 border-[#25D366]/30 hover:bg-[#25D366]/10"
          >
            <MessageCircle className="w-4 h-4 text-[#25D366]" />
            <span>Chat</span>
          </Button>
        </a>
      </div>
      
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default MobileCTABar;
