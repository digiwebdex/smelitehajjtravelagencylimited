import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MessageSquare, Settings, History, Loader2, Eye, EyeOff, Send, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

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

interface NotificationSetting {
  id: string;
  setting_type: string;
  is_enabled: boolean;
  config: SMSConfig | EmailConfig;
}

interface NotificationLog {
  id: string;
  booking_id: string;
  notification_type: string;
  recipient: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

const AdminNotifications = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [smsSettings, setSmsSettings] = useState<NotificationSetting | null>(null);
  const [emailSettings, setEmailSettings] = useState<NotificationSetting | null>(null);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [showSmsApiKey, setShowSmsApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*");

      if (error) throw error;

      const sms = data?.find(s => s.setting_type === "sms");
      const email = data?.find(s => s.setting_type === "email");

      if (sms) setSmsSettings({ ...sms, config: sms.config as unknown as SMSConfig });
      if (email) setEmailSettings({ ...email, config: email.config as unknown as EmailConfig });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load notification settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
    }
  };

  const saveSmsSettings = async () => {
    if (!smsSettings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_settings")
        .update({
          is_enabled: smsSettings.is_enabled,
          config: smsSettings.config as any,
        })
        .eq("id", smsSettings.id);

      if (error) throw error;
      toast.success("SMS settings saved successfully");
    } catch (error: any) {
      console.error("Error saving SMS settings:", error);
      toast.error("Failed to save SMS settings");
    } finally {
      setSaving(false);
    }
  };

  const saveEmailSettings = async () => {
    if (!emailSettings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("notification_settings")
        .update({
          is_enabled: emailSettings.is_enabled,
          config: emailSettings.config as any,
        })
        .eq("id", emailSettings.id);

      if (error) throw error;
      toast.success("Email settings saved successfully");
    } catch (error: any) {
      console.error("Error saving email settings:", error);
      toast.error("Failed to save email settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSmsConfig = (key: keyof SMSConfig, value: string) => {
    if (!smsSettings) return;
    setSmsSettings({
      ...smsSettings,
      config: { ...(smsSettings.config as SMSConfig), [key]: value },
    });
  };

  const updateEmailConfig = (key: keyof EmailConfig, value: string | number) => {
    if (!emailSettings) return;
    setEmailSettings({
      ...emailSettings,
      config: { ...(emailSettings.config as EmailConfig), [key]: value },
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Sent</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
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
    <div className="space-y-6">
      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS Settings
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Settings
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Notification Logs
          </TabsTrigger>
        </TabsList>

        {/* SMS Settings Tab */}
        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Bulk SMS Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Bulk SMS API to send booking confirmations via SMS
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sms-enabled">Enable SMS</Label>
                  <Switch
                    id="sms-enabled"
                    checked={smsSettings?.is_enabled || false}
                    onCheckedChange={(checked) =>
                      setSmsSettings(prev => prev ? { ...prev, is_enabled: checked } : null)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sms-api-url">API URL</Label>
                  <Input
                    id="sms-api-url"
                    placeholder="https://api.bulksms.com/v1/messages"
                    value={(smsSettings?.config as SMSConfig)?.api_url || ""}
                    onChange={(e) => updateSmsConfig("api_url", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-sender-id">Sender ID</Label>
                  <Input
                    id="sms-sender-id"
                    placeholder="YourCompany"
                    value={(smsSettings?.config as SMSConfig)?.sender_id || ""}
                    onChange={(e) => updateSmsConfig("sender_id", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-api-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="sms-api-key"
                    type={showSmsApiKey ? "text" : "password"}
                    placeholder="Enter your Bulk SMS API key"
                    value={(smsSettings?.config as SMSConfig)?.api_key || ""}
                    onChange={(e) => updateSmsConfig("api_key", e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSmsApiKey(!showSmsApiKey)}
                  >
                    {showSmsApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={saveSmsSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                  Save SMS Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings Tab */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    SMTP Email Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your SMTP server to send booking confirmation emails
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="email-enabled">Enable Email</Label>
                  <Switch
                    id="email-enabled"
                    checked={emailSettings?.is_enabled || false}
                    onCheckedChange={(checked) =>
                      setEmailSettings(prev => prev ? { ...prev, is_enabled: checked } : null)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.gmail.com"
                    value={(emailSettings?.config as EmailConfig)?.smtp_host || ""}
                    onChange={(e) => updateEmailConfig("smtp_host", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">SMTP Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={(emailSettings?.config as EmailConfig)?.smtp_port || 587}
                    onChange={(e) => updateEmailConfig("smtp_port", parseInt(e.target.value) || 587)}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">SMTP Username</Label>
                  <Input
                    id="smtp-user"
                    placeholder="your-email@gmail.com"
                    value={(emailSettings?.config as EmailConfig)?.smtp_user || ""}
                    onChange={(e) => updateEmailConfig("smtp_user", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-password">SMTP Password</Label>
                  <div className="relative">
                    <Input
                      id="smtp-password"
                      type={showSmtpPassword ? "text" : "password"}
                      placeholder="Enter SMTP password or app password"
                      value={(emailSettings?.config as EmailConfig)?.smtp_password || ""}
                      onChange={(e) => updateEmailConfig("smtp_password", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from-email">From Email</Label>
                  <Input
                    id="from-email"
                    type="email"
                    placeholder="noreply@yourcompany.com"
                    value={(emailSettings?.config as EmailConfig)?.from_email || ""}
                    onChange={(e) => updateEmailConfig("from_email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from-name">From Name</Label>
                  <Input
                    id="from-name"
                    placeholder="Your Company Name"
                    value={(emailSettings?.config as EmailConfig)?.from_name || ""}
                    onChange={(e) => updateEmailConfig("from_name", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={saveEmailSettings} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings className="h-4 w-4 mr-2" />}
                  Save Email Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Notification History
              </CardTitle>
              <CardDescription>
                View all sent and failed notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notifications sent yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {log.notification_type === "sms" ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Mail className="h-3 w-3" />
                            )}
                            {log.notification_type.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                          {log.error_message || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotifications;
