import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Clock, FileText, DollarSign, Calendar, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
}

interface VisaDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: VisaCountry | null;
  onApply: (country: VisaCountry) => void;
  getCountryCode: (countryName: string) => string;
}

const VisaDetailsModal = ({ isOpen, onClose, country, onApply, getCountryCode }: VisaDetailsModalProps) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!country) return null;

  const handleApply = () => {
    onApply(country);
    onClose();
  };

  // Default requirements if none provided
  const requirements = country.requirements?.length 
    ? country.requirements 
    : [
        'Valid passport with 6+ months validity',
        'Completed visa application form',
        'Recent passport-sized photos',
        'Proof of accommodation',
        'Travel itinerary'
      ];

  // Default documents if none provided
  const documents = country.documents_needed?.length 
    ? country.documents_needed 
    : [
        'Original passport',
        'Passport copy',
        'Bank statements (last 3 months)',
        'Employment letter',
        'Hotel booking confirmation',
        'Flight reservation'
      ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col max-h-[90vh]"
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6 pb-10 flex-shrink-0">
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <img 
                    src={`https://flagcdn.com/w80/${getCountryCode(country.country_name)}.png`}
                    alt={`${country.country_name} flag`}
                    className="w-16 h-12 object-cover rounded shadow-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div>
                    <Badge className="bg-white/20 text-white border-0 mb-2">
                      Visa Services
                    </Badge>
                    <DialogTitle className="text-2xl font-heading font-bold text-white">
                      {country.country_name} Visa
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              
              {/* Price badge */}
              <div className="absolute -bottom-5 right-6 bg-secondary text-secondary-foreground px-5 py-3 rounded-lg shadow-gold">
                <span className="text-2xl font-bold">৳{country.price.toLocaleString()}</span>
                <span className="text-xs block opacity-80">starting from</span>
              </div>
            </div>

            <ScrollArea className="flex-1 overflow-auto">
              <div className="p-6 pt-8 space-y-6">
                {/* Quick Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-sm font-medium">{country.processing_time}</span>
                  </div>
                  {country.validity_period && (
                    <div className="bg-muted/50 rounded-lg p-3 text-center">
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <span className="text-sm font-medium">{country.validity_period} validity</span>
                    </div>
                  )}
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <DollarSign className="w-5 h-5 mx-auto mb-1 text-primary" />
                    <span className="text-sm font-medium">All inclusive</span>
                  </div>
                </div>

                {/* Description */}
                {country.description && (
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">About</h4>
                    <p className="text-foreground leading-relaxed">
                      {country.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Requirements */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Requirements
                  </h4>
                  <ul className="space-y-2">
                    {requirements.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Documents Needed */}
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Documents Required
                  </h4>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {documents.map((item, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 text-sm"
                      >
                        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* Note */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> Processing times may vary based on embassy workload and completeness of documentation. 
                    Additional documents may be required based on your specific case.
                  </p>
                </div>
              </div>
            </ScrollArea>

            {/* Footer with CTA */}
            <div className="p-6 pt-4 border-t bg-background flex-shrink-0">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Close
                </Button>
                <Button 
                  onClick={handleApply}
                  className="flex-1 bg-gradient-primary hover:opacity-90 shadow-gold"
                >
                  Apply Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VisaDetailsModal;
