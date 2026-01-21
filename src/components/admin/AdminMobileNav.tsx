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

const menuItems = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "bookings", label: "Bookings", icon: Package },
  { value: "packages", label: "Packages", icon: LayoutDashboard },
  { value: "package-sections", label: "Package Sections", icon: Layers },
  { value: "revenue", label: "Revenue", icon: Wallet },
  { value: "emi-report", label: "Installment Report", icon: Calculator },
  { value: "payments", label: "Payments", icon: Wallet },
  { value: "staff", label: "Staff Management", icon: UserCog },
  { value: "notifications", label: "Notifications", icon: Bell },
  { value: "notices", label: "Notice Board", icon: Megaphone },
  { value: "sections", label: "Section Visibility", icon: Layers },
  { value: "menu", label: "Menu", icon: MenuIcon },
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
            <nav className="space-y-1 p-2">
              {menuItems.map((item) => {
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
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminMobileNav;
