import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BkashCredentials {
  app_key: string;
  app_secret: string;
  username: string;
  password: string;
  test_app_key?: string;
  test_app_secret?: string;
  test_username?: string;
  test_password?: string;
}

interface BkashToken {
  id_token: string;
  token_type: string;
  expires_in: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("payment-bkash function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "initiate":
        return await initiatePayment(body, supabase);
      case "execute":
        return await executePayment(body, supabase);
      case "query":
        return await queryPayment(body, supabase);
      case "callback":
        return await handleCallback(body, supabase);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
  } catch (error: any) {
    console.error("Error in payment-bkash:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function getBkashConfig(supabase: any) {
  const { data: paymentMethod, error } = await supabase
    .from("payment_methods")
    .select("credentials, is_live_mode")
    .eq("slug", "bkash")
    .single();

  if (error || !paymentMethod) {
    throw new Error("bKash payment method not configured");
  }

  const credentials = paymentMethod.credentials as BkashCredentials;
  const isLive = paymentMethod.is_live_mode;

  const appKey = isLive ? credentials.app_key : (credentials.test_app_key || credentials.app_key);
  const appSecret = isLive ? credentials.app_secret : (credentials.test_app_secret || credentials.app_secret);
  const username = isLive ? credentials.username : (credentials.test_username || credentials.username);
  const password = isLive ? credentials.password : (credentials.test_password || credentials.password);

  if (!appKey || !appSecret || !username || !password) {
    throw new Error("bKash credentials not configured");
  }

  return {
    appKey,
    appSecret,
    username,
    password,
    baseUrl: isLive
      ? "https://tokenized.pay.bka.sh/v1.2.0-beta"
      : "https://tokenized.sandbox.bka.sh/v1.2.0-beta",
    isLive,
  };
}

async function getGrantToken(config: any): Promise<string> {
  console.log("Getting bKash grant token");

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "username": config.username,
      "password": config.password,
    },
    body: JSON.stringify({
      app_key: config.appKey,
      app_secret: config.appSecret,
    }),
  });

  const result = await response.json();
  console.log("Grant token response:", result);

  if (result.statusCode !== "0000") {
    throw new Error(result.statusMessage || "Failed to get bKash token");
  }

  return result.id_token;
}

async function initiatePayment(body: any, supabase: any): Promise<Response> {
  console.log("Initiating bKash payment for booking:", body.bookingId);

  const config = await getBkashConfig(supabase);
  const idToken = await getGrantToken(config);

  // Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`*, package:packages(title)`)
    .eq("id", body.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  const invoiceNumber = `INV_${booking.id.slice(0, 8)}_${Date.now()}`;

  const payload = {
    mode: "0011",
    payerReference: booking.guest_phone || "01700000000",
    callbackURL: body.callbackUrl,
    amount: booking.total_price.toString(),
    currency: "BDT",
    intent: "sale",
    merchantInvoiceNumber: invoiceNumber,
  };

  console.log("bKash create payment payload:", payload);

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": idToken,
      "X-APP-Key": config.appKey,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log("bKash create response:", result);

  if (result.statusCode === "0000") {
    // Update booking with payment ID
    await supabase
      .from("bookings")
      .update({
        transaction_id: result.paymentID,
        payment_status: "initiated",
      })
      .eq("id", booking.id);

    return new Response(JSON.stringify({
      success: true,
      paymentId: result.paymentID,
      bkashURL: result.bkashURL,
      invoiceNumber,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    console.error("bKash initiation failed:", result);
    return new Response(JSON.stringify({
      success: false,
      error: result.statusMessage || "Payment initiation failed",
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function executePayment(body: any, supabase: any): Promise<Response> {
  console.log("Executing bKash payment:", body.paymentId);

  const config = await getBkashConfig(supabase);
  const idToken = await getGrantToken(config);

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": idToken,
      "X-APP-Key": config.appKey,
    },
    body: JSON.stringify({ paymentID: body.paymentId }),
  });

  const result = await response.json();
  console.log("bKash execute response:", result);

  if (result.statusCode === "0000" && result.transactionStatus === "Completed") {
    // Update booking payment status
    if (body.bookingId) {
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          transaction_id: result.trxID,
        })
        .eq("id", body.bookingId);

      // Log successful payment
      await supabase.from("notification_logs").insert({
        booking_id: body.bookingId,
        notification_type: "payment_callback",
        recipient: "bkash",
        status: "sent",
      });
    }

    return new Response(JSON.stringify({
      success: true,
      transactionId: result.trxID,
      amount: result.amount,
      payerReference: result.payerReference,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    // Log failed payment
    if (body.bookingId) {
      await supabase
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("id", body.bookingId);

      await supabase.from("notification_logs").insert({
        booking_id: body.bookingId,
        notification_type: "payment_callback",
        recipient: "bkash",
        status: "failed",
        error_message: result.statusMessage,
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: result.statusMessage || "Payment execution failed",
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function queryPayment(body: any, supabase: any): Promise<Response> {
  console.log("Querying bKash payment:", body.paymentId);

  const config = await getBkashConfig(supabase);
  const idToken = await getGrantToken(config);

  const response = await fetch(`${config.baseUrl}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": idToken,
      "X-APP-Key": config.appKey,
    },
    body: JSON.stringify({ paymentID: body.paymentId }),
  });

  const result = await response.json();
  console.log("bKash query response:", result);

  return new Response(JSON.stringify({
    success: result.statusCode === "0000",
    status: result.transactionStatus,
    amount: result.amount,
    transactionId: result.trxID,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleCallback(body: any, supabase: any): Promise<Response> {
  console.log("Handling bKash callback:", body);

  const { paymentID, status, bookingId } = body;

  if (status === "success" && paymentID) {
    // Execute the payment
    const executeResult = await executePayment({ paymentId: paymentID, bookingId }, supabase);
    return executeResult;
  } else if (status === "cancel" || status === "failure") {
    // Update booking as failed/cancelled
    if (bookingId) {
      await supabase
        .from("bookings")
        .update({ payment_status: status === "cancel" ? "cancelled" : "failed" })
        .eq("id", bookingId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: status === "cancel" ? "Payment cancelled by user" : "Payment failed",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  return new Response(JSON.stringify({ success: false, error: "Invalid callback" }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);
