import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  bookingId: string;
}

interface SMSConfig {
  provider: string;
  api_url: string;
  api_key: string;
  sender_id: string;
}

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

interface BookingDetails {
  id: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  travel_date: string | null;
  passenger_count: number;
  total_price: number;
  status: string;
  package: {
    title: string;
    duration_days: number;
    type: string;
  };
  profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId }: NotificationRequest = await req.json();
    console.log("Processing notification for booking:", bookingId);

    // Fetch booking details with package info
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        package:packages(title, duration_days, type)
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      throw new Error("Booking not found");
    }

    console.log("Booking found:", booking);

    // Fetch profile if user_id exists
    let profile = null;
    if (booking.user_id) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", booking.user_id)
        .single();
      profile = profileData;
    }

    const bookingDetails: BookingDetails = {
      ...booking,
      profile,
    };

    // Get customer details
    const customerName = profile?.full_name || booking.guest_name || "Customer";
    const customerEmail = profile?.email || booking.guest_email;
    const customerPhone = profile?.phone || booking.guest_phone;

    console.log("Customer details:", { customerName, customerEmail, customerPhone });

    // Fetch notification settings
    const { data: settings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*");

    if (settingsError) {
      console.error("Error fetching notification settings:", settingsError);
      throw new Error("Could not fetch notification settings");
    }

    const smsSettings = settings?.find(s => s.setting_type === "sms");
    const emailSettings = settings?.find(s => s.setting_type === "email");

    console.log("SMS enabled:", smsSettings?.is_enabled);
    console.log("Email enabled:", emailSettings?.is_enabled);

    const results = {
      sms: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // Send SMS if enabled and phone exists
    if (smsSettings?.is_enabled && customerPhone) {
      try {
        const smsConfig = smsSettings.config as unknown as SMSConfig;
        console.log("Sending SMS to:", customerPhone);
        
        const smsMessage = `Dear ${customerName}, your booking for ${bookingDetails.package.title} has been confirmed! Travel Date: ${booking.travel_date || "TBD"}. Passengers: ${booking.passenger_count}. Total: $${booking.total_price}. Thank you for choosing us!`;

        // Make request to Bulk SMS API
        const smsResponse = await fetch(smsConfig.api_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${smsConfig.api_key}`,
          },
          body: JSON.stringify({
            to: customerPhone,
            from: smsConfig.sender_id,
            message: smsMessage,
          }),
        });

        if (!smsResponse.ok) {
          const errorText = await smsResponse.text();
          throw new Error(`SMS API error: ${errorText}`);
        }

        results.sms.sent = true;
        console.log("SMS sent successfully");

        // Log successful SMS
        await supabase.from("notification_logs").insert({
          booking_id: bookingId,
          notification_type: "sms",
          recipient: customerPhone,
          status: "sent",
        });
      } catch (smsError: any) {
        console.error("SMS sending error:", smsError);
        results.sms.error = smsError.message;

        // Log failed SMS
        await supabase.from("notification_logs").insert({
          booking_id: bookingId,
          notification_type: "sms",
          recipient: customerPhone,
          status: "failed",
          error_message: smsError.message,
        });
      }
    }

    // Send Email if enabled and email exists
    if (emailSettings?.is_enabled && customerEmail) {
      try {
        const emailConfig = emailSettings.config as unknown as EmailConfig;
        console.log("Sending email to:", customerEmail);

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

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Booking Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #d4a853, #c4963e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-label { font-weight: bold; color: #666; }
              .detail-value { color: #333; }
              .total { font-size: 1.2em; color: #d4a853; font-weight: bold; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Booking Confirmed! ✓</h1>
                <p>Thank you for your reservation</p>
              </div>
              <div class="content">
                <p>Dear ${customerName},</p>
                <p>We are pleased to confirm your booking. Here are your booking details:</p>
                
                <div class="booking-details">
                  <div class="detail-row">
                    <span class="detail-label">Package:</span>
                    <span class="detail-value">${bookingDetails.package.title}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${bookingDetails.package.type.charAt(0).toUpperCase() + bookingDetails.package.type.slice(1)}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Duration:</span>
                    <span class="detail-value">${bookingDetails.package.duration_days} Days</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Travel Date:</span>
                    <span class="detail-value">${booking.travel_date || "To be confirmed"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Passengers:</span>
                    <span class="detail-value">${booking.passenger_count}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value total">$${booking.total_price.toLocaleString()}</span>
                  </div>
                </div>
                
                <p>If you have any questions about your booking, please don't hesitate to contact us.</p>
                <p>We look forward to serving you!</p>
              </div>
              <div class="footer">
                <p>This is an automated confirmation email. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        await client.send({
          from: `${emailConfig.from_name} <${emailConfig.from_email}>`,
          to: customerEmail,
          subject: `Booking Confirmation - ${bookingDetails.package.title}`,
          content: "Your booking has been confirmed!",
          html: emailHtml,
        });

        await client.close();
        results.email.sent = true;
        console.log("Email sent successfully");

        // Log successful email
        await supabase.from("notification_logs").insert({
          booking_id: bookingId,
          notification_type: "email",
          recipient: customerEmail,
          status: "sent",
        });
      } catch (emailError: any) {
        console.error("Email sending error:", emailError);
        results.email.error = emailError.message;

        // Log failed email
        await supabase.from("notification_logs").insert({
          booking_id: bookingId,
          notification_type: "email",
          recipient: customerEmail,
          status: "failed",
          error_message: emailError.message,
        });
      }
    }

    console.log("Notification results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-booking-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
