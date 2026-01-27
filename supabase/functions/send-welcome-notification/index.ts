import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeRequest {
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
}

interface WhatsAppConfig {
  provider: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  message_template: string;
  welcome_message_enabled?: boolean;
  welcome_message_template?: string;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

// Helper to format phone number for WhatsApp
const formatWhatsAppNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, assume Bangladesh and replace with 880
  if (cleaned.startsWith('0')) {
    cleaned = '880' + cleaned.substring(1);
  }
  
  // Add whatsapp: prefix if not present
  return `whatsapp:+${cleaned}`;
};

const getWelcomeEmailHtml = (fullName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to SM Elite Hajj</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d4a853, #c4963e); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🕋 Welcome to SM Elite Hajj</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Your Trusted Partner for Hajj & Umrah</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 18px; margin-top: 0;">Assalamu Alaikum <strong>${fullName}</strong>,</p>
          
          <p>We are honored and delighted to welcome you to the SM Elite Hajj family! May Allah bless your journey with us.</p>
          
          <div style="background: linear-gradient(135deg, #f8f4e8, #fff); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #d4a853;">
            <h3 style="margin-top: 0; color: #d4a853;">🌟 What We Offer:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
              <li style="margin: 10px 0;"><strong>Premium Hajj Packages</strong> - Complete guidance for the sacred pilgrimage</li>
              <li style="margin: 10px 0;"><strong>Umrah Packages</strong> - Flexible options for your spiritual journey</li>
              <li style="margin: 10px 0;"><strong>Visa Services</strong> - Hassle-free visa processing for multiple countries</li>
              <li style="margin: 10px 0;"><strong>24/7 Support</strong> - We're always here to assist you</li>
            </ul>
          </div>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0; color: #666;">Ready to begin your spiritual journey?</p>
            <a href="https://smelitehajjtravelagencylimited.lovable.app" style="display: inline-block; margin-top: 15px; background: linear-gradient(135deg, #d4a853, #c4963e); color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">Browse Our Packages</a>
          </div>
          
          <p>If you have any questions or need assistance, our team is always ready to help. Feel free to reach out to us anytime.</p>
          
          <p style="margin-bottom: 0;">
            May Allah accept your intentions and grant you the opportunity to perform Hajj and Umrah.<br><br>
            <strong>JazakAllah Khair,</strong><br>
            <span style="color: #d4a853; font-weight: bold;">SM Elite Hajj Travel Agency Limited</span>
          </p>
        </div>
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p style="margin: 0;">This is an automated welcome email. Please do not reply directly.</p>
          <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} SM Elite Hajj Travel Agency Limited</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-welcome-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, fullName, phone, email }: WelcomeRequest = await req.json();
    console.log("Processing welcome notification for user:", userId, "Phone:", phone, "Email:", email);

    const results = {
      whatsapp: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // Fetch all notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*");

    if (settingsError) {
      console.error("Error fetching notification settings:", settingsError);
      throw new Error("Could not fetch notification settings");
    }

    const whatsappSettings = settings?.find(s => s.setting_type === "whatsapp");
    const emailSettings = settings?.find(s => s.setting_type === "email");

    // Send Welcome Email if enabled and email exists
    if (emailSettings?.is_enabled && email) {
      try {
        const emailConfig = emailSettings.config as unknown as EmailConfig;
        console.log("Sending welcome email to:", email);

        const client = new SMTPClient({
          connection: {
            hostname: emailConfig.smtp_host,
            port: emailConfig.smtp_port,
            tls: emailConfig.smtp_port === 465,
            auth: {
              username: emailConfig.smtp_user,
              password: emailConfig.smtp_password,
            },
          },
        });

        const emailHtml = getWelcomeEmailHtml(fullName || "Valued Customer");

        await client.send({
          from: `${emailConfig.from_name} <${emailConfig.from_email}>`,
          to: email,
          subject: "🕋 Welcome to SM Elite Hajj - Your Spiritual Journey Begins!",
          content: `Welcome to SM Elite Hajj, ${fullName}! We're honored to have you join our family.`,
          html: emailHtml,
        });

        await client.close();
        results.email.sent = true;
        console.log("Welcome email sent successfully");

        // Log successful email
        await supabase.from("notification_logs").insert({
          booking_id: null,
          notification_type: "email_welcome",
          recipient: email,
          status: "sent",
        });
      } catch (emailError: any) {
        console.error("Welcome email sending error:", emailError);
        results.email.error = emailError.message;

        // Log failed email
        await supabase.from("notification_logs").insert({
          booking_id: null,
          notification_type: "email_welcome",
          recipient: email,
          status: "failed",
          error_message: emailError.message,
        });
      }
    }

    // Send WhatsApp Welcome if enabled and phone exists
    if (whatsappSettings?.is_enabled && phone) {
      const whatsappConfig = whatsappSettings.config as unknown as WhatsAppConfig;

      if (whatsappConfig.welcome_message_enabled) {
        try {
          console.log("Sending WhatsApp welcome to:", phone);

          // Format the welcome message from template
          const defaultTemplate = "🌟 Assalamu Alaikum {{name}}! Welcome to SM Elite Hajj. We're honored to have you join our family. May your journey with us be blessed. Contact us anytime for Hajj, Umrah, or Visa services. JazakAllah Khair! 🕋";
          
          let message = whatsappConfig.welcome_message_template || defaultTemplate;
          message = message.replace(/\{\{name\}\}/g, fullName || 'Valued Customer');

          const toNumber = formatWhatsAppNumber(phone);
          
          // Use Twilio API to send WhatsApp message
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${whatsappConfig.account_sid}/Messages.json`;
          
          const formData = new URLSearchParams();
          formData.append('To', toNumber);
          formData.append('From', whatsappConfig.from_number);
          formData.append('Body', message);

          const authHeader = btoa(`${whatsappConfig.account_sid}:${whatsappConfig.auth_token}`);

          const whatsappResponse = await fetch(twilioUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${authHeader}`,
            },
            body: formData.toString(),
          });

          if (!whatsappResponse.ok) {
            const errorData = await whatsappResponse.json();
            throw new Error(`WhatsApp API error: ${errorData.message || JSON.stringify(errorData)}`);
          }

          const responseData = await whatsappResponse.json();
          console.log("WhatsApp welcome message sent, SID:", responseData.sid);

          results.whatsapp.sent = true;

          // Log the notification
          await supabase.from("notification_logs").insert({
            booking_id: null,
            notification_type: "whatsapp_welcome",
            recipient: phone,
            status: "sent",
          });
        } catch (whatsappError: any) {
          console.error("WhatsApp welcome error:", whatsappError);
          results.whatsapp.error = whatsappError.message;

          await supabase.from("notification_logs").insert({
            booking_id: null,
            notification_type: "whatsapp_welcome",
            recipient: phone,
            status: "failed",
            error_message: whatsappError.message,
          });
        }
      }
    }

    console.log("Welcome notification results:", results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-notification:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
