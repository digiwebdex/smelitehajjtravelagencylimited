import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaymentProcessing } from "@/hooks/usePaymentProcessing";
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
import { Calendar, Users, Globe, Phone, Mail, User, AlertCircle, Clock, Loader2, CreditCard, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { z } from "zod";
import PaymentMethodSelector from "./PaymentMethodSelector";
import BankTransferDetails from "./BankTransferDetails";
import { Separator } from "@/components/ui/separator";

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
  paymentMethod?: string;
  transactionNumber?: string;
  screenshot?: string;
}

interface BankDetails {
  bank_name: string;
  account_name: string;
  account_number: string;
  branch: string;
  routing_number: string;
  swift_code: string;
}

type Step = "details" | "payment" | "confirmation";

const VisaApplicationModal = ({ isOpen, onClose, country }: VisaApplicationModalProps) => {
  const { toast } = useToast();
  const { initiatePayment, processing: paymentProcessing } = usePaymentProcessing();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [bankTransactionNumber, setBankTransactionNumber] = useState("");
  const [bankScreenshot, setBankScreenshot] = useState<File | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
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

  // Fetch bank details when bank_transfer is selected
  useEffect(() => {
    if (paymentMethod === "bank_transfer" && !bankDetails) {
      fetchBankDetails();
    }
  }, [paymentMethod]);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("credentials")
        .eq("slug", "bank_transfer")
        .single();

      if (error) throw error;
      if (data?.credentials) {
        setBankDetails(data.credentials as unknown as BankDetails);
      }
    } catch (error) {
      console.error("Error fetching bank details:", error);
    }
  };

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

  const validateField = (field: keyof FormErrors, value: string | number) => {
    try {
      const fieldSchema = applicationSchema.shape[field];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
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

  const resetFormAndClose = () => {
    onClose();
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
    setCurrentStep("details");
    setPaymentMethod(null);
    setBankTransactionNumber("");
    setBankScreenshot(null);
    setApplicationId(null);
    setErrors({});
    setTouched({});
    setLoading(false);
  };

  const validateDetailsStep = (): boolean => {
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
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === "details") {
      if (validateDetailsStep()) {
        setCurrentStep("payment");
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === "payment") {
      setCurrentStep("details");
    }
  };

  const handlePaymentSubmit = async () => {
    // Prevent double submission
    if (loading || paymentProcessing) {
      console.log("Blocking duplicate visa payment submission");
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    // Validate bank transfer fields
    if (paymentMethod === "bank_transfer") {
      const bankErrors: FormErrors = {};
      if (!bankTransactionNumber.trim()) {
        bankErrors.transactionNumber = "Transaction number is required";
      }
      if (!bankScreenshot) {
        bankErrors.screenshot = "Payment screenshot is required";
      }
      if (Object.keys(bankErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...bankErrors }));
        toast({
          title: "Validation Error",
          description: "Please provide transaction number and screenshot.",
          variant: "destructive",
        });
        return;
      }
    }

    if (!country) return;

    setLoading(true);

    try {
      const totalPrice = country.price * formData.applicantCount;

      // Create visa application in database
      const { data: applicationData, error: insertError } = await supabase
        .from("visa_applications")
        .insert({
          visa_country_id: country.id,
          applicant_name: formData.applicantName.trim(),
          applicant_email: formData.applicantEmail.trim() || null,
          applicant_phone: formData.applicantPhone.trim(),
          applicant_count: formData.applicantCount,
          travel_date: formData.travelDate || null,
          passport_number: formData.passportDetails.passportNumber || null,
          date_of_birth: formData.passportDetails.dateOfBirth || null,
          nationality: formData.passportDetails.nationality,
          notes: formData.notes || null,
          total_price: totalPrice,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending_cash' : (paymentMethod === 'bank_transfer' ? 'pending_verification' : 'pending'),
          bank_transaction_number: paymentMethod === "bank_transfer" ? bankTransactionNumber.trim() : null,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setApplicationId(applicationData.id);

      // Handle bank transfer - upload screenshot
      if (paymentMethod === "bank_transfer" && bankScreenshot) {
        const fileExt = bankScreenshot.name.split(".").pop();
        const fileName = `visa/${applicationData.id}/bank-transfer-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("booking-documents")
          .upload(fileName, bankScreenshot);

        if (uploadError) {
          console.error("Screenshot upload error:", uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from("booking-documents")
            .getPublicUrl(fileName);

          if (urlData?.publicUrl) {
            await supabase
              .from("visa_applications")
              .update({ bank_transfer_screenshot_url: urlData.publicUrl })
              .eq("id", applicationData.id);
          }
        }

        setCurrentStep("confirmation");
        toast({
          title: "Application Submitted!",
          description: "Your bank transfer details have been submitted. We will verify your payment and confirm shortly.",
        });
        return;
      }

      // For cash payments
      if (paymentMethod === "cash") {
        setCurrentStep("confirmation");
        toast({
          title: "Application Submitted!",
          description: "Please visit our office to complete the cash payment.",
        });
        return;
      }

      // For online payments (SSLCommerz, bKash, Nagad)
      // Create a temporary booking for payment processing
      const { data: tempBookingData, error: tempBookingError } = await supabase
        .from("bookings")
        .insert({
          package_id: country.id, // Using visa_country_id as package_id for payment reference
          passenger_count: formData.applicantCount,
          total_price: totalPrice,
          guest_name: formData.applicantName.trim(),
          guest_email: formData.applicantEmail.trim() || null,
          guest_phone: formData.applicantPhone.trim(),
          payment_method: paymentMethod,
          payment_status: 'pending',
          notes: `Visa Application - ${country.country_name}`,
        })
        .select("id")
        .single();

      if (tempBookingError) {
        // If we can't create temp booking, show success anyway for visa
        setCurrentStep("confirmation");
        toast({
          title: "Application Submitted!",
          description: "Your visa application has been submitted. Our team will contact you for payment.",
        });
        return;
      }

      // Link visa application to temp booking
      await supabase
        .from("visa_applications")
        .update({ transaction_id: tempBookingData.id })
        .eq("id", applicationData.id);

      // Initiate payment
      const paymentResult = await initiatePayment({
        bookingId: tempBookingData.id,
        paymentMethod: paymentMethod,
        amount: totalPrice,
      });

      if (paymentResult.success) {
        if (!paymentResult.redirectUrl) {
          setCurrentStep("confirmation");
        }
        // For online payments with redirect, the hook handles it
      } else {
        toast({
          title: "Payment Initiation Failed",
          description: paymentResult.error || "Could not initiate payment. Please try again or choose a different method.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Visa application error:", error);
      toast({
        title: "Application Failed",
        description: error.message || "Unable to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!country) return null;

  const totalPrice = country.price * formData.applicantCount;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-4">
      {["details", "payment", "confirmation"].map((step, index) => (
        <div key={step} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
            currentStep === step 
              ? 'bg-primary text-primary-foreground' 
              : index < ["details", "payment", "confirmation"].indexOf(currentStep)
                ? 'bg-green-500 text-white'
                : 'bg-muted text-muted-foreground'
          }`}>
            {index < ["details", "payment", "confirmation"].indexOf(currentStep) ? (
              <Check className="w-4 h-4" />
            ) : (
              index + 1
            )}
          </div>
          {index < 2 && (
            <div className={`w-12 h-0.5 mx-1 ${
              index < ["details", "payment", "confirmation"].indexOf(currentStep)
                ? 'bg-green-500'
                : 'bg-muted'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderDetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-4"
    >
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

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={resetFormAndClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="button" 
          className="flex-1 bg-gradient-primary"
          onClick={handleNextStep}
        >
          Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </motion.div>
  );

  const renderPaymentStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Order Summary */}
      <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Amount</span>
          <span className="text-2xl font-bold text-secondary">
            {formatCurrency(totalPrice)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formData.applicantCount} applicant(s) × {formatCurrency(country.price)}
        </p>
      </div>

      <Separator />

      {/* Payment Method Selection */}
      <PaymentMethodSelector
        selectedMethod={paymentMethod}
        onSelect={setPaymentMethod}
      />

      {/* Bank Transfer Details */}
      <AnimatePresence>
        {paymentMethod === "bank_transfer" && bankDetails && (
          <BankTransferDetails
            bankDetails={bankDetails}
            transactionNumber={bankTransactionNumber}
            onTransactionNumberChange={setBankTransactionNumber}
            screenshotFile={bankScreenshot}
            onScreenshotChange={setBankScreenshot}
            error={errors.transactionNumber}
          />
        )}
      </AnimatePresence>

      <div className="flex gap-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handlePreviousStep}
          disabled={loading || paymentProcessing}
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button 
          type="button" 
          className="flex-1 bg-gradient-primary"
          onClick={handlePaymentSubmit}
          disabled={!paymentMethod || loading || paymentProcessing}
        >
          {loading || paymentProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay {formatCurrency(totalPrice)}
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );

  const renderConfirmationStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4 py-6"
    >
      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">Application Submitted!</h3>
        <p className="text-muted-foreground mt-2">
          Your visa application for {country.country_name} has been submitted successfully.
        </p>
      </div>
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        {paymentMethod === "bank_transfer" && (
          <p>Your bank transfer details are being verified. We will notify you once confirmed.</p>
        )}
        {paymentMethod === "cash" && (
          <p>Please visit our office to complete the cash payment.</p>
        )}
        {paymentMethod !== "bank_transfer" && paymentMethod !== "cash" && (
          <p>Our team will contact you shortly with further details.</p>
        )}
      </div>
      <Button 
        type="button" 
        className="w-full bg-gradient-primary"
        onClick={resetFormAndClose}
      >
        Done
      </Button>
    </motion.div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={resetFormAndClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Apply for {country.country_name} Visa
          </DialogTitle>
          <DialogDescription>
            {currentStep === "details" && "Fill in your details to apply for your visa"}
            {currentStep === "payment" && "Select a payment method to complete your application"}
            {currentStep === "confirmation" && "Your application has been submitted"}
          </DialogDescription>
        </DialogHeader>

        {currentStep !== "confirmation" && renderStepIndicator()}

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

        <AnimatePresence mode="wait">
          {currentStep === "details" && renderDetailsStep()}
          {currentStep === "payment" && renderPaymentStep()}
          {currentStep === "confirmation" && renderConfirmationStep()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default VisaApplicationModal;