import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Calendar, Users, Plane, Phone, Mail, User } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/currency";

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

const BookingModal = ({ isOpen, onClose, package_info }: BookingModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
    passengerCount: 1,
    travelDate: "",
    notes: "",
    passengerDetails: {
      name: "",
      passportNumber: "",
      dateOfBirth: "",
      nationality: "Bangladeshi",
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestName || !formData.guestPhone) {
      toast({
        title: "Required Fields",
        description: "Please enter your name and phone number.",
        variant: "destructive",
      });
      return;
    }

    if (!package_info) return;

    setLoading(true);
    
    const { error } = await supabase.from("bookings").insert({
      package_id: package_info.id,
      passenger_count: formData.passengerCount,
      travel_date: formData.travelDate || null,
      notes: formData.notes || null,
      passenger_details: formData.passengerDetails,
      total_price: package_info.price * formData.passengerCount,
      guest_name: formData.guestName,
      guest_email: formData.guestEmail || null,
      guest_phone: formData.guestPhone,
    });

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Booking Submitted!",
        description: "Your booking has been submitted successfully. We will contact you shortly.",
      });
      onClose();
      // Reset form
      setFormData({
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        passengerCount: 1,
        travelDate: "",
        notes: "",
        passengerDetails: {
          name: "",
          passportNumber: "",
          dateOfBirth: "",
          nationality: "Bangladeshi",
        },
      });
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
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              required
              className="border-primary/30 focus:border-primary"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guestName" className="flex items-center gap-2">
                <User className="w-4 h-4" /> Your Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="guestName"
                placeholder="Enter your full name"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                required
              />
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
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengerName">Primary Passenger Name</Label>
            <Input
              id="passengerName"
              placeholder="As per passport"
              value={formData.passengerDetails.name}
              onChange={(e) => setFormData({
                ...formData,
                passengerDetails: { ...formData.passengerDetails, name: e.target.value }
              })}
            />
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gradient-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingModal;
