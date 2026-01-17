import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SSLCommerzCredentials {
  store_id: string;
  store_password: string;
  test_store_id?: string;
  test_store_password?: string;
}

interface InitiatePaymentRequest {
  bookingId: string;
  successUrl: string;
  failUrl: string;
  cancelUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("payment-sslcommerz function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    // Handle IPN callback (POST from SSLCommerz)
    if (action === "ipn" || req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      return await handleIPN(req, supabase);
    }

    const body = await req.json();

    if (action === "initiate" || body.action === "initiate") {
      return await initiatePayment(body, supabase);
    }

    if (action === "validate" || body.action === "validate") {
      return await validateTransaction(body, supabase);
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in payment-sslcommerz:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function getSSLCommerzConfig(supabase: any) {
  const { data: paymentMethod, error } = await supabase
    .from("payment_methods")
    .select("credentials, is_live_mode")
    .eq("slug", "sslcommerz")
    .single();

  if (error || !paymentMethod) {
    throw new Error("SSLCommerz payment method not configured");
  }

  const credentials = paymentMethod.credentials as SSLCommerzCredentials;
  const isLive = paymentMethod.is_live_mode;

  const storeId = isLive ? credentials.store_id : (credentials.test_store_id || credentials.store_id);
  const storePassword = isLive ? credentials.store_password : (credentials.test_store_password || credentials.store_password);

  if (!storeId || !storePassword) {
    throw new Error("SSLCommerz credentials not configured");
  }

  return {
    storeId,
    storePassword,
    apiUrl: isLive 
      ? "https://securepay.sslcommerz.com" 
      : "https://sandbox.sslcommerz.com",
    isLive,
  };
}

async function initiatePayment(body: InitiatePaymentRequest, supabase: any): Promise<Response> {
  console.log("Initiating SSLCommerz payment for booking:", body.bookingId);

  const config = await getSSLCommerzConfig(supabase);

  // Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`*, package:packages(title)`)
    .eq("id", body.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  const transactionId = `BOOKING_${booking.id}_${Date.now()}`;

  // Prepare SSLCommerz payload
  const sslPayload = new URLSearchParams({
    store_id: config.storeId,
    store_passwd: config.storePassword,
    total_amount: booking.total_price.toString(),
    currency: "BDT",
    tran_id: transactionId,
    success_url: body.successUrl,
    fail_url: body.failUrl,
    cancel_url: body.cancelUrl,
    ipn_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-sslcommerz/ipn`,
    cus_name: booking.guest_name || "Customer",
    cus_email: booking.guest_email || "customer@example.com",
    cus_phone: booking.guest_phone || "01700000000",
    cus_add1: "Bangladesh",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    product_name: booking.package?.title || "Package Booking",
    product_category: "Travel",
    product_profile: "non-physical-goods",
    value_a: booking.id, // Store booking ID for reference
  });

  console.log("Calling SSLCommerz API:", config.apiUrl);

  const response = await fetch(`${config.apiUrl}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: sslPayload.toString(),
  });

  const result = await response.json();
  console.log("SSLCommerz response:", result);

  if (result.status === "SUCCESS") {
    // Update booking with transaction ID
    await supabase
      .from("bookings")
      .update({ 
        transaction_id: transactionId,
        payment_status: "initiated"
      })
      .eq("id", booking.id);

    return new Response(JSON.stringify({
      success: true,
      gatewayUrl: result.GatewayPageURL,
      sessionKey: result.sessionkey,
      transactionId,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    console.error("SSLCommerz initiation failed:", result);
    return new Response(JSON.stringify({
      success: false,
      error: result.failedreason || "Payment initiation failed",
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function handleIPN(req: Request, supabase: any): Promise<Response> {
  console.log("Processing SSLCommerz IPN callback");

  const formData = await req.formData();
  const data: Record<string, string> = {};
  formData.forEach((value, key) => {
    data[key] = value.toString();
  });

  console.log("IPN data received:", data);

  const { val_id, tran_id, status, value_a: bookingId, amount, bank_tran_id } = data;

  if (!bookingId) {
    console.error("No booking ID in IPN");
    return new Response("OK", { status: 200 });
  }

  // Validate the transaction with SSLCommerz
  const config = await getSSLCommerzConfig(supabase);
  
  const validationUrl = `${config.apiUrl}/validator/api/validationserverAPI.php`;
  const validationParams = new URLSearchParams({
    val_id,
    store_id: config.storeId,
    store_passwd: config.storePassword,
    format: "json",
  });

  const validationResponse = await fetch(`${validationUrl}?${validationParams}`);
  const validationResult = await validationResponse.json();

  console.log("Validation result:", validationResult);

  let paymentStatus = "failed";
  if (validationResult.status === "VALID" || validationResult.status === "VALIDATED") {
    paymentStatus = "paid";
  } else if (status === "PENDING") {
    paymentStatus = "pending";
  }

  // Update booking payment status
  await supabase
    .from("bookings")
    .update({
      payment_status: paymentStatus,
      transaction_id: tran_id,
    })
    .eq("id", bookingId);

  // Log the payment notification
  await supabase.from("notification_logs").insert({
    booking_id: bookingId,
    notification_type: "payment_callback",
    recipient: "sslcommerz",
    status: paymentStatus === "paid" ? "sent" : "failed",
    error_message: paymentStatus !== "paid" ? `Payment ${status}` : null,
  });

  console.log(`Booking ${bookingId} payment status updated to: ${paymentStatus}`);

  return new Response("OK", { status: 200, headers: corsHeaders });
}

async function validateTransaction(body: { valId: string; bookingId: string }, supabase: any): Promise<Response> {
  console.log("Validating SSLCommerz transaction:", body.valId);

  const config = await getSSLCommerzConfig(supabase);

  const validationUrl = `${config.apiUrl}/validator/api/validationserverAPI.php`;
  const validationParams = new URLSearchParams({
    val_id: body.valId,
    store_id: config.storeId,
    store_passwd: config.storePassword,
    format: "json",
  });

  const response = await fetch(`${validationUrl}?${validationParams}`);
  const result = await response.json();

  console.log("Validation result:", result);

  const isValid = result.status === "VALID" || result.status === "VALIDATED";

  if (isValid && body.bookingId) {
    await supabase
      .from("bookings")
      .update({ payment_status: "paid" })
      .eq("id", body.bookingId);
  }

  return new Response(JSON.stringify({
    success: isValid,
    status: result.status,
    amount: result.amount,
    transactionId: result.tran_id,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);
