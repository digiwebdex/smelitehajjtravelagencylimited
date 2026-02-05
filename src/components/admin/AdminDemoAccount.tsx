import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useViewerMode } from "@/contexts/ViewerModeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, UserPlus, Copy, Check, RefreshCw, Lock } from "lucide-react";
import { AdminActionButton } from "./AdminActionButton";

interface DemoAccountInfo {
  email: string;
  password: string;
}

const AdminDemoAccount = () => {
  const { toast } = useToast();
  const { isViewerMode } = useViewerMode();
  const [creating, setCreating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [demoAccount, setDemoAccount] = useState<DemoAccountInfo>({
    email: "demo@smelitehajj.com",
    password: "SmElite#Hajj@2025!Secure",
  });
  const [formData, setFormData] = useState({
    email: "demo@smelitehajj.com",
    password: "SmElite#Hajj@2025!Secure",
    full_name: "Demo Viewer",
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
  };

  const handleCreateDemoUser = async () => {
    if (isViewerMode) {
      toast({
        title: "Demo Mode",
        description: "Cannot create users in demo mode",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        toast({
          title: "Error",
          description: "You must be logged in as an admin to create demo users",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke("create-demo-user", {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setDemoAccount({
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: "Demo Account Created",
        description: "The demo viewer account has been created successfully",
      });
    } catch (error) {
      console.error("Error creating demo user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create demo user",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Demo Account for Client Presentations
        </CardTitle>
        <CardDescription>
          Create a read-only demo account to showcase the admin panel to potential clients without giving them edit access.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Demo Credentials */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-primary">Demo Login Credentials</h4>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="flex gap-2">
                <Input 
                  value={demoAccount.email} 
                  readOnly 
                  className="font-mono text-sm bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(demoAccount.email, "Email")}
                >
                  {copiedField === "Email" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Password</Label>
              <div className="flex gap-2">
                <Input 
                  value={demoAccount.password} 
                  readOnly 
                  className="font-mono text-sm bg-muted"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(demoAccount.password, "Password")}
                >
                  {copiedField === "Password" ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Share these credentials with clients. They can view all admin data but cannot make any changes.
          </p>
        </div>

        {/* Create/Update Demo Account Form */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Create/Update Demo Account
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="demo-email">Email</Label>
              <Input
                id="demo-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="demo@smelitehajj.com"
                disabled={isViewerMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-password">Password</Label>
              <Input
                id="demo-password"
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Demo@2024"
                disabled={isViewerMode}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo-name">Display Name</Label>
              <Input
                id="demo-name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Demo Viewer"
                disabled={isViewerMode}
              />
            </div>
          </div>
          <AdminActionButton
            onClick={handleCreateDemoUser}
            disabled={creating}
            className="gap-2"
          >
            {creating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Demo Account
              </>
            )}
          </AdminActionButton>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <Lock className="w-4 h-4 mt-0.5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium">What can the demo account see?</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>All admin dashboard sections and data</li>
                <li>Bookings, packages, revenue, and analytics</li>
                <li>All settings and configuration options</li>
              </ul>
              <p className="font-medium mt-2">What is restricted?</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Cannot create, edit, or delete any data</li>
                <li>Cannot change settings or configurations</li>
                <li>Cannot manage other users or staff</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminDemoAccount;
