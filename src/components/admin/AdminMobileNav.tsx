import { 
  Package, 
  Users, 
  Menu as MenuIcon,
  Image,
  Settings,
  MessageSquare,
  HelpCircle,
  Globe,
  Phone,
  FileText,
  Wallet,
  Building2,
  Bell,
  Scale,
  LayoutDashboard,
  BarChart3,
  Layers,
  Images,
  Megaphone,
  UserCog,
  Calculator,
  Activity,
  AlertTriangle,
  Share2,
  Shield,
  Receipt,
  Eye,
  BookOpen,
  PiggyBank,
  Landmark,
  CreditCard,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface AdminMobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Menu items organized by category
const menuGroups = [
  {
    label: "Dashboard",
    items: [
      { value: "overview", label: "Overview", icon: BarChart3 },
    ]
  },
  {
    label: "Orders & Bookings",
    items: [
      { value: "bookings", label: "Bookings", icon: Package },
      { value: "visa-applications", label: "Visa Applications", icon: Globe },
      { value: "group-inquiries", label: "Group Inquiries", icon: Users },
    ]
  },
  {
    label: "Marketing & Leads",
    items: [
      { value: "leads", label: "Leads CRM", icon: Users },
      { value: "marketing-analytics", label: "Marketing Analytics", icon: BarChart3 },
      { value: "offer-popup", label: "Offer Popup", icon: Megaphone },
      { value: "lead-magnets", label: "Lead Magnets", icon: FileText },
      { value: "webinars", label: "Webinars", icon: Megaphone },
      { value: "retargeting", label: "Retargeting Segments", icon: Activity },
    ]
  },
  {
    label: "Referral & Agents",
    items: [
      { value: "referrals", label: "Referrals", icon: Share2 },
      { value: "agents", label: "Agents", icon: UserCog },
    ]
  },
  {
    label: "CRM & Automation",
    items: [
      { value: "crm-automation", label: "Follow-up Sequences", icon: MessageSquare },
    ]
  },
  {
    label: "Packages & Hotels",
    items: [
      { value: "packages", label: "Packages", icon: LayoutDashboard },
      { value: "package-sections", label: "Package Sections", icon: Layers },
      { value: "hotels", label: "Hotels", icon: Building2 },
      { value: "hotel-bookings", label: "Hotel Bookings", icon: Building2 },
      { value: "hotel-settings", label: "Hotel Settings", icon: Settings },
    ]
  },
  {
    label: "Accounting",
    items: [
      { value: "acc-dashboard", label: "Accounting Dashboard", icon: BookOpen },
      { value: "chart-of-accounts", label: "Chart of Accounts", icon: ClipboardList },
      { value: "acc-income", label: "Income", icon: TrendingUp },
      { value: "acc-expense", label: "Expenses", icon: CreditCard },
      { value: "general-ledger", label: "General Ledger", icon: Landmark },
      { value: "bank-accounts", label: "Cash & Bank", icon: PiggyBank },
      { value: "acc-reports", label: "Financial Reports", icon: BarChart3 },
    ]
  },
  {
    label: "Finance",
    items: [
      { value: "revenue", label: "Revenue", icon: Wallet },
      { value: "financial-analytics", label: "Financial Analytics", icon: Calculator },
      { value: "reports", label: "Reports & Analytics", icon: BarChart3 },
      { value: "hajji-reports", label: "Hajji-wise Reports", icon: Users },
      { value: "reconciliation", label: "Payment Reconciliation", icon: AlertTriangle },
      { value: "emi-report", label: "Installment Report", icon: Calculator },
      { value: "payments", label: "Payment Methods", icon: Wallet },
      { value: "transaction-logs", label: "Transaction Logs", icon: Receipt },
    ]
  },
  {
    label: "Team & Operations",
    items: [
      { value: "staff", label: "Staff Management", icon: UserCog },
      { value: "audit-log", label: "Audit Log", icon: Activity },
    ]
  },
  {
    label: "Notifications",
    items: [
      { value: "notifications", label: "Notifications", icon: Bell },
      { value: "notification-retry", label: "Notification Retry", icon: MessageSquare },
    ]
  },
  {
    label: "Content",
    items: [
      { value: "blog", label: "Blog Posts", icon: FileText },
      { value: "notices", label: "Notice Board", icon: Megaphone },
      { value: "gallery", label: "Gallery", icon: Images },
      { value: "testimonials", label: "Testimonials", icon: MessageSquare },
      { value: "faq", label: "FAQ", icon: HelpCircle },
      { value: "translations", label: "Translations", icon: Globe },
    ]
  },
  {
    label: "Site Design",
    items: [
      { value: "sections", label: "Section Visibility", icon: Layers },
      { value: "menu", label: "Menu", icon: MenuIcon },
      { value: "hero", label: "Hero", icon: Image },
      { value: "services", label: "Services", icon: Settings },
      { value: "team", label: "Team", icon: Users },
      { value: "visa", label: "Visa Countries", icon: Globe },
      { value: "contact", label: "Contact", icon: Phone },
      { value: "offices", label: "Offices", icon: Building2 },
      { value: "social-networks", label: "Social Networks", icon: Share2 },
      { value: "footer", label: "Footer", icon: FileText },
      { value: "legal", label: "Legal Pages", icon: Scale },
    ]
  },
  {
    label: "System",
    items: [
      { value: "backup", label: "Backup & Restore", icon: Shield },
      { value: "demo-account", label: "Demo Account", icon: Eye },
      { value: "settings", label: "Settings", icon: Settings },
    ]
  },
];

// Flatten menu items for finding active item
const menuItems = menuGroups.flatMap(group => group.items);

const AdminMobileNav = ({ activeTab, onTabChange }: AdminMobileNavProps) => {
  const [open, setOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setOpen(false);
  };

  const activeItem = menuItems.find(item => item.value === activeTab);

  return (
    <div className="md:hidden sticky top-[73px] z-40 bg-card border-b border-border">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 h-14 rounded-none px-4"
          >
            <MenuIcon className="h-5 w-5" />
            <span className="font-medium">
              {activeItem?.label || "Menu"}
            </span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b border-border">
            <SheetTitle className="text-left">Admin Menu</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-80px)]">
            <nav className="space-y-4 p-2">
              {menuGroups.map((group) => (
                <div key={group.label} className="space-y-1">
                  <div className="mx-1 px-2 py-1.5 rounded-md border border-primary/40 bg-primary/5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {group.label}
                    </p>
                  </div>
                  {group.items.map((item) => {
                    const isActive = activeTab === item.value;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.value}
                        onClick={() => handleTabChange(item.value)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminMobileNav;
