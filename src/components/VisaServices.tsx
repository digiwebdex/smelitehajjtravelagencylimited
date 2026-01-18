import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Globe, Eye, Filter, X, Search, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import IslamicBorder from "./IslamicBorder";
import VisaApplicationModal from "./VisaApplicationModal";
import VisaDetailsModal from "./VisaDetailsModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface VisaCountry {
  id: string;
  country_name: string;
  flag_emoji: string;
  processing_time: string;
  price: number;
  order_index: number;
  requirements?: string[] | null;
  documents_needed?: string[] | null;
  description?: string | null;
  validity_period?: string | null;
  is_featured?: boolean;
}

type ProcessingTimeFilter = "all" | "fast" | "medium" | "slow";

const VisaServices = () => {
  const [countries, setCountries] = useState<VisaCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<VisaCountry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [processingTimeFilter, setProcessingTimeFilter] = useState<ProcessingTimeFilter>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [isAllCountriesModalOpen, setIsAllCountriesModalOpen] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  // Parse processing time to get approximate days
  const getProcessingDays = (processingTime: string): number => {
    const match = processingTime.match(/(\d+)/);
    return match ? parseInt(match[1]) : 30; // Default to 30 if can't parse
  };

  // Filter countries based on selected filters
  const filteredCountries = useMemo(() => {
    return countries.filter((country) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        if (!country.country_name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Price filter
      if (country.price < priceRange[0] || country.price > priceRange[1]) {
        return false;
      }

      // Processing time filter
      if (processingTimeFilter !== "all") {
        const days = getProcessingDays(country.processing_time);
        if (processingTimeFilter === "fast" && days > 7) return false;
        if (processingTimeFilter === "medium" && (days <= 7 || days > 15)) return false;
        if (processingTimeFilter === "slow" && days <= 15) return false;
      }

      return true;
    });
  }, [countries, searchQuery, priceRange, processingTimeFilter]);

  // Get min and max prices from countries
  const priceStats = useMemo(() => {
    if (countries.length === 0) return { min: 0, max: 50000 };
    const prices = countries.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [countries]);

  const clearFilters = () => {
    setSearchQuery("");
    setProcessingTimeFilter("all");
    setPriceRange([priceStats.min, priceStats.max]);
  };

  const hasActiveFilters = searchQuery.trim() !== "" ||
    processingTimeFilter !== "all" || 
    priceRange[0] !== priceStats.min || 
    priceRange[1] !== priceStats.max;

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

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base rounded-full border-2 focus:border-primary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {hasActiveFilters && !searchQuery && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  Active
                </Badge>
              )}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="w-4 h-4" />
                Clear All
              </Button>
            )}
            
            <span className="text-sm text-muted-foreground">
              Showing {filteredCountries.length} of {countries.length} countries
            </span>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-card rounded-xl p-6 shadow-sm border border-border"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Processing Time Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Processing Time</label>
                  <Select
                    value={processingTimeFilter}
                    onValueChange={(value: ProcessingTimeFilter) => setProcessingTimeFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select processing time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Processing Times</SelectItem>
                      <SelectItem value="fast">Fast (≤ 7 days)</SelectItem>
                      <SelectItem value="medium">Medium (8-15 days)</SelectItem>
                      <SelectItem value="slow">Standard (15+ days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range Filter */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Price Range: ৳{priceRange[0].toLocaleString()} - ৳{priceRange[1].toLocaleString()}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={priceStats.min}
                    max={priceStats.max}
                    step={1000}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>৳{priceStats.min.toLocaleString()}</span>
                    <span>৳{priceStats.max.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
        >
          {filteredCountries.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">No countries match your filter criteria.</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredCountries.map((country) => (
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
              {/* Featured badge */}
              {country.is_featured && (
                <div className="absolute top-3 right-3 z-20">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md text-xs font-semibold">
                    ⭐ Popular
                  </Badge>
                </div>
              )}
              
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
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCountry(country);
                      setIsDetailsModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-primary text-primary-foreground transition-all duration-300 hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCountry(country);
                      setIsModalOpen(true);
                    }}
                  >
                    Apply
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </motion.div>
            ))
          )}
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
            onClick={() => setIsAllCountriesModalOpen(true)}
          >
            <span>View All Countries</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
      </section>

      {/* All Countries Modal */}
      <Dialog open={isAllCountriesModalOpen} onOpenChange={(open) => {
        setIsAllCountriesModalOpen(open);
        if (!open) setShowInquiryForm(false);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Globe className="w-6 h-6 text-primary" />
              All Visa Processing Countries
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-6">
            {/* Countries Grid */}
            <div className={`transition-all duration-300 ${showInquiryForm ? 'w-1/2' : 'w-full'}`}>
              <ScrollArea className="h-[55vh] pr-4">
                <div className={`grid gap-4 ${showInquiryForm ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  {countries.map((country) => (
                    <div
                      key={country.id}
                      className="group bg-muted rounded-xl p-4 hover:bg-muted/80 transition-all cursor-pointer relative"
                      onClick={() => {
                        setIsAllCountriesModalOpen(false);
                        setSelectedCountry(country);
                        setIsDetailsModalOpen(true);
                      }}
                    >
                      {country.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
                          ⭐ Popular
                        </Badge>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={`https://flagcdn.com/w40/${getCountryCode(country.country_name)}.png`}
                          alt={`${country.country_name} flag`}
                          className="w-8 h-6 object-cover rounded shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement!.innerHTML = country.flag_emoji;
                          }}
                        />
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {country.country_name}
                        </h4>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">⏱️ {country.processing_time}</span>
                        <span className="font-semibold text-secondary">৳{country.price.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Inquiry Form */}
            {showInquiryForm && (
              <div className="w-1/2 border-l border-border pl-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Visa Inquiry
                  </h3>
                  <p className="text-sm text-muted-foreground">Have questions? We'll get back to you soon.</p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);
                  
                  // Simulate form submission
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  toast({
                    title: "Inquiry Submitted!",
                    description: "We'll contact you shortly regarding your visa inquiry.",
                  });
                  
                  setInquiryForm({ name: "", email: "", phone: "", country: "", message: "" });
                  setShowInquiryForm(false);
                  setIsSubmitting(false);
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-name">Full Name *</Label>
                    <Input
                      id="inquiry-name"
                      placeholder="Your full name"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-email">Email *</Label>
                    <Input
                      id="inquiry-email"
                      type="email"
                      placeholder="your@email.com"
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-phone">Phone Number</Label>
                    <Input
                      id="inquiry-phone"
                      placeholder="+880 1XXX-XXXXXX"
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-country">Country of Interest</Label>
                    <Select
                      value={inquiryForm.country}
                      onValueChange={(value) => setInquiryForm(prev => ({ ...prev, country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={c.country_name}>
                            {c.flag_emoji} {c.country_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-message">Your Message *</Label>
                    <Textarea
                      id="inquiry-message"
                      placeholder="Tell us about your visa requirements..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowInquiryForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        "Sending..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Toggle Inquiry Form Button */}
          {!showInquiryForm && (
            <div className="pt-4 border-t border-border">
              <Button
                onClick={() => setShowInquiryForm(true)}
                variant="outline"
                className="w-full"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Have Questions? Contact Us
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <VisaApplicationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCountry(null);
        }}
        country={selectedCountry}
      />

      <VisaDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedCountry(null);
        }}
        country={selectedCountry}
        onApply={(country) => {
          setIsDetailsModalOpen(false);
          setSelectedCountry(country);
          setIsModalOpen(true);
        }}
        getCountryCode={getCountryCode}
      />
    </IslamicBorder>
  );
};

export default VisaServices;
