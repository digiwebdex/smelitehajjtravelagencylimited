import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple SMTP helper for sending emails
const sendSMTPEmail = async (
  config: { host: string; port: number; user: string; password: string; fromEmail: string; fromName: string },
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> => {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

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
    await readResponse();
    await writeCommand(`EHLO localhost`);
    
    const starttlsResp = await writeCommand("STARTTLS");
    if (starttlsResp.startsWith("220")) {
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

      await tlsWriteCommand(`EHLO localhost`);
      await tlsWriteCommand("AUTH LOGIN");
      await tlsWriteCommand(btoa(config.user));
      const authResp = await tlsWriteCommand(btoa(config.password));
      
      if (!authResp.startsWith("235")) {
        throw new Error("SMTP authentication failed: " + authResp);
      }
      
      await tlsWriteCommand(`MAIL FROM:<${config.fromEmail}>`);
      await tlsWriteCommand(`RCPT TO:<${to}>`);
      await tlsWriteCommand("DATA");
      
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

interface NotificationRequest {
  applicationId: string;
  newStatus: string;
  notes?: string;
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

interface WhatsAppConfig {
  provider: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  message_template: string;
}

const visaStatusLabels: Record<string, string> = {
  pending: 'Application Submitted',
  processing: 'Under Processing',
  approved: 'Visa Approved',
  rejected: 'Visa Rejected',
  completed: 'Visa Completed',
};

const getStatusEmoji = (status: string): string => {
  const emojis: Record<string, string> = {
    pending: '📝',
    processing: '⏳',
    approved: '✅',
    rejected: '❌',
    completed: '🎉',
  };
  return emojis[status] || '📋';
};

const formatWhatsAppNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '880' + cleaned.substring(1);
  }
  return `whatsapp:+${cleaned}`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-visa-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId, newStatus, notes }: NotificationRequest = await req.json();
    console.log("Processing visa notification for application:", applicationId, "Status:", newStatus);

    const { data: application, error: applicationError } = await supabase
      .from("visa_applications")
      .select(`*, visa_countries (country_name, flag_emoji, processing_time)`)
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      throw new Error("Visa application not found");
    }

    const customerName = application.applicant_name || "Customer";
    const customerEmail = application.applicant_email;
    const customerPhone = application.applicant_phone;

    console.log("Customer details:", { customerName, customerEmail, customerPhone });

    const { data: settings } = await supabase.from("notification_settings").select("*");

    const smsSettings = settings?.find(s => s.setting_type === "sms");
    const emailSettings = settings?.find(s => s.setting_type === "email");
    const whatsappSettings = settings?.find(s => s.setting_type === "whatsapp");

    const results = {
      sms: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
      whatsapp: { sent: false, error: null as string | null },
    };

    const statusLabel = visaStatusLabels[newStatus] || newStatus;
    const statusEmoji = getStatusEmoji(newStatus);
    const countryName = application.visa_countries?.country_name || 'Unknown';
    const countryFlag = application.visa_countries?.flag_emoji || '🌍';

    // Send WhatsApp if enabled
    if (whatsappSettings?.is_enabled && customerPhone) {
      try {
        const whatsappConfig = whatsappSettings.config as unknown as WhatsAppConfig;
        let message = `${statusEmoji} Hello ${customerName}!\n\nYour ${countryFlag} ${countryName} visa application status has been updated to: *${statusLabel}*\n\nApplication ID: ${application.id.slice(0, 8).toUpperCase()}`;
        if (notes) message += `\n\nNote: ${notes}`;
        if (newStatus === 'approved') message += `\n\n🎊 Congratulations! Your visa has been approved.`;
        if (newStatus === 'rejected') message += `\n\nPlease contact us for more information.`;

        const toNumber = formatWhatsAppNumber(customerPhone);
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

        results.whatsapp.sent = true;
        await supabase.from("notification_logs").insert({
          notification_type: "whatsapp_visa",
          recipient: customerPhone,
          status: "sent",
        });
      } catch (whatsappError: any) {
        results.whatsapp.error = whatsappError.message;
        await supabase.from("notification_logs").insert({
          notification_type: "whatsapp_visa",
          recipient: customerPhone,
          status: "failed",
          error_message: whatsappError.message,
        });
      }
    }

    // Send SMS if enabled
    if (smsSettings?.is_enabled && customerPhone) {
      try {
        const smsConfig = smsSettings.config as unknown as SMSConfig;
        let smsMessage = `${statusEmoji} Dear ${customerName}, your ${countryName} visa application status: ${statusLabel}.`;
        if (notes) smsMessage += ` Note: ${notes}`;
        smsMessage += ` App ID: ${application.id.slice(0, 8).toUpperCase()}`;

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

        if (!smsResponse.ok) throw new Error(`SMS API error: ${await smsResponse.text()}`);

        results.sms.sent = true;
        await supabase.from("notification_logs").insert({
          notification_type: "sms_visa",
          recipient: customerPhone,
          status: "sent",
        });
      } catch (smsError: any) {
        results.sms.error = smsError.message;
        await supabase.from("notification_logs").insert({
          notification_type: "sms_visa",
          recipient: customerPhone,
          status: "failed",
          error_message: smsError.message,
        });
      }
    }

    // Send Email if enabled
    if (emailSettings?.is_enabled && customerEmail) {
      try {
        const emailConfig = emailSettings.config as unknown as EmailConfig;
        console.log("Sending email to:", customerEmail);

        const statusColor = newStatus === 'approved' ? '#22c55e' : 
                           newStatus === 'rejected' ? '#ef4444' : '#d4a853';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><title>Visa Application Status Update</title></head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #d4a853, #c4963e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1>${statusEmoji} Visa Application Update</h1>
                <p>${countryFlag} ${countryName} Visa</p>
              </div>
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
                <p>Dear ${customerName},</p>
                <p>Your visa application status has been updated.</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
                  <strong style="font-size: 1.2em; color: ${statusColor};">Current Status: ${statusLabel}</strong>
                  ${notes ? `<p style="margin-top: 10px; color: #666;">"${notes}"</p>` : ''}
                </div>
                ${newStatus === 'approved' ? `<div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #22c55e;">🎊 Congratulations!</h3><p>Your visa has been approved!</p></div>` : ''}
                ${newStatus === 'rejected' ? `<div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="color: #ef4444;">Application Status</h3><p>Please contact us for more information.</p></div>` : ''}
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3>Application Details</h3>
                  <div style="padding: 8px 0; border-bottom: 1px solid #eee;"><span style="color: #666;">Application ID:</span> <strong>${application.id.slice(0, 8).toUpperCase()}</strong></div>
                  <div style="padding: 8px 0; border-bottom: 1px solid #eee;"><span style="color: #666;">Country:</span> <strong>${countryFlag} ${countryName}</strong></div>
                  <div style="padding: 8px 0;"><span style="color: #666;">Applicants:</span> <strong>${application.applicant_count}</strong></div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

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
          `${statusEmoji} Visa Application Update: ${statusLabel} - ${countryName}`,
          emailHtml
        );

        results.email.sent = true;
        console.log("Email sent successfully");

        await supabase.from("notification_logs").insert({
          notification_type: "email_visa",
          recipient: customerEmail,
          status: "sent",
        });
      } catch (emailError: any) {
        console.error("Email sending error:", emailError);
        results.email.error = emailError.message;

        await supabase.from("notification_logs").insert({
          notification_type: "email_visa",
          recipient: customerEmail,
          status: "failed",
          error_message: emailError.message,
        });
      }
    }

    console.log("Visa notification results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-visa-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);