import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  transactionId?: string;
  error?: string;
}

interface InitiatePaymentParams {
  bookingId: string;
  paymentMethod: string;
  amount: number;
}

export const usePaymentProcessing = () => {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const getCallbackUrls = () => {
    const baseUrl = window.location.origin;
    return {
      successUrl: `${baseUrl}/payment/success`,
      failUrl: `${baseUrl}/payment/failed`,
      cancelUrl: `${baseUrl}/payment/cancelled`,
      callbackUrl: `${baseUrl}/payment/callback`,
    };
  };

  const initiateSSLCommerz = async (bookingId: string): Promise<PaymentResult> => {
    console.log("Initiating SSLCommerz payment for booking:", bookingId);
    const urls = getCallbackUrls();

    const { data, error } = await supabase.functions.invoke("payment-sslcommerz", {
      body: {
        action: "initiate",
        bookingId,
        successUrl: urls.successUrl,
        failUrl: urls.failUrl,
        cancelUrl: urls.cancelUrl,
      },
    });

    if (error) {
      console.error("SSLCommerz error:", error);
      return { success: false, error: error.message };
    }

    if (data?.success && data?.gatewayUrl) {
      return {
        success: true,
        redirectUrl: data.gatewayUrl,
        transactionId: data.transactionId,
      };
    }

    return { success: false, error: data?.error || "Failed to initiate payment" };
  };

  const initiateBkash = async (bookingId: string): Promise<PaymentResult> => {
    console.log("Initiating bKash payment for booking:", bookingId);
    const urls = getCallbackUrls();

    const { data, error } = await supabase.functions.invoke("payment-bkash", {
      body: {
        action: "initiate",
        bookingId,
        callbackUrl: `${urls.callbackUrl}?gateway=bkash&bookingId=${bookingId}`,
      },
    });

    if (error) {
      console.error("bKash error:", error);
      return { success: false, error: error.message };
    }

    if (data?.success && data?.bkashURL) {
      return {
        success: true,
        redirectUrl: data.bkashURL,
        transactionId: data.paymentId,
      };
    }

    return { success: false, error: data?.error || "Failed to initiate bKash payment" };
  };

  const initiateNagad = async (bookingId: string): Promise<PaymentResult> => {
    console.log("Initiating Nagad payment for booking:", bookingId);
    const urls = getCallbackUrls();

    const { data, error } = await supabase.functions.invoke("payment-nagad", {
      body: {
        action: "initiate",
        bookingId,
        callbackUrl: `${urls.callbackUrl}?gateway=nagad&bookingId=${bookingId}`,
      },
    });

    if (error) {
      console.error("Nagad error:", error);
      return { success: false, error: error.message };
    }

    if (data?.success && data?.paymentUrl) {
      return {
        success: true,
        redirectUrl: data.paymentUrl,
        transactionId: data.orderId,
      };
    }

    return { success: false, error: data?.error || "Failed to initiate Nagad payment" };
  };

  const processCashPayment = async (bookingId: string): Promise<PaymentResult> => {
    console.log("Processing cash payment for booking:", bookingId);
    
    // For cash, just update the booking status
    const { error } = await supabase
      .from("bookings")
      .update({ payment_status: "pending_cash" })
      .eq("id", bookingId);

    if (error) {
      console.error("Cash payment error:", error);
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      transactionId: `CASH_${bookingId.slice(0, 8)}` 
    };
  };

  const initiatePayment = async ({ 
    bookingId, 
    paymentMethod, 
    amount 
  }: InitiatePaymentParams): Promise<PaymentResult> => {
    setProcessing(true);

    try {
      let result: PaymentResult;

      switch (paymentMethod) {
        case "sslcommerz":
          result = await initiateSSLCommerz(bookingId);
          break;
        case "bkash":
          result = await initiateBkash(bookingId);
          break;
        case "nagad":
          result = await initiateNagad(bookingId);
          break;
        case "cash":
          result = await processCashPayment(bookingId);
          break;
        default:
          result = { success: false, error: "Unknown payment method" };
      }

      if (result.success) {
        if (result.redirectUrl) {
          // Redirect to payment gateway
          toast({
            title: "Redirecting to Payment",
            description: "You will be redirected to complete your payment...",
          });
          
          // Small delay to show the toast
          setTimeout(() => {
            window.location.href = result.redirectUrl!;
          }, 1000);
        } else if (paymentMethod === "cash") {
          toast({
            title: "Booking Confirmed!",
            description: "Please visit our office to complete the cash payment.",
          });
        }
      } else {
        toast({
          title: "Payment Failed",
          description: result.error || "Unable to process payment. Please try again.",
          variant: "destructive",
        });
      }

      return result;
    } catch (error: any) {
      console.error("Payment processing error:", error);
      const errorResult = { success: false, error: error.message };
      
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });

      return errorResult;
    } finally {
      setProcessing(false);
    }
  };

  const verifyPayment = async (
    gateway: string,
    paymentId: string,
    bookingId: string
  ): Promise<PaymentResult> => {
    setProcessing(true);

    try {
      let functionName: string;
      let body: Record<string, string>;

      switch (gateway) {
        case "sslcommerz":
          functionName = "payment-sslcommerz";
          body = { action: "validate", valId: paymentId, bookingId };
          break;
        case "bkash":
          functionName = "payment-bkash";
          body = { action: "execute", paymentId, bookingId };
          break;
        case "nagad":
          functionName = "payment-nagad";
          body = { action: "complete", paymentRefId: paymentId, bookingId };
          break;
        default:
          return { success: false, error: "Unknown gateway" };
      }

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: data?.success || false,
        transactionId: data?.transactionId,
        error: data?.error,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setProcessing(false);
    }
  };

  return {
    initiatePayment,
    verifyPayment,
    processing,
  };
};
