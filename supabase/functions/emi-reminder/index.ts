import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BulkSMSBD SMS sender helper
const sendBulkSMS = async (
  apiKey: string,
  senderId: string,
  phone: string,
  message: string
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '880' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('880')) {
      formattedPhone = '880' + formattedPhone;
    }

    const encodedMessage = encodeURIComponent(message);
    const apiUrl = `http://bulksmsbd.net/api/smsapi?api_key=${apiKey}&type=text&number=${formattedPhone}&senderid=${senderId}&message=${encodedMessage}`;
    
    console.log("Sending SMS to:", formattedPhone);
    
    const response = await fetch(apiUrl, { method: "GET" });
    const responseText = await response.text();
    
    console.log("BulkSMSBD response:", responseText);
    
    try {
      const jsonResponse = JSON.parse(responseText);
      if (jsonResponse.response_code === 202 || jsonResponse.response_code === "202") {
        return { success: true, response: responseText };
      } else {
        return { success: false, error: responseText };
      }
    } catch {
      if (responseText.toLowerCase().includes('success') || response.ok) {
        return { success: true, response: responseText };
      }
      return { success: false, error: responseText };
    }
  } catch (error: any) {
    console.error("SMS sending error:", error);
    return { success: false, error: error.message };
  }
};

// SMTP Email sender helper
const sendEmail = async (
  config: EmailConfig,
  to: string,
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const auth = btoa(`${config.smtp_user}:${config.smtp_password}`);
    
    // Use Gmail's SMTP relay approach
    const emailData = {
      from: `${config.from_name} <${config.from_email}>`,
      to: to,
      subject: subject,
      html: htmlBody,
    };
    
    console.log("Sending email to:", to);
    
    // Simple SMTP via fetch using a mail relay approach
    // For Gmail, we'll construct the email manually
    const boundary = "----=_Part_" + Math.random().toString(36).substring(2);
    const emailBody = [
      `From: ${emailData.from}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      emailData.html,
    ].join("\r\n");

    // Use native Deno TCP for SMTP
    const conn = await Deno.connectTls({
      hostname: config.smtp_host,
      port: 465,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      return n ? decoder.decode(buffer.subarray(0, n)) : "";
    };

    const sendCommand = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await readResponse();
    };

    // SMTP handshake
    await readResponse(); // Read greeting
    await sendCommand(`EHLO ${config.smtp_host}`);
    await sendCommand(`AUTH LOGIN`);
    await sendCommand(btoa(config.smtp_user));
    await sendCommand(btoa(config.smtp_password));
    await sendCommand(`MAIL FROM:<${config.from_email}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand(`DATA`);
    await sendCommand(emailBody + "\r\n.");
    await sendCommand(`QUIT`);

    conn.close();
    return { success: true };
  } catch (error: any) {
    console.error("Email sending error:", error);
    return { success: false, error: error.message };
  }
};

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

interface ReminderConfig {
  reminder_days_before: number;
  send_sms: boolean;
  send_email: boolean;
  overdue_reminder_enabled: boolean;
  overdue_reminder_daily: boolean;
}

const formatCurrency = (amount: number): string => {
  return `৳${amount.toLocaleString("en-BD")}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reminder settings
    const { data: reminderSettings } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "installment_reminder")
      .maybeSingle();

    const reminderConfig: ReminderConfig = reminderSettings?.setting_value as ReminderConfig || {
      reminder_days_before: 3,
      send_sms: true,
      send_email: true,
      overdue_reminder_enabled: true,
      overdue_reminder_daily: false,
    };

    console.log("Reminder config:", reminderConfig);

    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(today.getDate() + reminderConfig.reminder_days_before);
    
    const todayStr = today.toISOString().split("T")[0];
    const reminderDateStr = reminderDate.toISOString().split("T")[0];

    console.log("EMI Reminder check - Today:", todayStr, "Reminder date:", reminderDateStr);

    // Find installments due within the reminder window
    const { data: upcomingInstallments, error: upcomingError } = await supabase
      .from("emi_installments")
      .select(`
        id,
        installment_number,
        amount,
        due_date,
        emi_payment_id
      `)
      .eq("status", "pending")
      .gte("due_date", todayStr)
      .lte("due_date", reminderDateStr);

    if (upcomingError) {
      console.error("Error fetching upcoming installments:", upcomingError);
      throw upcomingError;
    }

    // Find overdue installments
    let overdueInstallments: any[] = [];
    if (reminderConfig.overdue_reminder_enabled) {
      const { data: overdueData, error: overdueError } = await supabase
        .from("emi_installments")
        .select(`
          id,
          installment_number,
          amount,
          due_date,
          emi_payment_id
        `)
        .eq("status", "pending")
        .lt("due_date", todayStr);

      if (overdueError) {
        console.error("Error fetching overdue installments:", overdueError);
        throw overdueError;
      }
      
      overdueInstallments = overdueData || [];

      // Update overdue installments status
      if (overdueInstallments.length > 0) {
        const overdueIds = overdueInstallments.map(i => i.id);
        await supabase
          .from("emi_installments")
          .update({ status: "overdue" })
          .in("id", overdueIds);
      }
    }

    const allInstallments = [
      ...(upcomingInstallments || []).map(i => ({ ...i, type: "upcoming" })),
      ...overdueInstallments.map(i => ({ ...i, type: "overdue" })),
    ];

    console.log("Total installments to process:", allInstallments.length);

    if (allInstallments.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get EMI payments for booking info
    const emiPaymentIds = [...new Set(allInstallments.map(i => i.emi_payment_id))];
    const { data: emiPayments } = await supabase
      .from("emi_payments")
      .select("id, booking_id, number_of_emis, paid_emis, remaining_amount")
      .in("id", emiPaymentIds);

    if (!emiPayments) {
      return new Response(
        JSON.stringify({ message: "No EMI payments found", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get bookings for customer info
    const bookingIds = [...new Set(emiPayments.map(e => e.booking_id))];
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, guest_name, guest_email, guest_phone, user_id, package:packages(title)")
      .in("id", bookingIds);

    // Get user profiles for registered users
    const userIds = bookings?.filter(b => b.user_id).map(b => b.user_id) || [];
    let profiles: any[] = [];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, email, phone, full_name")
        .in("id", userIds);
      profiles = profileData || [];
    }

    // Check SMS notification settings
    let smsConfig: SMSConfig | null = null;
    if (reminderConfig.send_sms) {
      const { data: smsSettings } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("setting_type", "sms")
        .eq("is_enabled", true)
        .maybeSingle();

      if (smsSettings) {
        smsConfig = smsSettings.config as unknown as SMSConfig;
      }
    }

    // Check Email notification settings
    let emailConfig: EmailConfig | null = null;
    if (reminderConfig.send_email) {
      const { data: emailSettings } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("setting_type", "email")
        .eq("is_enabled", true)
        .maybeSingle();

      if (emailSettings) {
        emailConfig = emailSettings.config as unknown as EmailConfig;
      }
    }

    if (!smsConfig && !emailConfig) {
      console.log("No notification channels enabled");
      return new Response(
        JSON.stringify({ message: "No notification channels enabled", sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const installment of allInstallments) {
      const emiPayment = emiPayments.find(e => e.id === installment.emi_payment_id);
      if (!emiPayment) continue;

      const booking = bookings?.find(b => b.id === emiPayment.booking_id);
      if (!booking) continue;

      const profile = profiles.find(p => p.id === booking.user_id);
      const customerPhone = profile?.phone || booking.guest_phone;
      const customerEmail = profile?.email || booking.guest_email;
      const customerName = profile?.full_name || booking.guest_name || "Customer";
      const packageTitle = (booking.package as any)?.title || "Package";

      const bookingIdShort = booking.id.slice(0, 8).toUpperCase();
      const dueDate = new Date(installment.due_date);
      const formattedDate = dueDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const isOverdue = installment.type === "overdue";
      const daysOverdue = isOverdue
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // SMS Notification
      if (smsConfig && customerPhone) {
        let smsMessage: string;
        if (isOverdue) {
          smsMessage = `⚠️ Dear ${customerName}, your installment #${installment.installment_number} of ${formatCurrency(installment.amount)} for ${packageTitle} is ${daysOverdue} days OVERDUE (was due ${formattedDate}). Please pay immediately. ID: ${bookingIdShort}. - SM Elite Hajj`;
        } else {
          smsMessage = `⏰ Dear ${customerName}, reminder: Installment #${installment.installment_number} of ${formatCurrency(installment.amount)} for ${packageTitle} is due on ${formattedDate}. Please pay on time. ID: ${bookingIdShort}. - SM Elite Hajj`;
        }

        console.log(`Sending ${isOverdue ? 'OVERDUE' : 'REMINDER'} SMS to:`, customerPhone);
        
        const smsResult = await sendBulkSMS(smsConfig.api_key, smsConfig.sender_id, customerPhone, smsMessage);

        if (smsResult.success) {
          sentCount++;
          await supabase.from("notification_logs").insert({
            booking_id: booking.id,
            notification_type: isOverdue ? "sms_customer_emi_overdue" : "sms_customer_emi_reminder",
            recipient: customerPhone,
            status: "sent",
          });
          console.log("SMS sent successfully to:", customerPhone);
        } else {
          failedCount++;
          await supabase.from("notification_logs").insert({
            booking_id: booking.id,
            notification_type: isOverdue ? "sms_customer_emi_overdue" : "sms_customer_emi_reminder",
            recipient: customerPhone,
            status: "failed",
            error_message: smsResult.error,
          });
          console.error("SMS failed for:", customerPhone, smsResult.error);
        }
      }

      // Email Notification
      if (emailConfig && customerEmail) {
        const emailSubject = isOverdue 
          ? `⚠️ OVERDUE: Installment Payment Required - ${packageTitle}`
          : `📅 Payment Reminder: Installment Due - ${packageTitle}`;

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: ${isOverdue ? '#dc2626' : '#059669'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .amount { font-size: 24px; font-weight: bold; color: ${isOverdue ? '#dc2626' : '#059669'}; }
              .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .btn { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${isOverdue ? '⚠️ Overdue Payment Alert' : '📅 Payment Reminder'}</h2>
              </div>
              <div class="content">
                <p>Assalamu Alaikum <strong>${customerName}</strong>,</p>
                ${isOverdue 
                  ? `<p>Your installment payment is <strong>${daysOverdue} days overdue</strong>. Please make the payment immediately to avoid any inconvenience.</p>`
                  : `<p>This is a friendly reminder that your upcoming installment payment is due soon.</p>`
                }
                <div class="details">
                  <p><strong>Package:</strong> ${packageTitle}</p>
                  <p><strong>Installment #:</strong> ${installment.installment_number} of ${emiPayment.number_of_emis}</p>
                  <p><strong>Due Date:</strong> ${formattedDate}</p>
                  <p><strong>Amount Due:</strong> <span class="amount">${formatCurrency(installment.amount)}</span></p>
                  <p><strong>Booking ID:</strong> ${bookingIdShort}</p>
                  <p><strong>Remaining Balance:</strong> ${formatCurrency(emiPayment.remaining_amount)}</p>
                </div>
                <p>Please visit our office or use our online payment system to complete your payment.</p>
              </div>
              <div class="footer">
                <p>SM Elite Hajj Travel Agency Limited</p>
                <p>Thank you for choosing us for your sacred journey.</p>
              </div>
            </div>
          </body>
          </html>
        `;

        console.log(`Sending ${isOverdue ? 'OVERDUE' : 'REMINDER'} Email to:`, customerEmail);
        
        const emailResult = await sendEmail(emailConfig, customerEmail, emailSubject, emailHtml);

        if (emailResult.success) {
          sentCount++;
          await supabase.from("notification_logs").insert({
            booking_id: booking.id,
            notification_type: isOverdue ? "email_customer_emi_overdue" : "email_customer_emi_reminder",
            recipient: customerEmail,
            status: "sent",
          });
          console.log("Email sent successfully to:", customerEmail);
        } else {
          failedCount++;
          await supabase.from("notification_logs").insert({
            booking_id: booking.id,
            notification_type: isOverdue ? "email_customer_emi_overdue" : "email_customer_emi_reminder",
            recipient: customerEmail,
            status: "failed",
            error_message: emailResult.error,
          });
          console.error("Email failed for:", customerEmail, emailResult.error);
        }
      }
    }

    console.log(`EMI reminders completed. Sent: ${sentCount}, Failed: ${failedCount}`);

    return new Response(
      JSON.stringify({
        message: "EMI reminders processed",
        sent: sentCount,
        failed: failedCount,
        upcoming: upcomingInstallments?.length || 0,
        overdue: overdueInstallments?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in EMI reminder function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
