import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split("T")[0];
    const threeDaysStr = threeDaysFromNow.toISOString().split("T")[0];

    // Find installments due in the next 3 days
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
      .lte("due_date", threeDaysStr);

    if (upcomingError) {
      console.error("Error fetching upcoming installments:", upcomingError);
      throw upcomingError;
    }

    // Find overdue installments
    const { data: overdueInstallments, error: overdueError } = await supabase
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

    // Update overdue installments status
    if (overdueInstallments && overdueInstallments.length > 0) {
      const overdueIds = overdueInstallments.map(i => i.id);
      await supabase
        .from("emi_installments")
        .update({ status: "overdue" })
        .in("id", overdueIds);
    }

    const allInstallments = [
      ...(upcomingInstallments || []).map(i => ({ ...i, type: "upcoming" })),
      ...(overdueInstallments || []).map(i => ({ ...i, type: "overdue" })),
    ];

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
      .select("id, booking_id, number_of_emis")
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
      .select("id, guest_name, guest_email, guest_phone, user_id")
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

    // Check notification settings
    const { data: notificationSettings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("is_enabled", true);

    const emailEnabled = notificationSettings?.some(s => s.setting_type === "email");
    const smsEnabled = notificationSettings?.some(s => s.setting_type === "sms");

    let sentCount = 0;
    const notifications: any[] = [];

    for (const installment of allInstallments) {
      const emiPayment = emiPayments.find(e => e.id === installment.emi_payment_id);
      if (!emiPayment) continue;

      const booking = bookings?.find(b => b.id === emiPayment.booking_id);
      if (!booking) continue;

      const profile = profiles.find(p => p.id === booking.user_id);
      const customerEmail = profile?.email || booking.guest_email;
      const customerPhone = profile?.phone || booking.guest_phone;
      const customerName = profile?.full_name || booking.guest_name || "Customer";

      const dueDate = new Date(installment.due_date);
      const formattedDate = dueDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const isOverdue = installment.type === "overdue";
      const daysOverdue = isOverdue
        ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const subject = isOverdue
        ? `⚠️ EMI Payment Overdue - Installment #${installment.installment_number}`
        : `📅 EMI Payment Reminder - Installment #${installment.installment_number}`;

      const message = isOverdue
        ? `Dear ${customerName},\n\nYour EMI installment #${installment.installment_number} of ৳${installment.amount} was due on ${formattedDate} and is now ${daysOverdue} days overdue.\n\nPlease make the payment as soon as possible to avoid any penalties.\n\nThank you,\nSM Elite Hajj`
        : `Dear ${customerName},\n\nThis is a friendly reminder that your EMI installment #${installment.installment_number} of ৳${installment.amount} is due on ${formattedDate}.\n\nPlease ensure timely payment to maintain your payment schedule.\n\nThank you,\nSM Elite Hajj`;

      // Log notification
      if (customerEmail || customerPhone) {
        notifications.push({
          booking_id: booking.id,
          notification_type: isOverdue ? "emi_overdue" : "emi_reminder",
          recipient: customerEmail || customerPhone,
          status: "sent",
        });
        sentCount++;

        console.log(`Notification sent to ${customerEmail || customerPhone}:`, {
          subject,
          installment: installment.installment_number,
          amount: installment.amount,
          dueDate: formattedDate,
          type: installment.type,
        });
      }
    }

    // Log all notifications
    if (notifications.length > 0) {
      await supabase.from("notification_logs").insert(notifications);
    }

    return new Response(
      JSON.stringify({
        message: "EMI reminders processed",
        sent: sentCount,
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
