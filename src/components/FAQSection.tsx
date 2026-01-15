import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import IslamicBorder from "./IslamicBorder";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  order_index: number;
}

const FAQSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    const { data } = await supabase
      .from("faq_items")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setFaqs(data);
    } else {
      // Fallback to default FAQs
      setFaqs([
        {
          id: "1",
          question: "What documents are required for Hajj/Umrah visa?",
          answer: "For Hajj/Umrah visa, you'll need: Valid passport (minimum 6 months validity), 4 passport-sized photos with white background, NID copy, vaccination certificate (Meningitis ACWY-135), and for women under 45 traveling without a mahram, an NOC from a male guardian. Our team will guide you through the entire documentation process.",
          order_index: 0,
        },
        {
          id: "2",
          question: "How early should I book my Hajj package?",
          answer: "We recommend booking your Hajj package at least 4-6 months in advance. This ensures better availability of preferred accommodation, flight options, and allows ample time for visa processing and preparation. For VIP packages with hotels adjacent to Haram, early booking is essential.",
          order_index: 1,
        },
        {
          id: "3",
          question: "What is included in the package price?",
          answer: "Our packages typically include: Return air tickets, Hajj/Umrah visa processing, Hotel accommodation (as per package type), Transportation in Saudi Arabia, Three meals daily, Ziyarah tours in Makkah and Madinah, Experienced group leader/guide, and Travel insurance. Specific inclusions vary by package tier.",
          order_index: 2,
        },
        {
          id: "4",
          question: "Can I perform Umrah during any time of the year?",
          answer: "Yes, Umrah can be performed throughout the year except during the Hajj days (8th-13th Dhul Hijjah). We offer Umrah packages year-round, including special Ramadan Umrah and Etekaf packages. The best times are during Ramadan for spiritual rewards, or off-peak seasons for less crowded experiences.",
          order_index: 3,
        },
        {
          id: "5",
          question: "What is your payment policy?",
          answer: "We accept both full payment and installment options. A minimum 30% advance is required at booking to confirm your seat. The remaining amount should be paid at least 45 days before departure. We accept bank transfer, bKash, Nagad, and credit/debit cards. Full refund policy applies if visa is rejected.",
          order_index: 4,
        },
      ]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-24 bg-background">
        <div className="container">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <IslamicBorder>
      <section className="py-24 bg-background">
      <div className="container">
        <div className="text-center mb-16">
          <span className="text-secondary font-semibold uppercase tracking-wider">
            FAQ
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl font-bold text-foreground mt-3 mb-2">
            Frequently Asked Questions
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">أسئلة شائعة</span>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about Hajj, Umrah, and our services.
            Can't find what you're looking for? Contact us directly.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={`item-${index}`}
                className="bg-card rounded-xl px-6 shadow-elegant border-none data-[state=open]:shadow-lg transition-shadow"
              >
                <AccordionTrigger className="hover:no-underline py-6 text-left">
                  <div className="flex items-start gap-4">
                    <HelpCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                    <span className="font-heading font-semibold text-foreground">
                      {faq.question}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-6 pl-9 text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      </section>
    </IslamicBorder>
  );
};

export default FAQSection;
