import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTenantPackages } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Target, Download, RefreshCw, Users, Eye, ShoppingCart, MessageSquare, Crown, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface AudienceSegment {
  id: string;
  segment_name: string;
  segment_type: string;
  criteria: any;
  lead_ids: string[];
  lead_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const segmentIcons: { [key: string]: any } = {
  viewed_no_lead: Eye,
  lead_no_payment: ShoppingCart,
  whatsapp_no_booking: MessageSquare,
  premium_interest: Crown,
  group_inquiry: Users,
};

const segmentDescriptions: { [key: string]: string } = {
  viewed_no_lead: "Users who viewed packages but did not submit lead form",
  lead_no_payment: "Leads who submitted form but have not paid",
  whatsapp_no_booking: "Users who clicked WhatsApp but did not book",
  premium_interest: "Users interested in premium or VIP packages",
  group_inquiry: "Users who submitted group inquiry form",
};

const AdminRetargetingSegments = () => {
  const { toast } = useToast();
  const [segments, setSegments] = useState<AudienceSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    const { data, error } = await supabase
      .from("audience_segments")
      .select("*")
      .order("segment_type", { ascending: true });

    if (!error && data) setSegments(data);
    setLoading(false);
  };

  const refreshSegment = async (segment: AudienceSegment) => {
    setRefreshing(true);
    let leadIds: string[] = [];

    try {
      switch (segment.segment_type) {
        case "lead_no_payment": {
          // Leads that are not converted
          const { data } = await supabase
            .from("leads")
            .select("id")
            .neq("lead_status", "Converted");
          leadIds = data?.map((l) => l.id) || [];
          break;
        }
        case "premium_interest": {
          // Leads interested in premium/VIP packages
          const { data: packages } = await getTenantPackages({
            select: "id",
            activeOnly: false,
          });
          
          if (packages && packages.length > 0) {
            const pkgIds = packages.map((p) => p.id);
            const { data } = await supabase
              .from("leads")
              .select("id")
              .in("package_id", pkgIds);
            leadIds = data?.map((l) => l.id) || [];
          }
          break;
        }
        case "group_inquiry": {
          // All group inquiries
          const { data } = await supabase
            .from("group_inquiries")
            .select("id");
          leadIds = data?.map((g) => g.id) || [];
          break;
        }
        default:
          // For other segments, keep empty for now (would need event tracking)
          leadIds = [];
      }

      // Update segment
      await supabase
        .from("audience_segments")
        .update({
          lead_ids: leadIds,
          lead_count: leadIds.length,
          updated_at: new Date().toISOString(),
        })
        .eq("id", segment.id);

      toast({ title: "Success", description: `Segment updated with ${leadIds.length} leads` });
      fetchSegments();
    } catch (error) {
      toast({ title: "Error", description: "Failed to refresh segment", variant: "destructive" });
    }

    setRefreshing(false);
  };

  const refreshAllSegments = async () => {
    for (const segment of segments) {
      await refreshSegment(segment);
    }
  };

  const toggleActive = async (segment: AudienceSegment) => {
    await supabase
      .from("audience_segments")
      .update({ is_active: !segment.is_active })
      .eq("id", segment.id);
    fetchSegments();
  };

  const exportSegment = async (segment: AudienceSegment) => {
    if (segment.lead_ids.length === 0) {
      toast({ title: "No data", description: "This segment has no leads to export", variant: "destructive" });
      return;
    }

    // Fetch lead details
    let leadData: any[] = [];
    
    if (segment.segment_type === "group_inquiry") {
      const { data } = await supabase
        .from("group_inquiries")
        .select("contact_name, contact_phone, contact_email, group_name")
        .in("id", segment.lead_ids);
      
      leadData = data?.map((g) => ({
        name: g.contact_name,
        phone: g.contact_phone,
        email: g.contact_email || "",
        group: g.group_name,
      })) || [];
    } else {
      const { data } = await supabase
        .from("leads")
        .select("name, phone, email")
        .in("id", segment.lead_ids);
      
      leadData = data?.map((l) => ({
        name: l.name,
        phone: l.phone,
        email: l.email || "",
      })) || [];
    }

    // Create CSV
    const headers = Object.keys(leadData[0] || {});
    const csvContent = [
      headers.join(","),
      ...leadData.map((row) => headers.map((h) => `"${row[h] || ""}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${segment.segment_name.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Success", description: `Exported ${leadData.length} leads` });
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Retargeting Audience Segments
            </CardTitle>
            <CardDescription>
              Auto-tagged audiences for Facebook Custom Audiences and retargeting campaigns
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={refreshAllSegments}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh All
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Segment</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Audience Size</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {segments.map((segment) => {
                const Icon = segmentIcons[segment.segment_type] || Target;
                return (
                  <TableRow key={segment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{segment.segment_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        {segmentDescriptions[segment.segment_type] || segment.criteria?.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={segment.lead_count > 0 ? "default" : "secondary"}>
                        {segment.lead_count} leads
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(segment.updated_at), "MMM d, yyyy h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={segment.is_active}
                        onCheckedChange={() => toggleActive(segment)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refreshSegment(segment)}
                          disabled={refreshing}
                        >
                          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => exportSegment(segment)}
                          disabled={segment.lead_count === 0}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {segments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No audience segments configured
            </p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How to Use These Segments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">1. Export to CSV</h4>
            <p className="text-muted-foreground">
              Click the download button to export leads from any segment. Use this CSV to create
              Facebook Custom Audiences.
            </p>
          </div>
          <div>
            <h4 className="font-medium">2. Facebook Custom Audiences</h4>
            <p className="text-muted-foreground">
              In Facebook Ads Manager, go to Audiences → Create Audience → Custom Audience →
              Customer List. Upload the exported CSV.
            </p>
          </div>
          <div>
            <h4 className="font-medium">3. Create Lookalike Audiences</h4>
            <p className="text-muted-foreground">
              Once you have a Custom Audience, create a Lookalike Audience to find similar
              high-value prospects.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRetargetingSegments;
