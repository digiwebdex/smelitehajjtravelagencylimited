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
import { Calendar, Users, Plane, Phone, Mail, User, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";
import { z } from "zod";
import PaymentMethodSelector from "./PaymentMethodSelector";

interface Package {
  id: string;
  title: string;
  price: number;
  type: string;
  duration_days: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  package_info: Package | null;
}

const bookingSchema = z.object({
  guestName: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  guestEmail: z.string().trim().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  guestPhone: z.string().trim().min(1, "Mobile number is required").regex(/^[+]?[\d\s-]{10,}$/, "Please enter a valid phone number"),
  passengerCount: z.number().min(1, "At least 1 passenger required").max(10, "Maximum 10 passengers allowed"),
  travelDate: z.string().optional(),
  notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
  paymentMethod: z.string().min(1, "Please select a payment method"),
});

interface FormErrors {
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  passengerCount?: string;
  paymentMethod?: string;
}

const BookingModal = ({ isOpen, onClose, package_info }: BookingModalProps) => {
  const { toast } = useToast();
  const { initiatePayment, processing: paymentProcessing } = usePaymentProcessing();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    passengerCount: 1,
    travelDate: "",
    notes: "",
    paymentMethod: "",
    passengerDetails: {
      name: "",
      passportNumber: "",
      dateOfBirth: "",
      nationality: "Bangladeshi",
    },
  });

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
      const fieldSchema = bookingSchema.shape[field];
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
    if (field in bookingSchema.shape) {
      validateField(field as keyof FormErrors, formData[field as keyof typeof formData] as string | number);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = bookingSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      setTouched({ guestName: true, guestEmail: true, guestPhone: true, passengerCount: true });
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    if (!package_info) return;

    setLoading(true);
    
    const { data: bookingData, error } = await supabase.from("bookings").insert({
      package_id: package_info.id,
      passenger_count: formData.passengerCount,
      travel_date: formData.travelDate || null,
      notes: formData.notes || null,
      passenger_details: formData.passengerDetails,
      total_price: package_info.price * formData.passengerCount,
      guest_name: formData.guestName.trim(),
      guest_email: formData.guestEmail.trim() || null,
      guest_phone: formData.guestPhone.trim(),
      payment_method: formData.paymentMethod,
      payment_status: formData.paymentMethod === 'cash' ? 'pending_cash' : 'pending',
    }).select("id").single();

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Process payment based on selected method
    if (bookingData?.id) {
      // Send booking confirmation notifications in background
      supabase.functions.invoke("send-booking-notification", {
        body: { bookingId: bookingData.id }
      }).catch(err => console.error("Notification error:", err));

      // Initiate payment
      const paymentResult = await initiatePayment({
        bookingId: bookingData.id,
        paymentMethod: formData.paymentMethod,
        amount: package_info.price * formData.passengerCount,
      });

      if (paymentResult.success) {
        // For cash payments or if redirect URL is not needed, close modal
        if (formData.paymentMethod === 'cash' || !paymentResult.redirectUrl) {
          onClose();
          // Reset form
          setFormData({
            guestName: "",
            guestEmail: "",
            guestPhone: "",
            passengerCount: 1,
            travelDate: "",
            notes: "",
            paymentMethod: "",
            passengerDetails: {
              name: "",
              passportNumber: "",
              dateOfBirth: "",
              nationality: "Bangladeshi",
            },
          });
          setErrors({});
          setTouched({});
        }
        // For online payments, the hook handles the redirect
      } else {
        toast({
          title: "Payment Initiation Failed",
          description: paymentResult.error || "Could not initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    }

    setLoading(false);
  };

  if (!package_info) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <Plane className="w-5 h-5 text-primary" />
            Book {package_info.title}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to book your {package_info.type} package
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded-lg p-4 mb-4"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-foreground">{package_info.title}</p>
              <p className="text-sm text-muted-foreground capitalize">{package_info.type} Package • {package_info.duration_days} Days</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(package_info.price)}
              </p>
              <p className="text-xs text-muted-foreground">per person</p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passengerCount" className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Passengers
              </Label>
              <Input
                id="passengerCount"
                type="number"
                min="1"
                max="10"
                value={formData.passengerCount}
                onChange={(e) => setFormData({ ...formData, passengerCount: parseInt(e.target.value) || 1 })}
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
              <Label htmlFor="guestName" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guestName"
                placeholder="Enter your full name"
                value={formData.guestName}
                onChange={(e) => {
                  setFormData({ ...formData, guestName: e.target.value });
                  if (touched.guestName) validateField("guestName", e.target.value);
                }}
                onBlur={() => handleBlur("guestName")}
                className={touched.guestName && errors.guestName ? "border-destructive" : ""}
              />
              {touched.guestName && errors.guestName && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.guestName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestEmail" className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input
                id="guestEmail"
                type="email"
                placeholder="your@email.com"
                value={formData.guestEmail}
                onChange={(e) => {
                  setFormData({ ...formData, guestEmail: e.target.value });
                  if (touched.guestEmail) validateField("guestEmail", e.target.value);
                }}
                onBlur={() => handleBlur("guestEmail")}
                className={touched.guestEmail && errors.guestEmail ? "border-destructive" : ""}
              />
              {touched.guestEmail && errors.guestEmail && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.guestEmail}
                </p>
              )}
            </div>
          </div>

          {/* Mobile Number - Mandatory */}
          <div className="space-y-2">
            <Label htmlFor="guestPhone" className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Mobile Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="guestPhone"
              type="tel"
              placeholder="+880 1XXX-XXXXXX"
              value={formData.guestPhone}
              onChange={(e) => {
                setFormData({ ...formData, guestPhone: e.target.value });
                if (touched.guestPhone) validateField("guestPhone", e.target.value);
              }}
              onBlur={() => handleBlur("guestPhone")}
              className={`border-primary/30 focus:border-primary ${touched.guestPhone && errors.guestPhone ? "border-destructive" : ""}`}
            />
            {touched.guestPhone && errors.guestPhone && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.guestPhone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passportNumber">Passport Number</Label>
              <Input
                id="passportNumber"
                placeholder="AB1234567"
                value={formData.passengerDetails.passportNumber}
                onChange={(e) => setFormData({
                  ...formData,
                  passengerDetails: { ...formData.passengerDetails, passportNumber: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.passengerDetails.dateOfBirth}
                onChange={(e) => setFormData({
                  ...formData,
                  passengerDetails: { ...formData.passengerDetails, dateOfBirth: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requests</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Payment Method Selection */}
          <div className="border-t pt-4">
            <PaymentMethodSelector
              selectedMethod={formData.paymentMethod}
              onSelect={(method) => {
                setFormData({ ...formData, paymentMethod: method });
                if (touched.paymentMethod) {
                  setErrors(prev => ({ ...prev, paymentMethod: undefined }));
                }
              }}
            />
            {touched.paymentMethod && errors.paymentMethod && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3" /> {errors.paymentMethod}
              </p>
            )}
          </div>

          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-secondary">
                {formatCurrency(package_info.price * formData.passengerCount)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formData.passengerCount} passenger(s) × {formatCurrency(package_info.price)}
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={loading || paymentProcessing}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary"
              disabled={loading || paymentProcessing}
            >
              {loading || paymentProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {paymentProcessing ? "Processing Payment..." : "Creating Booking..."}
                </>
              ) : (
                "Confirm & Pay"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
