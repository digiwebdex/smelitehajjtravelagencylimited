import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Target, History, Eye, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ValueItem {
  title: string;
  description: string;
}

interface StatItem {
  value: string;
  label: string;
}

interface AboutContent {
  id: string;
  title: string;
  subtitle: string | null;
  mission_title: string | null;
  mission_text: string | null;
  history_title: string | null;
  history_text: string | null;
  vision_title: string | null;
  vision_text: string | null;
  values_title: string | null;
  values_items: ValueItem[];
  image_url: string | null;
  stats: StatItem[];
}

interface AboutSectionProps {
  style?: React.CSSProperties;
}

const AboutSection = ({ style }: AboutSectionProps) => {
  const [content, setContent] = useState<AboutContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data } = await supabase
        .from("about_content")
        .select("*")
        .limit(1)
        .single();

      if (data) {
        setContent({
          ...data,
          values_items: (data.values_items as unknown as ValueItem[]) || [],
          stats: (data.stats as unknown as StatItem[]) || [],
        });
      }
    } catch (error) {
      console.error("Error fetching about content:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="about" className="py-20 bg-muted/30" style={style}>
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-6 bg-muted rounded w-1/2 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  if (!content) return null;

  const sectionIcons = [
    { icon: Target, color: "text-primary" },
    { icon: History, color: "text-secondary" },
    { icon: Eye, color: "text-accent" },
    { icon: Heart, color: "text-destructive" },
  ];

  const sections = [
    { title: content.mission_title, text: content.mission_text },
    { title: content.history_title, text: content.history_text },
    { title: content.vision_title, text: content.vision_text },
  ].filter(s => s.title && s.text);

  return (
    <section id="about" className="py-20 bg-muted/30" style={style}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {content.title}
          </h2>
          {content.subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {content.subtitle}
            </p>
          )}
        </motion.div>

        {/* Stats */}
        {content.stats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {content.stats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Mission, History, Vision */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {sections.map((section, index) => {
            const IconComponent = sectionIcons[index]?.icon || Target;
            const iconColor = sectionIcons[index]?.color || "text-primary";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4`}>
                      <IconComponent className={`w-6 h-6 ${iconColor}`} />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                      {section.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.text}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Values */}
        {content.values_items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="font-heading text-2xl font-bold text-center text-foreground mb-8">
              {content.values_title}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.values_items.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Card className="text-center h-full hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-5 h-5 text-secondary" />
                      </div>
                      <h4 className="font-heading font-semibold text-foreground mb-2">
                        {value.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default AboutSection;
