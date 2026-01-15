import { useState, useEffect } from "react";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import IslamicBorder from "./IslamicBorder";
import VisaApplicationModal from "./VisaApplicationModal";

interface VisaCountry {
  id: string;
  country_name: string;
  flag_emoji: string;
  processing_time: string;
  price: number;
  order_index: number;
}

const VisaServices = () => {
  const [countries, setCountries] = useState<VisaCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<VisaCountry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from("visa_countries")
      .select("*")
      .eq("is_active", true)
      .order("order_index");
    
    if (data && data.length > 0) {
      setCountries(data);
    } else {
      // Fallback to default countries
      setCountries([
        { id: "1", country_name: "Thailand", flag_emoji: "🇹🇭", processing_time: "5-7 days", price: 8000, order_index: 0 },
        { id: "2", country_name: "France", flag_emoji: "🇫🇷", processing_time: "15-20 days", price: 18000, order_index: 1 },
        { id: "3", country_name: "Italy", flag_emoji: "🇮🇹", processing_time: "15-20 days", price: 18000, order_index: 2 },
        { id: "4", country_name: "United States", flag_emoji: "🇺🇸", processing_time: "Interview based", price: 12000, order_index: 3 },
        { id: "5", country_name: "Cuba", flag_emoji: "🇨🇺", processing_time: "10-15 days", price: 15000, order_index: 4 },
        { id: "6", country_name: "Japan", flag_emoji: "🇯🇵", processing_time: "7-10 days", price: 10000, order_index: 5 },
        { id: "7", country_name: "Australia", flag_emoji: "🇦🇺", processing_time: "20-25 days", price: 20000, order_index: 6 },
        { id: "8", country_name: "Malaysia", flag_emoji: "🇲🇾", processing_time: "3-5 days", price: 5000, order_index: 7 },
      ]);
    }
    setLoading(false);
  };

  // Convert country name to ISO 3166-1 alpha-2 code for flag images
  const getCountryCode = (countryName: string): string => {
    const countryCodeMap: Record<string, string> = {
      "Thailand": "th",
      "France": "fr",
      "Italy": "it",
      "United States": "us",
      "Cuba": "cu",
      "Japan": "jp",
      "Australia": "au",
      "Malaysia": "my",
      "United Kingdom": "gb",
      "Canada": "ca",
      "Germany": "de",
      "Spain": "es",
      "China": "cn",
      "India": "in",
      "Singapore": "sg",
      "UAE": "ae",
      "United Arab Emirates": "ae",
      "Saudi Arabia": "sa",
      "Turkey": "tr",
      "Egypt": "eg",
      "Indonesia": "id",
      "South Korea": "kr",
      "Brazil": "br",
      "South Africa": "za",
      "Russia": "ru",
      "Netherlands": "nl",
      "Switzerland": "ch",
      "Belgium": "be",
      "Austria": "at",
      "Greece": "gr",
      "Portugal": "pt",
      "New Zealand": "nz",
      "Sweden": "se",
      "Norway": "no",
      "Denmark": "dk",
      "Finland": "fi",
      "Ireland": "ie",
      "Poland": "pl",
      "Czech Republic": "cz",
      "Hungary": "hu",
      "Vietnam": "vn",
      "Philippines": "ph",
      "Bangladesh": "bd",
      "Pakistan": "pk",
      "Sri Lanka": "lk",
      "Nepal": "np",
      "Maldives": "mv",
      "Qatar": "qa",
      "Kuwait": "kw",
      "Bahrain": "bh",
      "Oman": "om",
      "Jordan": "jo",
      "Lebanon": "lb",
      "Morocco": "ma",
      "Tunisia": "tn",
      "Kenya": "ke",
      "Nigeria": "ng",
      "Ghana": "gh",
      "Mexico": "mx",
      "Argentina": "ar",
      "Chile": "cl",
      "Colombia": "co",
      "Peru": "pe",
    };
    return countryCodeMap[countryName] || "xx";
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <section id="visa" className="py-24 bg-muted relative overflow-hidden">
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
      <section id="visa" className="py-24 bg-muted relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-50 geometric-pattern" />
      
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 text-secondary font-semibold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            Global Services
          </span>
          <h2 className="font-calligraphy text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mt-3 mb-2">
            Visa Processing Services
          </h2>
          <span className="font-thuluth text-secondary/60 text-2xl md:text-3xl block mb-6">خدمات التأشيرة</span>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            We provide hassle-free visa processing services for various countries. 
            Our experienced team ensures smooth documentation and timely processing.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {countries.map((country) => (
            <motion.div
              key={country.id}
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => {
                setSelectedCountry(country);
                setIsModalOpen(true);
              }}
              className="group bg-card rounded-2xl p-6 shadow-elegant hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  <img 
                    src={`https://flagcdn.com/w80/${getCountryCode(country.country_name)}.png`}
                    alt={`${country.country_name} flag`}
                    className="w-12 h-8 object-cover rounded shadow-sm"
                    onError={(e) => {
                      // Fallback to emoji if flag image fails
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = country.flag_emoji;
                    }}
                  />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {country.country_name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  ⏱️ {country.processing_time}
                </p>
                <p className="text-sm font-semibold text-secondary mb-4">
                  From ৳{country.price.toLocaleString()}
                </p>
                <Button
                  size="sm"
                  className="w-full bg-gradient-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCountry(country);
                    setIsModalOpen(true);
                  }}
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground group"
          >
            <span>View All Countries</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
      </section>

      <VisaApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCountry(null);
        }}
        country={selectedCountry}
      />
    </IslamicBorder>
  );
};

export default VisaServices;
