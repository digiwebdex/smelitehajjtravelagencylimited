import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay } from "date-fns";
import {
  Activity,
  Users,
  Eye,
  Globe2,
  Smartphone,
  MousePointerClick,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
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
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

const RANGES = [
  { value: "1", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

interface PageVisit {
  id: string;
  visitor_id: string | null;
  session_id: string | null;
  page_path: string;
  page_title: string | null;
  referrer_source: string | null;
  country: string | null;
  city: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  created_at: string;
}

const countBy = <T,>(items: T[], keyFn: (i: T) => string | null | undefined) => {
  const map = new Map<string, number>();
  items.forEach((i) => {
    const k = keyFn(i) || "Unknown";
    map.set(k, (map.get(k) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const AdminTrafficStatus = () => {
  const [days, setDays] = useState("7");

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ["admin-traffic", days],
    queryFn: async () => {
      const since = subDays(new Date(), parseInt(days, 10)).toISOString();
      const { data, error } = await supabase
        .from("page_visits")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return (data || []) as PageVisit[];
    },
    refetchInterval: 60_000,
  });

  const stats = useMemo(() => {
    const totalViews = visits.length;
    const uniqueVisitors = new Set(visits.map((v) => v.visitor_id).filter(Boolean)).size;
    const uniqueSessions = new Set(visits.map((v) => v.session_id).filter(Boolean)).size;
    const uniqueCountries = new Set(visits.map((v) => v.country).filter(Boolean)).size;
    return { totalViews, uniqueVisitors, uniqueSessions, uniqueCountries };
  }, [visits]);

  // Daily timeline
  const timeline = useMemo(() => {
    const buckets = new Map<string, { date: string; views: number; visitors: Set<string> }>();
    const dayCount = parseInt(days, 10);
    for (let i = dayCount - 1; i >= 0; i--) {
      const d = format(subDays(startOfDay(new Date()), i), "MMM dd");
      buckets.set(d, { date: d, views: 0, visitors: new Set() });
    }
    visits.forEach((v) => {
      const d = format(new Date(v.created_at), "MMM dd");
      const b = buckets.get(d);
      if (b) {
        b.views += 1;
        if (v.visitor_id) b.visitors.add(v.visitor_id);
      }
    });
    return Array.from(buckets.values()).map((b) => ({
      date: b.date,
      views: b.views,
      visitors: b.visitors.size,
    }));
  }, [visits, days]);

  const topPages = useMemo(() => countBy(visits, (v) => v.page_path).slice(0, 10), [visits]);
  const topCountries = useMemo(() => countBy(visits, (v) => v.country).slice(0, 10), [visits]);
  const topSources = useMemo(() => countBy(visits, (v) => v.referrer_source).slice(0, 8), [visits]);
  const devices = useMemo(() => countBy(visits, (v) => v.device_type), [visits]);
  const browsers = useMemo(() => countBy(visits, (v) => v.browser).slice(0, 6), [visits]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Traffic Status</h2>
          <p className="text-sm text-muted-foreground">
            Live visitor analytics — where people come from and how many visit.
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total views in period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Distinct people</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Visit sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.uniqueCountries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Locations reached</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Traffic Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="visitorsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                fill="url(#viewsGrad)"
                name="Page Views"
              />
              <Area
                type="monotone"
                dataKey="visitors"
                stroke="#22c55e"
                fill="url(#visitorsGrad)"
                name="Unique Visitors"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Two column: countries + sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-5 w-5" /> Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCountries.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-right">{c.value.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {((c.value / stats.totalViews) * 100).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointerClick className="h-5 w-5" /> Traffic Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSources} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" name="Visits" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Devices + Browsers + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={devices}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(d) => `${d.name}: ${d.value}`}
                  >
                    {devices.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Browsers</CardTitle>
          </CardHeader>
          <CardContent>
            {browsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {browsers.map((b, i) => (
                  <div key={b.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      <span>{b.name}</span>
                    </div>
                    <span className="font-medium">{b.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Pages</CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topPages.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between text-sm border-b pb-2 last:border-0"
                  >
                    <span className="truncate max-w-[180px]" title={p.name}>
                      {p.name === "/" ? "Home" : p.name}
                    </span>
                    <Badge variant="outline">{p.value}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent visits */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No visits recorded yet — once visitors browse the site, their activity will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Browser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.slice(0, 50).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(v.created_at), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate" title={v.page_path}>
                        {v.page_path}
                      </TableCell>
                      <TableCell className="text-xs">{v.referrer_source || "Direct"}</TableCell>
                      <TableCell className="text-xs">{v.country || "—"}</TableCell>
                      <TableCell className="text-xs">{v.city || "—"}</TableCell>
                      <TableCell className="text-xs">{v.device_type || "—"}</TableCell>
                      <TableCell className="text-xs">{v.browser || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTrafficStatus;
