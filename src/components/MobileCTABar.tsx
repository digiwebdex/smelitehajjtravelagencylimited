import { Phone, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const MobileCTABar = () => {
  const { contactDetails } = useSiteSettings();

  const whatsappNumber = contactDetails.whatsapp?.replace(/[^0-9]/g, '') || '8801867666888';

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
