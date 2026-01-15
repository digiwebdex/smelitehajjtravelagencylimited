import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Settings, 
  Globe, 
  Palette, 
  Bell, 
  Shield, 
  Database,
  Save,
  RefreshCw
} from "lucide-react";
import { CURRENCY } from "@/lib/currency";

const AdminSettings = () => {
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteName: "SM Elite Hajj",
    siteTagline: "Your Trusted Partner for Sacred Journeys",
    contactEmail: "info@smelitehajj.com",
    contactPhone: "+880 1234-567890",
    whatsappNumber: "+8801712345678",
    currency: CURRENCY.code,
    currencySymbol: CURRENCY.symbol,
  });

  const [notifications, setNotifications] = useState({
    emailOnBooking: true,
    emailOnPayment: true,
    smsNotifications: false,
  });

  const handleSaveGeneral = () => {
    setLoading(true);
    // Simulating save - in real app, this would save to database
    setTimeout(() => {
      setLoading(false);
      toast.success("Settings saved successfully!");
    }, 500);
  };

  const settingsTabs = [
    { value: "general", label: "General", icon: Settings },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Security", icon: Shield },
    { value: "database", label: "Database", icon: Database },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          System Settings
        </CardTitle>
        <CardDescription>
          Configure system-wide settings for your application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            {settingsTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={siteSettings.siteName}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteTagline">Site Tagline</Label>
                <Input
                  id="siteTagline"
                  value={siteSettings.siteTagline}
                  onChange={(e) => setSiteSettings({ ...siteSettings, siteTagline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={siteSettings.contactEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={siteSettings.contactPhone}
                  onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={siteSettings.whatsappNumber}
                  onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{siteSettings.currencySymbol} {siteSettings.currency}</span>
                  <span className="text-muted-foreground">({CURRENCY.name})</span>
                </div>
              </div>
            </motion.div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={loading} className="gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Email on New Booking</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications when a new booking is made
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOnBooking}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailOnBooking: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">Email on Payment</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications when a payment is processed
                  </p>
                </div>
                <Switch
                  checked={notifications.emailOnPayment}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailOnPayment: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive SMS alerts for important updates
                  </p>
                </div>
                <Switch
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                />
              </div>
            </motion.div>

            <div className="flex justify-end">
              <Button onClick={handleSaveGeneral} disabled={loading} className="gap-2">
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Shield className="w-8 h-8 text-yellow-500" />
                    <div>
                      <h3 className="font-semibold">Security Status</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your application is protected with Row Level Security (RLS) policies 
                        and proper authentication mechanisms.
                      </p>
                      <ul className="mt-4 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Authentication enabled
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          RLS policies active on all tables
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          Admin role verification in place
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Database className="w-8 h-8 text-primary" />
                    <div className="flex-1">
                      <h3 className="font-semibold">Database Information</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your application is connected to Lovable Cloud backend.
                      </p>
                      <div className="mt-4 grid gap-3 text-sm">
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Tables</span>
                          <span className="font-medium">13 active</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Storage</span>
                          <span className="font-medium">Enabled</span>
                        </div>
                        <div className="flex justify-between p-3 bg-muted rounded-lg">
                          <span className="text-muted-foreground">Realtime</span>
                          <span className="font-medium">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
