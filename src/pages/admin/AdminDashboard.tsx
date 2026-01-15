import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp,
  ArrowLeft,
  LogOut,
  Menu,
  Image,
  Settings,
  MessageSquare,
  HelpCircle,
  Globe,
  Phone,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminPackages from "@/components/admin/AdminPackages";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminMenu from "@/components/admin/AdminMenu";
import AdminHero from "@/components/admin/AdminHero";
import AdminServices from "@/components/admin/AdminServices";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminFAQ from "@/components/admin/AdminFAQ";
import AdminVisa from "@/components/admin/AdminVisa";
import AdminContact from "@/components/admin/AdminContact";
import AdminFooter from "@/components/admin/AdminFooter";

interface Stats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalPackages: number;
}

const AdminDashboard = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    totalPackages: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchStats();
    }
  }, [user, isAdmin]);

  const fetchStats = async () => {
    try {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("status, total_price");

      if (bookings) {
        const totalRevenue = bookings
          .filter(b => b.status === "confirmed" || b.status === "completed")
          .reduce((sum, b) => sum + Number(b.total_price), 0);
        
        setStats(prev => ({
          ...prev,
          totalBookings: bookings.length,
          pendingBookings: bookings.filter(b => b.status === "pending").length,
          confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
          totalRevenue,
        }));
      }

      const { count: packagesCount } = await supabase
        .from("packages")
        .select("*", { count: "exact", head: true });

      setStats(prev => ({
        ...prev,
        totalPackages: packagesCount || 0,
      }));

    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: Package,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Pending",
      value: stats.pendingBookings,
      icon: Users,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Confirmed",
      value: stats.confirmedBookings,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Total Revenue",
      value: `$${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const cmsTabs = [
    { value: "bookings", label: "Bookings", icon: Package },
    { value: "packages", label: "Packages", icon: Package },
    { value: "revenue", label: "Revenue", icon: DollarSign },
    { value: "menu", label: "Menu", icon: Menu },
    { value: "hero", label: "Hero", icon: Image },
    { value: "services", label: "Services", icon: Settings },
    { value: "testimonials", label: "Testimonials", icon: MessageSquare },
    { value: "team", label: "Team", icon: Users },
    { value: "faq", label: "FAQ", icon: HelpCircle },
    { value: "visa", label: "Visa", icon: Globe },
    { value: "contact", label: "Contact", icon: Phone },
    { value: "footer", label: "Footer", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-lg">Admin Dashboard</h1>
                <p className="text-xs text-muted-foreground">SM Elite Hajj Management</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.bgColor} p-3 rounded-xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="bookings" className="space-y-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-10 w-max">
              {cmsTabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="bookings">
            <AdminBookings onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="packages">
            <AdminPackages onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="revenue">
            <AdminRevenue />
          </TabsContent>

          <TabsContent value="menu">
            <AdminMenu />
          </TabsContent>

          <TabsContent value="hero">
            <AdminHero />
          </TabsContent>

          <TabsContent value="services">
            <AdminServices />
          </TabsContent>

          <TabsContent value="testimonials">
            <AdminTestimonials />
          </TabsContent>

          <TabsContent value="team">
            <AdminTeam />
          </TabsContent>

          <TabsContent value="faq">
            <AdminFAQ />
          </TabsContent>

          <TabsContent value="visa">
            <AdminVisa />
          </TabsContent>

          <TabsContent value="contact">
            <AdminContact />
          </TabsContent>

          <TabsContent value="footer">
            <AdminFooter />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
