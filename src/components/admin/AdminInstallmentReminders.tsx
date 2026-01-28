import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Settings, Loader2, Clock, Calendar, AlertTriangle, Play } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ReminderConfig {
  reminder_days_before: number;
  send_sms: boolean;
  send_email: boolean;
  overdue_reminder_enabled: boolean;
  overdue_reminder_daily: boolean;
}

const AdminInstallmentReminders = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settingId, setSettingId] = useState<string | null>(null);
  const [config, setConfig] = useState<ReminderConfig>({
    reminder_days_before: 3,
    send_sms: true,
    send_email: true,
    overdue_reminder_enabled: true,
    overdue_reminder_daily: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("setting_key", "installment_reminder")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingId(data.id);
        const settingValue = data.setting_value as unknown as ReminderConfig;
        setConfig({
          reminder_days_before: settingValue?.reminder_days_before ?? 3,
          send_sms: settingValue?.send_sms ?? true,
          send_email: settingValue?.send_email ?? true,
          overdue_reminder_enabled: settingValue?.overdue_reminder_enabled ?? true,
          overdue_reminder_daily: settingValue?.overdue_reminder_daily ?? false,
        });
      }
    } catch (error: any) {
      console.error("Error fetching reminder settings:", error);
      toast.error("Failed to load reminder settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      if (settingId) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: config as any })
          .eq("id", settingId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("site_settings")
          .insert({
            setting_key: "installment_reminder",
            category: "notifications",
            setting_value: config as any,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettingId(data.id);
      }

      toast.success("Reminder settings saved successfully");
    } catch (error: any) {
      console.error("Error saving reminder settings:", error);
      toast.error("Failed to save reminder settings");
    } finally {
      setSaving(false);
    }
  };

  const runManualReminder = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("emi-reminder");
      
      if (error) throw error;

      toast.success(
        `Reminders sent: ${data?.sent || 0} sent, ${data?.failed || 0} failed. Upcoming: ${data?.upcoming || 0}, Overdue: ${data?.overdue || 0}`
      );
    } catch (error: any) {
      console.error("Error running manual reminder:", error);
      toast.error("Failed to run manual reminder check");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Installment Reminder Settings
            </CardTitle>
            <CardDescription>
              Configure automatic SMS and email reminders for upcoming installment payments
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reminder Timing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Reminder Schedule
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="days-before">Days Before Due Date</Label>
              <Input
                id="days-before"
                type="number"
                min="1"
                max="30"
                value={config.reminder_days_before}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    reminder_days_before: parseInt(e.target.value) || 3,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Send reminder this many days before the due date
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Channels */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Notification Channels
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send SMS reminders to customers</p>
                </div>
              </div>
              <Switch
                checked={config.send_sms}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, send_sms: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send email reminders to customers</p>
                </div>
              </div>
              <Switch
                checked={config.send_email}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, send_email: checked }))
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Overdue Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Overdue Payment Alerts
          </h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Overdue Reminders</Label>
                  <p className="text-xs text-muted-foreground">Alert customers about overdue payments</p>
                </div>
              </div>
              <Switch
                checked={config.overdue_reminder_enabled}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, overdue_reminder_enabled: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-destructive" />
                <div>
                  <Label>Daily Overdue Alerts</Label>
                  <p className="text-xs text-muted-foreground">Send daily reminder for overdue payments</p>
                </div>
              </div>
              <Switch
                checked={config.overdue_reminder_daily}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, overdue_reminder_daily: checked }))
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Information Box */}
        <div className="bg-muted border border-border rounded-lg p-4">
          <h4 className="font-medium text-foreground mb-2">Automatic Reminder System</h4>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>Reminders are sent automatically every day at 9:00 AM (Bangladesh Time)</li>
            <li>Customers will receive notifications {config.reminder_days_before} days before their due date</li>
            <li>Overdue payments will be marked automatically and customers will be notified</li>
            <li>Make sure SMS and Email settings are configured in the SMS/Email tabs</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
          <Button variant="outline" onClick={runManualReminder} disabled={testing}>
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Run Reminder Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminInstallmentReminders;
