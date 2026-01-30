import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NagadCredentials {
  merchant_id: string;
  merchant_number: string;
  public_key: string;
  private_key: string;
  test_merchant_id?: string;
  test_merchant_number?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("payment-nagad function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if this is a callback from Nagad
    const url = new URL(req.url);
    if (url.pathname.includes("/callback")) {
      return await handleCallback(req, supabase);
    }

    const body = await req.json();
    const action = body.action;

    switch (action) {
      case "initiate":
        return await initiatePayment(body, supabase, req);
      case "complete":
        return await completePayment(body, supabase);
      case "verify":
        return await verifyPayment(body, supabase);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
  } catch (error: any) {
    console.error("Error in payment-nagad:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function getNagadConfig(supabase: any) {
  const { data: paymentMethod, error } = await supabase
    .from("payment_methods")
    .select("credentials, is_live_mode")
    .eq("slug", "nagad")
    .single();

  if (error || !paymentMethod) {
    throw new Error("Nagad payment method not configured");
  }

  const credentials = paymentMethod.credentials as NagadCredentials;
  const isLive = paymentMethod.is_live_mode;

  const merchantId = isLive ? credentials.merchant_id : (credentials.test_merchant_id || credentials.merchant_id);
  const merchantNumber = isLive ? credentials.merchant_number : (credentials.test_merchant_number || credentials.merchant_number);

  if (!merchantId || !merchantNumber || !credentials.public_key || !credentials.private_key) {
    throw new Error("Nagad credentials not configured");
  }

  return {
    merchantId,
    merchantNumber,
    publicKey: credentials.public_key,
    privateKey: credentials.private_key,
    baseUrl: isLive
      ? "https://api.mynagad.com"
      : "https://sandbox.mynagad.com:10080",
    isLive,
  };
}

async function logPayment(supabase: any, data: {
  bookingId: string;
  gateway: string;
  action: string;
  status: string;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  durationMs?: number;
}) {
  try {
    await supabase.from("payment_logs").insert({
      booking_id: data.bookingId,
      gateway: data.gateway,
      action: data.action,
      status: data.status,
      request_data: data.requestData,
      response_data: data.responseData,
      error_message: data.errorMessage,
      duration_ms: data.durationMs,
    });
  } catch (err) {
    console.error("Failed to log payment:", err);
  }
}

async function createTransaction(supabase: any, data: {
  bookingId: string;
  emiInstallmentId?: string;
  paymentMethod: string;
  gatewayName: string;
  transactionId?: string;
  gatewayTransactionId?: string;
  amount: number;
  status: string;
  isLiveMode: boolean;
  requestPayload?: any;
  responsePayload?: any;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const { data: tx } = await supabase.from("transactions").insert({
      booking_id: data.bookingId,
      emi_installment_id: data.emiInstallmentId || null,
      payment_method: data.paymentMethod,
      gateway_name: data.gatewayName,
      transaction_id: data.transactionId,
      gateway_transaction_id: data.gatewayTransactionId,
      amount: data.amount,
      status: data.status,
      is_live_mode: data.isLiveMode,
      request_payload: data.requestPayload,
      response_payload: data.responsePayload,
      error_message: data.errorMessage,
      ip_address: data.ipAddress,
      user_agent: data.userAgent,
    }).select().single();
    
    return tx;
  } catch (err) {
    console.error("Failed to create transaction:", err);
    return null;
  }
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

// Simple encryption for Nagad (in production, use proper RSA encryption)
function encryptData(data: string, _publicKey: string): string {
  return btoa(data);
}

// Simple signature generation (in production, use proper RSA signing)
function generateSignature(data: string, _privateKey: string): string {
  return btoa(data);
}

async function initiatePayment(body: any, supabase: any, req: Request): Promise<Response> {
  const startTime = Date.now();
  console.log("Initiating Nagad payment for booking:", body.bookingId);

  const config = await getNagadConfig(supabase);

  // Fetch booking details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`*, package:packages(title)`)
    .eq("id", body.bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error("Booking not found");
  }

  const paymentAmount = body.amount || booking.total_price;
  const orderId = `ORD_${booking.id.slice(0, 8)}_${Date.now()}`;
  const dateTime = formatDateTime();
  const challenge = generateRandomString(40);
  const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Prepare sensitive data
  const sensitiveData = {
    merchantId: config.merchantId,
    datetime: dateTime,
    orderId: orderId,
    challenge: challenge,
  };

  const sensitiveDataEncrypted = encryptData(
    JSON.stringify(sensitiveData),
    config.publicKey
  );

  const signature = generateSignature(
    JSON.stringify(sensitiveData),
    config.privateKey
  );

  // Initialize payment
  const initUrl = `${config.baseUrl}/api/dfs/check-out/initialize/${config.merchantId}/${orderId}`;
  
  console.log("Calling Nagad initialize API:", initUrl);

  const initResponse = await fetch(initUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-KM-IP-V4": "127.0.0.1",
      "X-KM-Client-Type": "PC_WEB",
      "X-KM-Api-Version": "v-0.2.0",
    },
    body: JSON.stringify({
      accountNumber: config.merchantNumber,
      dateTime: dateTime,
      sensitiveData: sensitiveDataEncrypted,
      signature: signature,
    }),
  });

  const initResult = await initResponse.json();
  const duration = Date.now() - startTime;
  console.log("Nagad initialize response:", initResult);

  // Log payment attempt
  await logPayment(supabase, {
    bookingId: body.bookingId,
    gateway: "nagad",
    action: "initiate",
    status: initResult.sensitiveData ? "success" : "failed",
    requestData: { orderId, amount: paymentAmount },
    responseData: initResult,
    durationMs: duration,
  });

  if (initResult.sensitiveData && initResult.signature) {
    // Create transaction record
    await createTransaction(supabase, {
      bookingId: body.bookingId,
      emiInstallmentId: body.installmentId,
      paymentMethod: "nagad",
      gatewayName: "Nagad",
      transactionId: orderId,
      amount: paymentAmount,
      status: "initiated",
      isLiveMode: config.isLive,
      requestPayload: { orderId },
      ipAddress,
      userAgent,
    });

    // Store payment reference
    await supabase
      .from("bookings")
      .update({
        transaction_id: orderId,
        payment_status: "initiated",
      })
      .eq("id", booking.id);

    // Now complete the payment initialization
    const completeResult = await completePaymentInit(
      config,
      initResult,
      booking,
      orderId,
      body.callbackUrl,
      body.installmentId,
      supabase
    );

    return new Response(JSON.stringify(completeResult), {
      status: completeResult.success ? 200 : 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    // Log failed transaction
    await createTransaction(supabase, {
      bookingId: body.bookingId,
      paymentMethod: "nagad",
      gatewayName: "Nagad",
      amount: paymentAmount,
      status: "failed",
      isLiveMode: config.isLive,
      errorMessage: initResult.message || "Initialization failed",
      ipAddress,
      userAgent,
    });

    console.error("Nagad initialization failed:", initResult);
    return new Response(JSON.stringify({
      success: false,
      error: initResult.message || "Payment initialization failed",
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function completePaymentInit(
  config: any,
  initResult: any,
  booking: any,
  orderId: string,
  callbackUrl: string,
  installmentId: string | undefined,
  supabase: any
): Promise<any> {
  const dateTime = formatDateTime();
  const challenge = generateRandomString(40);

  // Prepare payment request data
  const paymentData = {
    merchantId: config.merchantId,
    orderId: orderId,
    currencyCode: "050", // BDT
    amount: booking.total_price.toString(),
    challenge: challenge,
  };

  const paymentDataEncrypted = encryptData(
    JSON.stringify(paymentData),
    config.publicKey
  );

  const signature = generateSignature(
    JSON.stringify(paymentData),
    config.privateKey
  );

  const completeUrl = `${config.baseUrl}/api/dfs/check-out/complete/${initResult.paymentReferenceId}`;

  console.log("Calling Nagad complete API:", completeUrl);

  const completeResponse = await fetch(completeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-KM-IP-V4": "127.0.0.1",
      "X-KM-Client-Type": "PC_WEB",
      "X-KM-Api-Version": "v-0.2.0",
    },
    body: JSON.stringify({
      sensitiveData: paymentDataEncrypted,
      signature: signature,
      merchantCallbackURL: callbackUrl,
      additionalMerchantInfo: JSON.stringify({
        bookingId: booking.id,
        packageTitle: booking.package?.title,
        installmentId: installmentId || null,
      }),
    }),
  });

  const completeResult = await completeResponse.json();
  console.log("Nagad complete response:", completeResult);

  // Log complete step
  await logPayment(supabase, {
    bookingId: booking.id,
    gateway: "nagad",
    action: "complete_init",
    status: completeResult.callBackUrl ? "success" : "failed",
    responseData: completeResult,
  });

  if (completeResult.callBackUrl) {
    return {
      success: true,
      paymentUrl: completeResult.callBackUrl,
      orderId: orderId,
      paymentReferenceId: initResult.paymentReferenceId,
    };
  } else {
    return {
      success: false,
      error: completeResult.message || "Failed to get payment URL",
    };
  }
}

async function completePayment(body: any, supabase: any): Promise<Response> {
  const startTime = Date.now();
  console.log("Completing Nagad payment:", body);
  
  // Check for duplicate
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id, status")
    .eq("gateway_transaction_id", body.paymentRefId)
    .eq("status", "paid")
    .single();

  if (existingTx) {
    console.log("Duplicate completion - already paid:", body.paymentRefId);
    return new Response(JSON.stringify({
      success: true,
      message: "Payment already processed",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const config = await getNagadConfig(supabase);

  const verifyUrl = `${config.baseUrl}/api/dfs/verify/payment/${body.paymentRefId}`;

  const verifyResponse = await fetch(verifyUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-KM-IP-V4": "127.0.0.1",
      "X-KM-Client-Type": "PC_WEB",
      "X-KM-Api-Version": "v-0.2.0",
    },
  });

  const result = await verifyResponse.json();
  const duration = Date.now() - startTime;
  console.log("Nagad verify response:", result);

  // Log verification
  await logPayment(supabase, {
    bookingId: body.bookingId,
    gateway: "nagad",
    action: "verify",
    status: result.status === "Success" ? "success" : "failed",
    responseData: result,
    durationMs: duration,
  });

  if (result.status === "Success") {
    // Update transaction
    await supabase
      .from("transactions")
      .update({
        status: "paid",
        gateway_transaction_id: result.issuerPaymentRefNo || body.paymentRefId,
        response_payload: result,
        verified_at: new Date().toISOString(),
      })
      .eq("transaction_id", result.orderId);

    // Update booking
    if (body.bookingId) {
      await supabase
        .from("bookings")
        .update({
          payment_status: "paid",
          transaction_id: result.orderId,
        })
        .eq("id", body.bookingId);

      // Update installment if applicable
      if (body.installmentId) {
        await supabase
          .from("emi_installments")
          .update({
            status: "paid",
            paid_date: new Date().toISOString(),
            transaction_id: result.orderId,
            payment_method: "nagad",
          })
          .eq("id", body.installmentId);
      }

      await supabase.from("notification_logs").insert({
        booking_id: body.bookingId,
        notification_type: "payment_callback",
        recipient: "nagad",
        status: "sent",
      });
    }

    return new Response(JSON.stringify({
      success: true,
      transactionId: result.orderId,
      amount: result.amount,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } else {
    // Update as failed
    await supabase
      .from("transactions")
      .update({
        status: "failed",
        error_message: result.message,
        response_payload: result,
      })
      .eq("transaction_id", result.orderId);

    if (body.bookingId) {
      await supabase
        .from("bookings")
        .update({ payment_status: "failed" })
        .eq("id", body.bookingId);

      await supabase.from("notification_logs").insert({
        booking_id: body.bookingId,
        notification_type: "payment_callback",
        recipient: "nagad",
        status: "failed",
        error_message: result.message,
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: result.message || "Payment verification failed",
    }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}

async function verifyPayment(body: any, supabase: any): Promise<Response> {
  console.log("Verifying Nagad payment:", body.paymentRefId);

  const config = await getNagadConfig(supabase);

  const verifyUrl = `${config.baseUrl}/api/dfs/verify/payment/${body.paymentRefId}`;

  const verifyResponse = await fetch(verifyUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-KM-IP-V4": "127.0.0.1",
      "X-KM-Client-Type": "PC_WEB",
      "X-KM-Api-Version": "v-0.2.0",
    },
  });

  const result = await verifyResponse.json();
  console.log("Nagad verify response:", result);

  return new Response(JSON.stringify({
    success: result.status === "Success",
    status: result.status,
    amount: result.amount,
    orderId: result.orderId,
    transactionId: result.issuerPaymentRefNo,
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleCallback(req: Request, supabase: any): Promise<Response> {
  console.log("Handling Nagad callback");

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  
  console.log("Callback params:", params);

  // Log callback
  await logPayment(supabase, {
    bookingId: params.bookingId || "unknown",
    gateway: "nagad",
    action: "callback",
    status: "received",
    requestData: params,
  });

  // The callback URL will contain payment details
  if (params.payment_ref_id) {
    const verifyResult = await verifyPayment(
      { paymentRefId: params.payment_ref_id },
      supabase
    );
    return verifyResult;
  }

  return new Response(JSON.stringify({ success: false, error: "Invalid callback" }), {
    status: 400,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(handler);
