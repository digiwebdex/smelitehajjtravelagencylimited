import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PaymentMethodSelector from "./PaymentMethodSelector";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";

interface InstallmentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  installment: {
    id: string;
    installment_number: number;
    amount: number;
    due_date: string | null;
  } | null;
  onPaymentSuccess: () => void;
}

const InstallmentPaymentModal = ({
  isOpen,
  onClose,
  installment,
  onPaymentSuccess,
}: InstallmentPaymentModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  if (!installment) return null;

  const isOverdue = installment.due_date && new Date(installment.due_date) < new Date();

  const getCallbackUrls = () => {
    const baseUrl = window.location.origin;
    return {
      successUrl: `${baseUrl}/payment/success?type=installment&id=${installment.id}`,
      failUrl: `${baseUrl}/payment/failed?type=installment&id=${installment.id}`,
      cancelUrl: `${baseUrl}/my-bookings`,
    };
  };

  const handlePayment = async () => {
    // Prevent double submission
    if (processing) {
      console.log("Blocking duplicate payment submission");
      return;
    }

    if (!selectedMethod) {
      toast({
        title: "Select Payment Method",
        description: "Please select a payment method to continue.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      if (selectedMethod === "cash") {
        // For cash, just show a message
        toast({
          title: "Cash Payment",
          description: "Please visit our office to complete the cash payment for this installment.",
        });
        onClose();
        return;
      }

      // For online payments, initiate via edge function
      const urls = getCallbackUrls();

      const { data, error } = await supabase.functions.invoke("payment-installment", {
        body: {
          action: "initiate",
          installmentId: installment.id,
          successUrl: urls.successUrl,
          failUrl: urls.failUrl,
          cancelUrl: urls.cancelUrl,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success && data?.gatewayUrl) {
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to complete your payment...",
        });

        setTimeout(() => {
          window.location.href = data.gatewayUrl;
        }, 1000);
      } else {
        throw new Error(data?.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => !processing && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pay Installment #{installment.installment_number}
          </DialogTitle>
          <DialogDescription>
            Complete your installment payment securely
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Installment</span>
              <span className="font-medium">#{installment.installment_number}</span>
            </div>
            {installment.due_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Due Date</span>
                <span className={isOverdue ? "text-red-500 font-medium" : ""}>
                  {format(new Date(installment.due_date), "dd MMM yyyy")}
                  {isOverdue && " (Overdue)"}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Amount to Pay</span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(installment.amount)}
              </span>
            </div>
          </div>

          {isOverdue && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>This installment is overdue. Please pay as soon as possible.</span>
            </div>
          )}

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelect={setSelectedMethod}
          />

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={!selectedMethod || processing}
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Pay {formatCurrency(installment.amount)}
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our payment terms and conditions.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallmentPaymentModal;
