import { useQuery } from '@tanstack/react-query';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Activity,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/currency';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const AdminMarketingAnalytics = () => {
  // Fetch leads data
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['marketing-analytics-leads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch event logs
  const { data: eventLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['marketing-event-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketing_event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const isLoading = leadsLoading || logsLoading;

  // Calculate stats
  const thisMonth = new Date();
  const thisMonthStart = startOfMonth(thisMonth);
  const thisMonthEnd = endOfMonth(thisMonth);

  const monthlyLeads = leads.filter(lead => {
    const createdAt = new Date(lead.created_at);
    return createdAt >= thisMonthStart && createdAt <= thisMonthEnd;
  });

  const convertedLeads = leads.filter(l => l.lead_status === 'Converted');
  const totalRevenue = convertedLeads.reduce((sum, l) => sum + (l.payment_value || 0), 0);
  const conversionRate = leads.length > 0 
    ? ((convertedLeads.length / leads.length) * 100).toFixed(1) 
    : '0';

  // Monthly leads chart data (last 6 months)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const count = leads.filter(lead => {
      const createdAt = new Date(lead.created_at);
      return createdAt >= start && createdAt <= end;
    }).length;
    return {
      month: format(date, 'MMM'),
      leads: count,
    };
  });

  // Source breakdown data
  const sourceData = [
    { name: 'Facebook', value: leads.filter(l => l.fbclid).length },
    { name: 'Google', value: leads.filter(l => l.utm_source?.toLowerCase().includes('google')).length },
    { name: 'Direct', value: leads.filter(l => !l.fbclid && !l.utm_source).length },
    { name: 'Other', value: leads.filter(l => l.utm_source && !l.utm_source.toLowerCase().includes('google') && !l.fbclid).length },
  ].filter(s => s.value > 0);

  // Score distribution
  const scoreDistribution = [
    { range: '0-20', count: leads.filter(l => l.lead_score <= 20).length },
    { range: '21-40', count: leads.filter(l => l.lead_score > 20 && l.lead_score <= 40).length },
    { range: '41-60', count: leads.filter(l => l.lead_score > 40 && l.lead_score <= 60).length },
    { range: '61-80', count: leads.filter(l => l.lead_score > 60 && l.lead_score <= 80).length },
    { range: '81-100', count: leads.filter(l => l.lead_score > 80).length },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Marketing Analytics
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Track your marketing performance and lead conversions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month Leads</p>
                <p className="text-3xl font-bold">{monthlyLeads.length}</p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-3xl font-bold">{convertedLeads.length}</p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Target className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">{conversionRate}%</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Leads Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="range" type="category" className="text-xs" width={60} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Event Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Facebook API Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventLogs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No event logs yet. Events will appear here once leads are submitted.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Event ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.event_type}</TableCell>
                    <TableCell className="font-mono text-xs">{log.event_id.slice(0, 20)}...</TableCell>
                    <TableCell>
                      <Badge 
                        variant={log.status === 'success' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketingAnalytics;
