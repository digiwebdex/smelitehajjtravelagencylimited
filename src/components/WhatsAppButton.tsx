import { MessageCircle, ArrowUp, X, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-3 bg-card rounded-lg shadow-sm max-w-[85%] mb-3">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const WhatsAppButton = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<{text: string; isUser: boolean; time: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const phoneNumber = "8801619959626";

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

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message to chat
    setChatMessages(prev => [...prev, { text: message, isUser: true, time: timeStr }]);
    setMessage("");
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate auto-reply after a short delay
    setTimeout(() => {
      setIsTyping(false);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, { 
        text: "Thank you for your message! Our team will respond shortly. For immediate assistance, you can also call us at +880 1619 959626.", 
        isUser: false, 
        time: replyTime 
      }]);
    }, 1500);
  };

  const handleQuickMessage = (msg: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages(prev => [...prev, { text: msg, isUser: true, time: timeStr }]);
    
    // Show typing indicator
    setIsTyping(true);
    
    // Simulate auto-reply
    setTimeout(() => {
      setIsTyping(false);
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let reply = "Thank you for your interest! Our team will get back to you shortly.";
      
      if (msg.includes("Hajj")) {
        reply = "Our Hajj packages start from ৳850,000. We offer Economy, Standard, and Premium options. Would you like more details about any specific package?";
      } else if (msg.includes("Umrah")) {
        reply = "We have various Umrah packages available year-round. Prices start from ৳125,000. Shall I share the available dates?";
      } else if (msg.includes("visa")) {
        reply = "We process visas for Saudi Arabia, UAE, Malaysia, and more. Processing time is typically 5-15 working days. Which country are you interested in?";
      } else if (msg.includes("booking")) {
        reply = "I'd be happy to help with your booking! Please share your preferred travel dates and number of passengers.";
      }
      
      setChatMessages(prev => [...prev, { text: reply, isUser: false, time: replyTime }]);
    }, 1800);
  };

  const quickMessages = [
    "I want to know about Hajj packages",
    "Tell me about Umrah packages",
    "What are visa requirements?",
    "I need booking assistance"
  ];
  
  return (
    <>
      {/* WhatsApp Chat Popup */}
      <div
        className={`fixed bottom-24 left-6 z-50 w-80 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-300 ${
          isChatOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="bg-[#25D366] p-4 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">S.M. Elite Hajj</h3>
            <p className="text-white/80 text-sm">Typically replies within minutes</p>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="p-4 bg-muted/30 min-h-[250px] max-h-[300px] overflow-y-auto">
          {/* Welcome Message */}
          <div className="bg-card rounded-lg p-3 shadow-sm max-w-[85%] mb-4">
            <p className="text-sm text-foreground">
              Assalamu Alaikum! 👋
            </p>
            <p className="text-sm text-foreground mt-1">
              Welcome to S.M. Elite Hajj. How can we assist you today?
            </p>
            <span className="text-xs text-muted-foreground mt-1 block">Just now</span>
          </div>

          {/* Chat Messages */}
          {chatMessages.map((msg, index) => (
            <div key={index} className={`mb-3 ${msg.isUser ? 'flex justify-end' : ''}`}>
              <div className={`rounded-lg p-3 shadow-sm max-w-[85%] ${
                msg.isUser 
                  ? 'bg-[#DCF8C6] text-foreground' 
                  : 'bg-card text-foreground'
              }`}>
                <p className="text-sm">{msg.text}</p>
                <span className="text-xs text-muted-foreground mt-1 block text-right">{msg.time}</span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && <TypingIndicator />}

          {/* Quick Reply Buttons - only show if no messages yet */}
          {chatMessages.length === 0 && (
            <div className="space-y-2">
              {quickMessages.map((msg, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickMessage(msg)}
                  className="w-full text-left text-sm bg-card hover:bg-primary/5 border border-border rounded-lg px-3 py-2 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#25D366]/50"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              size="icon"
              className="rounded-full bg-[#25D366] hover:bg-[#20BA5C] text-white shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Live Chat Support • +880 1619 959626
          </p>
        </div>
      </div>

      {/* WhatsApp Button - Left Side */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed bottom-6 left-6 z-50 bg-[#25D366] hover:bg-[#20BA5C] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group ${
          isChatOpen ? "rotate-0" : ""
        }`}
        aria-label="Chat on WhatsApp"
      >
        {isChatOpen ? (
          <X className="w-7 h-7" />
        ) : (
          <MessageCircle className="w-7 h-7" />
        )}
        {!isChatOpen && (
          <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-card text-foreground px-4 py-2 rounded-lg shadow-elegant text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Chat with us!
          </span>
        )}
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