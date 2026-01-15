import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Users, Globe, Phone, Mail, User, AlertCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { z } from "zod";

interface VisaCountry {
  id: string;
  country_name: string;
  flag_emoji: string;
  processing_time: string;
  price: number;
}

interface VisaApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: VisaCountry | null;
}

const applicationSchema = z.object({
  applicantName: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  applicantEmail: z.string().trim().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  applicantPhone: z.string().trim().min(1, "Mobile number is required").regex(/^[+]?[\d\s-]{10,}$/, "Please enter a valid phone number"),
  applicantCount: z.number().min(1, "At least 1 applicant required").max(10, "Maximum 10 applicants allowed"),
  travelDate: z.string().optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
});

interface FormErrors {
  applicantName?: string;
  applicantEmail?: string;
  applicantPhone?: string;
  applicantCount?: string;
}

const VisaApplicationModal = ({ isOpen, onClose, country }: VisaApplicationModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    applicantName: "",
    applicantEmail: "",
    applicantPhone: "",
    applicantCount: 1,
    travelDate: "",
    notes: "",
    passportDetails: {
      passportNumber: "",
      dateOfBirth: "",
      nationality: "Bangladeshi",
    },
  });

  const validateField = (field: keyof FormErrors, value: string | number) => {
    try {
      const fieldSchema = applicationSchema.shape[field];
      fieldSchema.parse(value);
      setErrors(prev => ({ ...prev, [field]: undefined }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(prev => ({ ...prev, [field]: error.errors[0].message }));
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field in applicationSchema.shape) {
      validateField(field as keyof FormErrors, formData[field as keyof typeof formData] as string | number);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = applicationSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({ applicantName: true, applicantEmail: true, applicantPhone: true, applicantCount: true });
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    if (!country) return;

    setLoading(true);
    
    // Simulate API call - in production, this would save to database
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Application Submitted!",
      description: `Your visa application for ${country.country_name} has been submitted successfully. We will contact you shortly.`,
    });
    
    onClose();
    // Reset form
    setFormData({
      applicantName: "",
      applicantEmail: "",
      applicantPhone: "",
      applicantCount: 1,
      travelDate: "",
      notes: "",
      passportDetails: {
        passportNumber: "",
        dateOfBirth: "",
        nationality: "Bangladeshi",
      },
    });
    setErrors({});
    setTouched({});
    setLoading(false);
  };

  if (!country) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Apply for {country.country_name} Visa
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to apply for your visa
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-4 mb-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-foreground flex items-center gap-2">
                <span className="text-2xl">{country.flag_emoji}</span>
                {country.country_name}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Processing: {country.processing_time}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(country.price)}
              </p>
              <p className="text-xs text-muted-foreground">per person</p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantCount" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Applicants
              </Label>
              <Input
                id="applicantCount"
                type="number"
                min="1"
                max="10"
                value={formData.applicantCount}
                onChange={(e) => setFormData({ ...formData, applicantCount: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="travelDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Travel Date
              </Label>
              <Input
                id="travelDate"
                type="date"
                value={formData.travelDate}
                onChange={(e) => setFormData({ ...formData, travelDate: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Info - Name and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="applicantName" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="applicantName"
                placeholder="Enter your full name"
                value={formData.applicantName}
                onChange={(e) => {
                  setFormData({ ...formData, applicantName: e.target.value });
                  if (touched.applicantName) validateField("applicantName", e.target.value);
                }}
                onBlur={() => handleBlur("applicantName")}
                className={touched.applicantName && errors.applicantName ? "border-destructive" : ""}
              />
              {touched.applicantName && errors.applicantName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.applicantName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicantEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="applicantEmail"
                type="email"
                placeholder="your@email.com"
                value={formData.applicantEmail}
                onChange={(e) => {
                  setFormData({ ...formData, applicantEmail: e.target.value });
                  if (touched.applicantEmail) validateField("applicantEmail", e.target.value);
                }}
                onBlur={() => handleBlur("applicantEmail")}
                className={touched.applicantEmail && errors.applicantEmail ? "border-destructive" : ""}
              />
              {touched.applicantEmail && errors.applicantEmail && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.applicantEmail}
                </p>
              )}
            </div>
          </div>

          {/* Mobile Number - Mandatory */}
          <div className="space-y-2">
            <Label htmlFor="applicantPhone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="applicantPhone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={formData.applicantPhone}
              onChange={(e) => {
                setFormData({ ...formData, applicantPhone: e.target.value });
                if (touched.applicantPhone) validateField("applicantPhone", e.target.value);
              }}
              onBlur={() => handleBlur("applicantPhone")}
              className={`border-primary/30 focus:border-primary ${touched.applicantPhone && errors.applicantPhone ? "border-destructive" : ""}`}
            />
            {touched.applicantPhone && errors.applicantPhone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.applicantPhone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                placeholder="AB1234567"
                value={formData.passportDetails.passportNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  passportDetails: { ...formData.passportDetails, passportNumber: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.passportDetails.dateOfBirth}
                onChange={(e) => setFormData({
                  ...formData,
                  passportDetails: { ...formData.passportDetails, dateOfBirth: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests / Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or additional information..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-secondary">
                {formatCurrency(country.price * formData.applicantCount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.applicantCount} applicant(s) × {formatCurrency(country.price)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VisaApplicationModal;
