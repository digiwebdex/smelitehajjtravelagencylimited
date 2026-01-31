import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  TrendingUp,
  ArrowLeft,
  LogOut,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminAirTicketBookings from "@/components/admin/AdminAirTicketBookings";
import AdminAirTicketSettings from "@/components/admin/AdminAirTicketSettings";
import AdminPackages from "@/components/admin/AdminPackages";
import AdminPackageSections from "@/components/admin/AdminPackageSections";
import AdminRevenue from "@/components/admin/AdminRevenue";
import AdminMenu from "@/components/admin/AdminMenu";
import AdminHero from "@/components/admin/AdminHero";
import AdminServices from "@/components/admin/AdminServices";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminTeam from "@/components/admin/AdminTeam";
import AdminFAQ from "@/components/admin/AdminFAQ";
import AdminVisa from "@/components/admin/AdminVisa";
import AdminVisaApplications from "@/components/admin/AdminVisaApplications";
import AdminContact from "@/components/admin/AdminContact";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminNotifications from "@/components/admin/AdminNotifications";
import AdminLegalPages from "@/components/admin/AdminLegalPages";
import AdminOfficeLocations from "@/components/admin/AdminOfficeLocations";
import AdminPaymentMethods from "@/components/admin/AdminPaymentMethods";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminMobileNav from "@/components/admin/AdminMobileNav";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminSectionVisibility from "@/components/admin/AdminSectionVisibility";
import AdminEMIReport from "@/components/admin/AdminEMIReport";
import AdminNotices from "@/components/admin/AdminNotices";
import AdminStaffManagement from "@/components/admin/AdminStaffManagement";
import AdminSocialNetworks from "@/components/admin/AdminSocialNetworks";
import AdminBackupRestore from "@/components/admin/AdminBackupRestore";
import AdminReportsAnalytics from "@/components/admin/AdminReportsAnalytics";
import AdminAuditLog from "@/components/admin/AdminAuditLog";
import AdminPaymentReconciliation from "@/components/admin/AdminPaymentReconciliation";
import AdminNotificationRetry from "@/components/admin/AdminNotificationRetry";
import AdminNotificationTemplates from "@/components/admin/AdminNotificationTemplates";
import AdminBookingSettings from "@/components/admin/AdminBookingSettings";
import AdminLeadsManagement from "@/components/admin/AdminLeadsManagement";
import AdminMarketingAnalytics from "@/components/admin/AdminMarketingAnalytics";
import AdminLeadMagnets from "@/components/admin/AdminLeadMagnets";
import AdminWebinars from "@/components/admin/AdminWebinars";
import AdminReferrals from "@/components/admin/AdminReferrals";
import AdminAgents from "@/components/admin/AdminAgents";
import AdminCRMAutomation from "@/components/admin/AdminCRMAutomation";
import AdminGroupInquiries from "@/components/admin/AdminGroupInquiries";
import AdminFinancialAnalytics from "@/components/admin/AdminFinancialAnalytics";
import AdminRetargetingSegments from "@/components/admin/AdminRetargetingSegments";
import AdminBlog from "@/components/admin/AdminBlog";
import AdminTranslations from "@/components/admin/AdminTranslations";
import AdminTransactionLogs from "@/components/admin/AdminTransactionLogs";
import AdminHotels from "@/components/admin/AdminHotels";
import { formatCurrency } from "@/lib/currency";

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
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
      value: formatCurrency(stats.totalRevenue),
      icon: Wallet,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview />;
      case "bookings":
        return <AdminBookings onUpdate={fetchStats} />;
      case "air-ticket-bookings":
        return <AdminAirTicketBookings />;
      case "air-ticket-settings":
        return <AdminAirTicketSettings />;
      case "visa-applications":
        return <AdminVisaApplications />;
      case "leads":
        return <AdminLeadsManagement />;
      case "marketing-analytics":
        return <AdminMarketingAnalytics />;
      case "lead-magnets":
        return <AdminLeadMagnets />;
      case "webinars":
        return <AdminWebinars />;
      case "retargeting":
        return <AdminRetargetingSegments />;
      case "referrals":
        return <AdminReferrals />;
      case "agents":
        return <AdminAgents />;
      case "crm-automation":
        return <AdminCRMAutomation />;
      case "group-inquiries":
        return <AdminGroupInquiries />;
      case "packages":
        return <AdminPackages onUpdate={fetchStats} />;
      case "package-sections":
        return <AdminPackageSections />;
      case "hotels":
        return <AdminHotels />;
      case "revenue":
        return <AdminRevenue />;
      case "financial-analytics":
        return <AdminFinancialAnalytics />;
      case "reports":
        return <AdminReportsAnalytics />;
      case "reconciliation":
        return <AdminPaymentReconciliation />;
      case "emi-report":
        return <AdminEMIReport />;
      case "payments":
        return <AdminPaymentMethods />;
      case "transaction-logs":
        return <AdminTransactionLogs />;
      case "staff":
        return <AdminStaffManagement />;
      case "audit-log":
        return <AdminAuditLog />;
      case "notifications":
        return <AdminNotifications />;
      case "notification-retry":
        return <AdminNotificationRetry />;
      case "notification-templates":
        return <AdminNotificationTemplates />;
      case "booking-settings":
        return <AdminBookingSettings />;
      case "blog":
        return <AdminBlog />;
      case "notices":
        return <AdminNotices />;
      case "gallery":
        return <AdminGallery />;
      case "testimonials":
        return <AdminTestimonials />;
      case "faq":
        return <AdminFAQ />;
      case "translations":
        return <AdminTranslations />;
      case "sections":
        return <AdminSectionVisibility />;
      case "menu":
        return <AdminMenu />;
      case "hero":
        return <AdminHero />;
      case "services":
        return <AdminServices />;
      case "team":
        return <AdminTeam />;
      case "visa":
        return <AdminVisa />;
      case "contact":
        return <AdminContact />;
      case "offices":
        return <AdminOfficeLocations />;
      case "social-networks":
        return <AdminSocialNetworks />;
      case "footer":
        return <AdminFooter />;
      case "legal":
        return <AdminLegalPages />;
      case "backup":
        return <AdminBackupRestore />;
      case "settings":
        return <AdminSettings />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 lg:px-6 py-4 flex items-center justify-between">
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
                <p className="text-xs text-muted-foreground hidden sm:block">SM Elite Hajj Management</p>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation */}
      <AdminMobileNav activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <AdminSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="pt-4 lg:pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs lg:text-sm text-muted-foreground">{stat.title}</p>
                        <p className="text-xl lg:text-3xl font-bold mt-1">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} p-2 lg:p-3 rounded-xl`}>
                        <stat.icon className={`w-4 h-4 lg:w-6 lg:h-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tab Content */}
          <div className="animate-in fade-in-50 duration-300">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
