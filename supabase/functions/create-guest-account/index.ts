import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAccountRequest {
  bookingId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
}

interface WhatsAppConfig {
  provider: string;
  account_sid: string;
  auth_token: string;
  from_number: string;
  message_template: string;
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

// Generate a secure random password
const generateSecurePassword = (): string => {
  const length = 12;
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghjkmnpqrstuvwxyz";
  const numbers = "23456789";
  const special = "!@#$%";
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("");
};

// Create email from phone number
const phoneToEmail = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, "");
  return `${cleaned}@smelitehajj.user.com`;
};

// Format phone number for WhatsApp
const formatWhatsAppNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "880" + cleaned.substring(1);
  }
  return `whatsapp:+${cleaned}`;
};

const handler = async (req: Request): Promise<Response> => {
  console.log("create-guest-account function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, guestName, guestPhone, guestEmail }: CreateAccountRequest = await req.json();
    console.log("Creating account for booking:", bookingId, "Phone:", guestPhone);

    if (!guestPhone) {
      return new Response(
        JSON.stringify({ success: false, message: "Phone number is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate email from phone if not provided
    const email = guestEmail?.trim() || phoneToEmail(guestPhone);
    const password = generateSecurePassword();

    console.log("Generated email:", email);

    // Check if user already exists with this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log("User already exists with email:", email);
      
      // Update booking with user_id if not already set
      await supabase
        .from("bookings")
        .update({ user_id: existingUser.id })
        .eq("id", bookingId)
        .is("user_id", null);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User already exists", 
          userId: existingUser.id,
          isNew: false 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create new user account
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: guestName,
        phone: guestPhone,
      },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    console.log("User created successfully:", newUser.user?.id);

    // Update booking with the new user_id
    if (newUser.user) {
      await supabase
        .from("bookings")
        .update({ user_id: newUser.user.id })
        .eq("id", bookingId);
    }

    // Now send credentials via SMS/WhatsApp and Email
    const credentialsMessage = `🎉 SM Elite Hajj Account Created!\n\nDear ${guestName},\n\nYour account has been created automatically.\n\n📧 Login Email: ${email}\n🔐 Password: ${password}\n\nPlease save these credentials and change your password after first login.\n\nThank you for booking with us! 🕋`;

    // Fetch notification settings
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("*");

    const whatsappSettings = settings?.find(s => s.setting_type === "whatsapp");
    const smsSettings = settings?.find(s => s.setting_type === "sms");
    const emailSettings = settings?.find(s => s.setting_type === "email");

    const notificationResults = {
      whatsapp: { sent: false, error: null as string | null },
      sms: { sent: false, error: null as string | null },
      email: { sent: false, error: null as string | null },
    };

    // Send via WhatsApp if enabled
    if (whatsappSettings?.is_enabled) {
      try {
        const whatsappConfig = whatsappSettings.config as unknown as WhatsAppConfig;
        const toNumber = formatWhatsAppNumber(guestPhone);
        
        console.log("Sending WhatsApp to:", toNumber);

        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${whatsappConfig.account_sid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append("To", toNumber);
        formData.append("From", whatsappConfig.from_number);
        formData.append("Body", credentialsMessage);

        const authHeader = btoa(`${whatsappConfig.account_sid}:${whatsappConfig.auth_token}`);

        const whatsappResponse = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${authHeader}`,
          },
          body: formData.toString(),
        });

        if (whatsappResponse.ok) {
          notificationResults.whatsapp.sent = true;
          console.log("WhatsApp sent successfully");
        } else {
          const errorData = await whatsappResponse.json();
          throw new Error(errorData.message || "WhatsApp API error");
        }
      } catch (err: any) {
        console.error("WhatsApp error:", err);
        notificationResults.whatsapp.error = err.message;
      }
    }

    // Send via SMS if enabled
    if (smsSettings?.is_enabled) {
      try {
        const smsConfig = smsSettings.config as unknown as SMSConfig;
        console.log("Sending SMS to:", guestPhone);

        const smsResponse = await fetch(smsConfig.api_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${smsConfig.api_key}`,
          },
          body: JSON.stringify({
            to: guestPhone,
            from: smsConfig.sender_id,
            message: credentialsMessage,
          }),
        });

        if (smsResponse.ok) {
          notificationResults.sms.sent = true;
          console.log("SMS sent successfully");
        } else {
          const errorText = await smsResponse.text();
          throw new Error(`SMS API error: ${errorText}`);
        }
      } catch (err: any) {
        console.error("SMS error:", err);
        notificationResults.sms.error = err.message;
      }
    }

    // Send via Email if enabled and email exists
    if (emailSettings?.is_enabled && guestEmail) {
      try {
        const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
        const emailConfig = emailSettings.config as unknown as EmailConfig;
        
        console.log("Sending email to:", guestEmail);

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

        await client.send({
          from: `${emailConfig.from_name} <${emailConfig.from_email}>`,
          to: guestEmail,
          subject: "Your SM Elite Hajj Account Credentials",
          content: credentialsMessage,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Account Created</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #d4a853, #c4963e); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4a853; }
                .credential-item { padding: 10px 0; }
                .label { font-weight: bold; color: #666; }
                .value { font-size: 18px; font-family: monospace; background: #f0f0f0; padding: 5px 10px; border-radius: 4px; }
                .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Account Created!</h1>
                  <p>Welcome to SM Elite Hajj</p>
                </div>
                <div class="content">
                  <p>Dear ${guestName},</p>
                  <p>Your account has been created automatically after your booking. Here are your login credentials:</p>
                  
                  <div class="credentials">
                    <div class="credential-item">
                      <p class="label">📧 Login Email:</p>
                      <p class="value">${email}</p>
                    </div>
                    <div class="credential-item">
                      <p class="label">🔐 Password:</p>
                      <p class="value">${password}</p>
                    </div>
                  </div>
                  
                  <div class="warning">
                    <strong>⚠️ Important:</strong> Please save these credentials securely and change your password after your first login.
                  </div>
                  
                  <p>You can now log in to view your bookings, track your order, and manage your account.</p>
                  <p>Thank you for choosing SM Elite Hajj for your spiritual journey! 🕋</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply directly to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });

        await client.close();
        notificationResults.email.sent = true;
        console.log("Email sent successfully");
      } catch (err: any) {
        console.error("Email error:", err);
        notificationResults.email.error = err.message;
      }
    }

    // Log notification
    await supabase.from("notification_logs").insert({
      booking_id: bookingId,
      notification_type: "account_credentials",
      recipient: guestPhone,
      status: notificationResults.whatsapp.sent || notificationResults.sms.sent || notificationResults.email.sent ? "sent" : "failed",
      error_message: !notificationResults.whatsapp.sent && !notificationResults.sms.sent && !notificationResults.email.sent 
        ? "All notification channels failed" 
        : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created and credentials sent",
        userId: newUser.user?.id,
        isNew: true,
        notifications: notificationResults,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-guest-account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
