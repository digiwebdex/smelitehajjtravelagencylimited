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

const menuItems = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "bookings", label: "Bookings", icon: Package },
  { value: "packages", label: "Packages", icon: LayoutDashboard },
  { value: "package-sections", label: "Package Sections", icon: Layers },
  { value: "revenue", label: "Revenue", icon: Wallet },
  { value: "emi-report", label: "Installment Report", icon: Calculator },
  { value: "payments", label: "Payments", icon: Wallet },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "sections", label: "Section Visibility", icon: Layers },
  { value: "menu", label: "Menu", icon: Menu },
  { value: "hero", label: "Hero", icon: Image },
  { value: "services", label: "Services", icon: Settings },
  { value: "testimonials", label: "Testimonials", icon: MessageSquare },
  { value: "team", label: "Team", icon: Users },
  { value: "faq", label: "FAQ", icon: HelpCircle },
  { value: "gallery", label: "Gallery", icon: Images },
  { value: "visa", label: "Visa", icon: Globe },
  { value: "contact", label: "Contact", icon: Phone },
  { value: "offices", label: "Offices", icon: Building2 },
  { value: "footer", label: "Footer", icon: FileText },
  { value: "legal", label: "Legal Pages", icon: Scale },
  { value: "settings", label: "Settings", icon: Settings },
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
          <nav className="space-y-1 px-2">
            {menuItems.map((item) => {
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
          </nav>
        </ScrollArea>
      </aside>
    </TooltipProvider>
  );
};

export default AdminSidebar;
