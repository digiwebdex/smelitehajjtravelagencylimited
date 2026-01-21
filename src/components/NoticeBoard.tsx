import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  ExternalLink, 
  Download, 
  ChevronRight,
  AlertTriangle,
  Info,
  Megaphone,
  X,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Notice {
  id: string;
  title: string;
  content: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  external_link: string | null;
  external_link_text: string | null;
  priority: string;
  notice_type: string;
  is_pinned: boolean;
  created_at: string;
}

const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotice, setExpandedNotice] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .order("is_pinned", { ascending: false })
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error("Error fetching notices:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
      case "high":
        return "bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400";
      case "normal":
        return "bg-primary/10 border-primary/30 text-primary";
      default:
        return "bg-muted border-border text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="animate-pulse">Urgent</Badge>;
      case "high":
        return <Badge className="bg-orange-500">Important</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "important":
        return <AlertTriangle className="h-5 w-5" />;
      case "offer":
        return <Megaphone className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: Record<string, string> = {
      general: "General",
      hajj: "Hajj",
      umrah: "Umrah",
      visa: "Visa",
      offer: "Special Offer",
      important: "Important"
    };
    return typeLabels[type] || type;
  };

  if (loading || notices.length === 0) return null;

  const urgentNotices = notices.filter(n => n.priority === "urgent");
  const regularNotices = notices.filter(n => n.priority !== "urgent");

  return (
    <section className="py-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Urgent Notices Banner */}
        {urgentNotices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
              <div className="relative flex items-center gap-4">
                <div className="flex-shrink-0 p-2 bg-red-500 rounded-lg text-white animate-pulse">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive" className="animate-pulse">URGENT</Badge>
                    <h3 className="font-semibold text-red-700 dark:text-red-400 truncate">
                      {urgentNotices[currentSlide]?.title}
                    </h3>
                  </div>
                  {urgentNotices[currentSlide]?.content && (
                    <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 line-clamp-1">
                      {urgentNotices[currentSlide].content}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {urgentNotices[currentSlide]?.external_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      onClick={(e) => {
                        const link = urgentNotices[currentSlide].external_link!;
                        if (link.startsWith('#')) {
                          e.preventDefault();
                          const element = document.querySelector(link);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                          window.open(link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      {urgentNotices[currentSlide].external_link_text || "View"}
                    </Button>
                  )}
                  {urgentNotices[currentSlide]?.attachment_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      asChild
                    >
                      <a href={urgentNotices[currentSlide].attachment_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {urgentNotices.length > 1 && (
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentSlide(prev => prev === 0 ? urgentNotices.length - 1 : prev - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-red-600">{currentSlide + 1}/{urgentNotices.length}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentSlide(prev => prev === urgentNotices.length - 1 ? 0 : prev + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Regular Notices Section */}
        {regularNotices.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Notice Board</h2>
              <Badge variant="secondary">{regularNotices.length} Updates</Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {regularNotices.slice(0, 6).map((notice, index) => (
                  <motion.div
                    key={notice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative p-4 rounded-xl border ${getPriorityStyles(notice.priority)} transition-all duration-300 hover:shadow-lg cursor-pointer`}
                    onClick={() => setExpandedNotice(expandedNotice === notice.id ? null : notice.id)}
                  >
                    {notice.is_pinned && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                        Pinned
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-background/50 rounded-lg flex-shrink-0">
                        {getTypeIcon(notice.notice_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          {getPriorityBadge(notice.priority)}
                          <Badge variant="outline" className="text-xs">
                            {getTypeBadge(notice.notice_type)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold line-clamp-2">{notice.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(notice.created_at), "dd MMM yyyy")}
                        </p>
                      </div>
                      <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${expandedNotice === notice.id ? "rotate-90" : ""}`} />
                    </div>

                    <AnimatePresence>
                      {expandedNotice === notice.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-current/10">
                            {notice.content && (
                              <p className="text-sm mb-3 whitespace-pre-wrap">{notice.content}</p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {notice.external_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const link = notice.external_link!;
                                    if (link.startsWith('#')) {
                                      e.preventDefault();
                                      const element = document.querySelector(link);
                                      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    } else {
                                      window.open(link, '_blank', 'noopener,noreferrer');
                                    }
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {notice.external_link_text || "Learn More"}
                                </Button>
                              )}
                              {notice.attachment_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  asChild
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <a href={notice.attachment_url} target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3" />
                                    {notice.attachment_name || "Download"}
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default NoticeBoard;
