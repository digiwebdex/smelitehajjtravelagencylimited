import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// Simple SMTP helper for sending emails
const sendSMTPEmail = async (
  config: { host: string; port: number; user: string; password: string; fromEmail: string; fromName: string },
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  // Use a web-based email API approach for reliability
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Connect to SMTP server
  const conn = await Deno.connect({ hostname: config.host, port: config.port });
  
  const readResponse = async (): Promise<string> => {
    const buffer = new Uint8Array(1024);
    const n = await conn.read(buffer);
    return n ? decoder.decode(buffer.subarray(0, n)) : "";
  };

  const writeCommand = async (cmd: string): Promise<string> => {
    await conn.write(encoder.encode(cmd + "\r\n"));
    return await readResponse();
  };

  try {
    // Read server greeting
    await readResponse();
    
    // EHLO
    await writeCommand(`EHLO localhost`);
    
    // STARTTLS
    const starttlsResp = await writeCommand("STARTTLS");
    if (starttlsResp.startsWith("220")) {
      // Upgrade to TLS
      const tlsConn = await Deno.startTls(conn, { hostname: config.host });
      
      const tlsReadResponse = async (): Promise<string> => {
        const buffer = new Uint8Array(2048);
        const n = await tlsConn.read(buffer);
        return n ? decoder.decode(buffer.subarray(0, n)) : "";
      };

      const tlsWriteCommand = async (cmd: string): Promise<string> => {
        await tlsConn.write(encoder.encode(cmd + "\r\n"));
        return await tlsReadResponse();
      };

      // EHLO again after TLS
      await tlsWriteCommand(`EHLO localhost`);
      
      // AUTH LOGIN
      await tlsWriteCommand("AUTH LOGIN");
      await tlsWriteCommand(btoa(config.user));
      const authResp = await tlsWriteCommand(btoa(config.password));
      
      if (!authResp.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + authResp);
      }
      
      // MAIL FROM
      await tlsWriteCommand(`MAIL FROM:<${config.fromEmail}>`);
      
      // RCPT TO
      await tlsWriteCommand(`RCPT TO:<${to}>`);
      
      // DATA
      await tlsWriteCommand("DATA");
      
      // Email content
      const emailContent = [
        `From: ${config.fromName} <${config.fromEmail}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        htmlContent,
        `.`
      ].join("\r\n");
      
      const dataResp = await tlsWriteCommand(emailContent);
      
      if (!dataResp.startsWith("250")) {
        throw new Error("Failed to send email: " + dataResp);
      }
      
      // QUIT
      await tlsWriteCommand("QUIT");
      tlsConn.close();
    } else {
      throw new Error("STARTTLS not supported: " + starttlsResp);
    }
  } catch (error) {
    conn.close();
    throw error;
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  bookingId: string;
  notificationType?: "booking_confirmed" | "payment_verified" | "payment_rejected";
  rejectionReason?: string;
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

const getEmailTemplate = (
  notificationType: string,
  customerName: string,
  bookingDetails: BookingDetails,
  rejectionReason?: string
): { subject: string; html: string } => {
  const baseStyles = `
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
      .header-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
      .header-warning { background: linear-gradient(135deg, #d4a853, #c4963e); color: white; }
      .header-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
      .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
      .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
      .detail-label { font-weight: bold; color: #666; }
      .detail-value { color: #333; }
      .total { font-size: 1.2em; font-weight: bold; }
      .total-success { color: #22c55e; }
      .total-warning { color: #d4a853; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      .alert-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0; }
      .alert-text { color: #dc2626; }
    </style>
  `;

  if (notificationType === "payment_verified") {
    return {
      subject: `Payment Verified - ${bookingDetails.package.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Verified</title>
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header header-success">
              <h1>Payment Verified! ✓</h1>
              <p>Your bank transfer has been confirmed</p>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Great news! Your bank transfer payment has been verified and your booking is now confirmed.</p>
              
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
                  <span class="detail-value">${bookingDetails.travel_date || "To be confirmed"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Passengers:</span>
                  <span class="detail-value">${bookingDetails.passenger_count}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Paid:</span>
                  <span class="detail-value total total-success">$${bookingDetails.total_price.toLocaleString()}</span>
                </div>
              </div>
              
              <p>We will contact you soon with further details about your trip. If you have any questions, please don't hesitate to reach out.</p>
              <p>Thank you for choosing us for your spiritual journey!</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  if (notificationType === "payment_rejected") {
    return {
      subject: `Payment Issue - Action Required - ${bookingDetails.package.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Issue</title>
          ${baseStyles}
        </head>
        <body>
          <div class="container">
            <div class="header header-error">
              <h1>Payment Verification Failed</h1>
              <p>Action required for your booking</p>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Unfortunately, we were unable to verify your bank transfer payment for the following booking:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="detail-label">Package:</span>
                  <span class="detail-value">${bookingDetails.package.title}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount:</span>
                  <span class="detail-value">$${bookingDetails.total_price.toLocaleString()}</span>
                </div>
              </div>
              
              ${rejectionReason ? `
              <div class="alert-box">
                <p><strong>Reason:</strong></p>
                <p class="alert-text">${rejectionReason}</p>
              </div>
              ` : ""}
              
              <p>Please contact us to resolve this issue or make a new payment. You can:</p>
              <ul>
                <li>Re-submit your bank transfer with correct details</li>
                <li>Contact our support team for assistance</li>
                <li>Choose an alternative payment method</li>
              </ul>
              
              <p>We apologize for any inconvenience and are here to help.</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  // Default: booking_confirmed
  return {
    subject: `Booking Confirmation - ${bookingDetails.package.title}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation</title>
        ${baseStyles}
      </head>
      <body>
        <div class="container">
          <div class="header header-warning">
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
                <span class="detail-value">${bookingDetails.travel_date || "To be confirmed"}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Passengers:</span>
                <span class="detail-value">${bookingDetails.passenger_count}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Total Amount:</span>
                <span class="detail-value total total-warning">$${bookingDetails.total_price.toLocaleString()}</span>
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
    `,
  };
};

const getSmsMessage = (
  notificationType: string,
  customerName: string,
  bookingDetails: BookingDetails,
  rejectionReason?: string
): string => {
  if (notificationType === "payment_verified") {
    return `Dear ${customerName}, your bank transfer payment for ${bookingDetails.package.title} has been verified! Your booking is now confirmed. Travel Date: ${bookingDetails.travel_date || "TBD"}. Total Paid: $${bookingDetails.total_price}. Thank you!`;
  }

  if (notificationType === "payment_rejected") {
    return `Dear ${customerName}, we could not verify your bank transfer for ${bookingDetails.package.title}. ${rejectionReason ? `Reason: ${rejectionReason}. ` : ""}Please contact us to resolve this issue.`;
  }

  // Default: booking_confirmed
  return `Dear ${customerName}, your booking for ${bookingDetails.package.title} has been confirmed! Travel Date: ${bookingDetails.travel_date || "TBD"}. Passengers: ${bookingDetails.passenger_count}. Total: $${bookingDetails.total_price}. Thank you for choosing us!`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, notificationType = "booking_confirmed", rejectionReason }: NotificationRequest = await req.json();
    console.log("Processing notification for booking:", bookingId, "Type:", notificationType);

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
        
        const smsMessage = getSmsMessage(notificationType, customerName, bookingDetails, rejectionReason);

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

        const { subject, html: emailHtml } = getEmailTemplate(notificationType, customerName, bookingDetails, rejectionReason);

        await sendSMTPEmail(
          {
            host: emailConfig.smtp_host,
            port: emailConfig.smtp_port,
            user: emailConfig.smtp_user,
            password: emailConfig.smtp_password,
            fromEmail: emailConfig.from_email,
            fromName: emailConfig.from_name,
          },
          customerEmail,
          subject,
          emailHtml
        );

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