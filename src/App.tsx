import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import FacebookPixel from "@/components/FacebookPixel";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import MyBookings from "./pages/MyBookings";
import ProfileSettings from "./pages/ProfileSettings";
import TrackOrder from "./pages/TrackOrder";
import TrackVisa from "./pages/TrackVisa";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LegalPage from "./pages/LegalPage";
import PaymentResult from "./pages/PaymentResult";
import BookingConfirmation from "./pages/BookingConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="sm-elite-hajj-theme">
      <AuthProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnalyticsTracker />
              <FacebookPixel />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/track-visa" element={<TrackVisa />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/booking/confirmation/:bookingId" element={<BookingConfirmation />} />
                <Route path="/legal/:pageKey" element={<LegalPage />} />
                <Route path="/payment/success" element={<PaymentResult />} />
                <Route path="/payment/failed" element={<PaymentResult />} />
                <Route path="/payment/cancelled" element={<PaymentResult />} />
                <Route path="/payment/callback" element={<PaymentResult />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
