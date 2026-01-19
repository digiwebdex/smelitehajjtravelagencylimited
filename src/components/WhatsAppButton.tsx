import { MessageCircle, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const WhatsAppButton = () => {
  const { contactDetails } = useSiteSettings();
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Extract digits only from the WhatsApp number, fallback to default
  const whatsappNumber = contactDetails.whatsapp?.replace(/[^0-9]/g, '') || "8801867666888";
  const defaultMessage = "Assalamu Alaikum! I'm interested in your Hajj/Umrah packages. Please provide more information.";

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openWhatsApp = () => {
    const encodedMessage = encodeURIComponent(defaultMessage);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <>
      {/* WhatsApp Button - Left Side */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] hover:bg-[#20BA5C] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-card text-foreground px-4 py-2 rounded-lg shadow-elegant text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Chat with us on WhatsApp!
        </span>
      </button>

      {/* Back to Top Button - Right Side */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 ${
          showBackToTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Back to top"
      >
        <ArrowUp className="w-6 h-6" />
      </button>
    </>
  );
};

export default WhatsAppButton;