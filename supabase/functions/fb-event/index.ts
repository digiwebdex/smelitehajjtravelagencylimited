import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FacebookPixelSettings {
  pixel_id: string;
  access_token: string;
  test_event_code?: string;
  is_enabled: boolean;
}

interface UserData {
  email?: string;
  phone?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
}

interface CustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  [key: string]: unknown;
}

interface EventRequest {
  event_name: string;
  event_id: string;
  event_source_url: string;
  user_data?: UserData;
  custom_data?: CustomData;
}

// SHA-256 hash function for user data
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Normalize and hash email
async function hashEmail(email: string): Promise<string> {
  return hashValue(email.toLowerCase().trim());
}

// Normalize and hash phone (remove non-digits, keep country code)
async function hashPhone(phone: string): Promise<string> {
  const normalized = phone.replace(/\D/g, "");
  return hashValue(normalized);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP from request headers
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Parse request body
    const body: EventRequest = await req.json();
    const {
      event_name,
      event_id,
      event_source_url,
      user_data = {},
      custom_data = {},
    } = body;

    // Fetch Facebook Pixel settings from database
    const { data: settingsData, error: settingsError } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "facebook_pixel")
      .single();

    if (settingsError || !settingsData) {
      console.log("Facebook Pixel not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Facebook Pixel not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const settings = settingsData.setting_value as unknown as FacebookPixelSettings;

    if (!settings.is_enabled || !settings.pixel_id || !settings.access_token) {
      console.log("Facebook Pixel is disabled or missing credentials");
      return new Response(
        JSON.stringify({ success: false, error: "Facebook Pixel is disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build user_data with hashed values
    const hashedUserData: Record<string, unknown> = {
      client_ip_address: clientIp,
      client_user_agent: user_data.client_user_agent || "",
    };

    // Add Facebook cookies if available
    if (user_data.fbc) hashedUserData.fbc = user_data.fbc;
    if (user_data.fbp) hashedUserData.fbp = user_data.fbp;

    // Hash email if provided
    if (user_data.email) {
      hashedUserData.em = [await hashEmail(user_data.email)];
    }

    // Hash phone if provided
    if (user_data.phone) {
      hashedUserData.ph = [await hashPhone(user_data.phone)];
    }

    // Build event data
    const eventData = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      event_source_url,
      action_source: "website",
      user_data: hashedUserData,
      custom_data: {
        ...custom_data,
        currency: custom_data.currency || "BDT",
      },
    };

    // Build payload for Conversions API
    const payload: Record<string, unknown> = {
      data: [eventData],
    };

    // Add test event code if in test mode
    if (settings.test_event_code) {
      payload.test_event_code = settings.test_event_code;
    }

    // Send to Facebook Conversions API with retry logic
    let fbResult: any = null;
    let lastError: string | null = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        const fbResponse = await fetch(
          `https://graph.facebook.com/v18.0/${settings.pixel_id}/events?access_token=${settings.access_token}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        fbResult = await fbResponse.json();

        if (fbResponse.ok) {
          lastError = null;
          break; // Success, exit retry loop
        } else {
          lastError = fbResult.error?.message || "API error";
          retryCount++;
          if (retryCount < maxRetries) {
            // Exponential backoff: 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
          }
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : "Network error";
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount - 1) * 1000));
        }
      }
    }

    // Log the event to marketing_event_logs
    try {
      await supabase.from("marketing_event_logs").insert({
        event_type: event_name,
        event_id: event_id,
        request_payload: payload,
        response_payload: fbResult || { error: lastError },
        status: lastError ? "failed" : "success",
        error_message: lastError,
        retry_count: retryCount,
      });
    } catch (logError) {
      console.error("Failed to log event:", logError);
    }

    if (lastError) {
      console.error("Facebook API error after retries:", lastError);
      return new Response(
        JSON.stringify({ success: false, error: lastError, retries: retryCount }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Facebook event sent successfully:", {
      event_name,
      event_id,
      test_mode: !!settings.test_event_code,
      result: fbResult,
      retries: retryCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        events_received: fbResult.events_received || 1,
        test_mode: !!settings.test_event_code,
        retries: retryCount,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error processing Facebook event:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
