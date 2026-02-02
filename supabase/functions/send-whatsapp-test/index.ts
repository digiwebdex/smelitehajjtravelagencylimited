import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppConfig {
  api_key: string;
  phone_number_id: string;
  business_account_id: string;
  message_template?: string;
}

interface TestRequest {
  phoneNumber: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-whatsapp-test function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { phoneNumber }: TestRequest = await req.json();
    console.log("Testing WhatsApp for phone:", phoneNumber);

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch WhatsApp settings
    const { data: whatsappData, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("setting_type", "whatsapp")
      .maybeSingle();

    if (settingsError) {
      console.error("Error fetching WhatsApp settings:", settingsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch WhatsApp settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!whatsappData?.is_enabled) {
      return new Response(
        JSON.stringify({ error: "WhatsApp notifications are not enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const config = whatsappData.config as unknown as WhatsAppConfig;

    if (!config.api_key || !config.phone_number_id) {
      return new Response(
        JSON.stringify({ error: "WhatsApp API Key and Phone Number ID are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '880' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('880') && !formattedPhone.startsWith('1')) {
      formattedPhone = '880' + formattedPhone;
    }

    // Send test message via Meta WhatsApp Business API
    const testMessage = "🧪 This is a test message from SM Elite Hajj WhatsApp Business API. Your configuration is working correctly!";

    const whatsappApiUrl = `https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`;

    const response = await fetch(whatsappApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: testMessage
        }
      }),
    });

    const responseData = await response.json();
    console.log("WhatsApp API response:", JSON.stringify(responseData));

    if (!response.ok) {
      const errorMessage = responseData.error?.message || "Failed to send WhatsApp message";
      console.error("WhatsApp API error:", errorMessage);
      
      // Log the failed attempt
      await supabase.from("notification_logs").insert({
        booking_id: null,
        notification_type: "whatsapp_test",
        recipient: formattedPhone,
        status: "failed",
        error_message: errorMessage,
      });

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the successful attempt
    await supabase.from("notification_logs").insert({
      booking_id: null,
      notification_type: "whatsapp_test",
      recipient: formattedPhone,
      status: "sent",
      error_message: null,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test message sent successfully",
        messageId: responseData.messages?.[0]?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-whatsapp-test:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
