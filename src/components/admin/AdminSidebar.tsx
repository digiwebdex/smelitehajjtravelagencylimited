import { 
  Package, 
  Users, 
  Menu,
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
  ChevronLeft,
  BarChart3,
  Layers,
  Images,
  Calculator,
  Megaphone,
  UserCog,
  Share2,
  Shield,
  Activity,
  AlertTriangle,
  UserPlus,
  TrendingUp,
  Receipt,
  Plane,
  Mail,
  Eye,
  BookOpen,
  PiggyBank,
  Landmark,
  CreditCard,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
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
      { value: "customers", label: "Customer Management", icon: Users },
      { value: "bookings", label: "Package Bookings", icon: Package },
      { value: "air-ticket-bookings", label: "Air Ticket Bookings", icon: Plane },
      { value: "air-ticket-settings", label: "Air Ticket Settings", icon: Settings },
      { value: "visa-applications", label: "Visa Applications", icon: Globe },
      { value: "group-inquiries", label: "Group Inquiries", icon: Users },
    ]
  },
  {
    label: "Marketing & Leads",
    items: [
      { value: "leads", label: "Leads CRM", icon: UserPlus },
      { value: "marketing-analytics", label: "Marketing Analytics", icon: TrendingUp },
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
    label: "Notifications & Templates",
    items: [
      { value: "notifications", label: "Notifications", icon: Bell },
      { value: "notification-retry", label: "Notification Retry", icon: MessageSquare },
      { value: "notification-templates", label: "Email/SMS Templates", icon: Mail },
      { value: "booking-settings", label: "Booking Settings", icon: Settings },
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
      { value: "menu", label: "Menu", icon: Menu },
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

const AdminSidebar = ({ activeTab, onTabChange, collapsed, onCollapsedChange }: AdminSidebarProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col bg-card border-r border-border h-[calc(100vh-73px)] sticky top-[73px] transition-all duration-300",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Collapse Toggle */}
        <div className="p-2 flex justify-end border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCollapsedChange(!collapsed)}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Menu Items */}
        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-4 px-2">
            {menuGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <div className="mx-1 px-2 py-1.5 rounded-md border border-primary/40 bg-primary/5">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                      {group.label}
                    </p>
                  </div>
                )}
                {group.items.map((item) => {
                  const isActive = activeTab === item.value;
                  const Icon = item.icon;

                  const button = (
                    <button
                      key={item.value}
                      onClick={() => onTabChange(item.value)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "mx-auto")} />
                      {!collapsed && <span>{item.label}</span>}
                    </button>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.value}>
                        <TooltipTrigger asChild>
                          {button}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
};

export default AdminSidebar;
