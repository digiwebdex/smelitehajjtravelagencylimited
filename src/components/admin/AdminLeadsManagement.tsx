import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Users,
  Search,
  Filter,
  Download,
  Phone,
  Mail,
  DollarSign,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  TrendingUp,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';
import { getScoreBadgeVariant, getStatusBadgeVariant } from '@/lib/leadScoring';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  package_id: string | null;
  travel_month: string | null;
  budget_range: string | null;
  passport_ready: boolean;
  group_size: number;
  message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  fbclid: string | null;
  lead_score: number;
  lead_status: string;
  original_event_id: string | null;
  payment_value: number | null;
  created_at: string;
  packages?: { title: string } | null;
}

const AdminLeadsManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { trackEvent } = useFacebookPixel();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [markPaidDialog, setMarkPaidDialog] = useState<{ open: boolean; lead: Lead | null }>({
    open: false,
    lead: null,
  });
  const [paymentValue, setPaymentValue] = useState('');

  // Fetch leads
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', statusFilter, sourceFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          packages:package_id (title)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('lead_status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        if (sourceFilter === 'Facebook') {
          query = query.not('fbclid', 'is', null);
        } else if (sourceFilter === 'Google') {
          query = query.ilike('utm_source', '%google%');
        } else if (sourceFilter === 'Organic') {
          query = query.is('utm_source', null).is('fbclid', null);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  // Update lead status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leads')
        .update({ lead_status: status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Status updated successfully' });
    },
    onError: (error) => {
      toast({ title: 'Failed to update status', variant: 'destructive' });
      console.error(error);
    },
  });

  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ lead, value }: { lead: Lead; value: number }) => {
      // Update lead status and payment value
      const { error } = await supabase
        .from('leads')
        .update({ 
          lead_status: 'Converted',
          payment_value: value 
        })
        .eq('id', lead.id);
      
      if (error) throw error;

      // Send Purchase event via Conversions API using original event_id
      if (lead.original_event_id) {
        await supabase.functions.invoke('fb-event', {
          body: {
            event_name: 'Purchase',
            event_id: lead.original_event_id,
            event_source_url: window.location.origin,
            user_data: {
              email: lead.email,
              phone: lead.phone,
            },
            custom_data: {
              value: value,
              currency: 'BDT',
              content_name: lead.packages?.title || 'Lead Conversion',
            },
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({ title: 'Lead marked as paid and Purchase event sent!' });
      setMarkPaidDialog({ open: false, lead: null });
      setPaymentValue('');
    },
    onError: (error) => {
      toast({ title: 'Failed to mark as paid', variant: 'destructive' });
      console.error(error);
    },
  });

  // Filter leads by search term
  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchLower) ||
      (lead.email && lead.email.toLowerCase().includes(searchLower))
    );
  });

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.lead_status === 'New').length,
    contacted: leads.filter(l => l.lead_status === 'Contacted').length,
    converted: leads.filter(l => l.lead_status === 'Converted').length,
    lost: leads.filter(l => l.lead_status === 'Lost').length,
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Package', 'Travel Month', 'Budget', 'Group Size', 'Score', 'Status', 'Source', 'Created'];
    const rows = filteredLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.email || '',
      lead.packages?.title || '',
      lead.travel_month || '',
      lead.budget_range || '',
      lead.group_size,
      lead.lead_score,
      lead.lead_status,
      lead.utm_source || (lead.fbclid ? 'Facebook' : 'Direct'),
      format(new Date(lead.created_at), 'yyyy-MM-dd'),
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceLabel = (lead: Lead): string => {
    if (lead.fbclid) return 'Facebook';
    if (lead.utm_source?.toLowerCase().includes('google')) return 'Google';
    if (lead.utm_source) return lead.utm_source;
    return 'Direct';
  };

  const handleMarkAsPaid = () => {
    if (!markPaidDialog.lead || !paymentValue) return;
    markAsPaidMutation.mutate({
      lead: markPaidDialog.lead,
      value: parseFloat(paymentValue),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Lead Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and track your marketing leads
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-500">{stats.contacted}</div>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">{stats.converted}</div>
            <p className="text-xs text-muted-foreground">Converted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-500">{stats.lost}</div>
            <p className="text-xs text-muted-foreground">Lost</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Converted">Converted</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Facebook">Facebook</SelectItem>
            <SelectItem value="Google">Google</SelectItem>
            <SelectItem value="Organic">Direct/Organic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No leads found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead</TableHead>
                  <TableHead className="hidden md:table-cell">Package</TableHead>
                  <TableHead className="hidden lg:table-cell">Travel</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Source</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">
                        {lead.packages?.title || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {lead.travel_month ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(lead.travel_month), 'MMM yyyy')}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreBadgeVariant(lead.lead_score)}>
                        {lead.lead_score}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lead.lead_status)}>
                        {lead.lead_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-sm">{getSourceLabel(lead)}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(lead.created_at), 'MMM d, yyyy')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'Contacted' })}
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Mark Contacted
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setMarkPaidDialog({ open: true, lead })}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Mark as Paid
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: lead.id, status: 'Lost' })}
                            className="text-destructive"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Mark as Lost
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Mark as Paid Dialog */}
      <Dialog open={markPaidDialog.open} onOpenChange={(open) => setMarkPaidDialog({ open, lead: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Lead as Paid</DialogTitle>
            <DialogDescription>
              Enter the payment amount to convert this lead and send a Purchase event to Facebook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Lead Name</Label>
              <p className="text-sm font-medium">{markPaidDialog.lead?.name}</p>
            </div>
            <div>
              <Label>Package</Label>
              <p className="text-sm">{markPaidDialog.lead?.packages?.title || 'Not specified'}</p>
            </div>
            <div>
              <Label htmlFor="payment-value">Payment Amount (BDT) *</Label>
              <Input
                id="payment-value"
                type="number"
                placeholder="e.g. 250000"
                value={paymentValue}
                onChange={(e) => setPaymentValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMarkPaidDialog({ open: false, lead: null })}>
              Cancel
            </Button>
            <Button 
              onClick={handleMarkAsPaid}
              disabled={!paymentValue || markAsPaidMutation.isPending}
            >
              {markAsPaidMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirm & Send Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadsManagement;
