import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface LegalContent {
  title: string;
  content: string;
}

const LegalPage = () => {
  const { pageKey } = useParams<{ pageKey: string }>();
  const [content, setContent] = useState<LegalContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [pageKey]);

  const fetchContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("legal_pages")
      .select("title, content")
      .eq("page_key", pageKey)
      .eq("is_active", true)
      .single();

    if (data) {
      setContent(data);
    }
    setLoading(false);
  };

  // Simple markdown to HTML converter for basic formatting
  const renderMarkdown = (text: string) => {
    return text
      .split("\n")
      .map((line, index) => {
        // Headers
        if (line.startsWith("## ")) {
          return (
            <h2 key={index} className="text-2xl font-heading font-bold text-primary mt-8 mb-4">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={index} className="text-xl font-heading font-semibold text-primary mt-6 mb-3">
              {line.replace("### ", "")}
            </h3>
          );
        }
        // Bold text with **
        if (line.includes("**")) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={index} className="text-muted-foreground mb-2">
              {parts.map((part, i) =>
                i % 2 === 1 ? (
                  <strong key={i} className="font-semibold text-foreground">
                    {part}
                  </strong>
                ) : (
                  part
                )
              )}
            </p>
          );
        }
        // List items
        if (line.startsWith("- ")) {
          return (
            <li key={index} className="text-muted-foreground ml-6 mb-1 list-disc">
              {line.replace("- ", "")}
            </li>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(line)) {
          return (
            <li key={index} className="text-muted-foreground ml-6 mb-1 list-decimal">
              {line.replace(/^\d+\.\s/, "")}
            </li>
          );
        }
        // Table rows
        if (line.startsWith("|")) {
          const cells = line.split("|").filter((cell) => cell.trim() !== "");
          if (line.includes("---")) return null;
          return (
            <div key={index} className="grid grid-cols-2 gap-4 py-2 border-b border-border">
              {cells.map((cell, i) => (
                <span key={i} className={i === 0 ? "font-medium" : "text-muted-foreground"}>
                  {cell.trim()}
                </span>
              ))}
            </div>
          );
        }
        // Horizontal rule
        if (line.startsWith("---")) {
          return <hr key={index} className="my-8 border-border" />;
        }
        // Empty line
        if (line.trim() === "") {
          return <br key={index} />;
        }
        // Regular paragraph
        return (
          <p key={index} className="text-muted-foreground mb-2">
            {line}
          </p>
        );
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-32 text-center">
          <h1 className="text-3xl font-heading font-bold text-primary mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">The requested page could not be found.</p>
          <Link to="/" className="text-secondary hover:underline">
            Return to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-20 pt-32">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center gap-2 text-sm mb-6 text-primary-foreground/80">
              <Link 
                to="/" 
                className="flex items-center gap-1 hover:text-secondary transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-secondary font-medium">{content.title}</span>
            </nav>
            
            <h1 className="text-4xl md:text-5xl font-heading font-bold">{content.title}</h1>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-card rounded-2xl shadow-lg p-8 md:p-12"
          >
            <div className="prose prose-lg max-w-none">
              {renderMarkdown(content.content)}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LegalPage;