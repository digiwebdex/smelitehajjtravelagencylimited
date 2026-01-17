import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MyBookings from "./pages/MyBookings";
import TrackOrder from "./pages/TrackOrder";
import AdminDashboard from "./pages/admin/AdminDashboard";
import LegalPage from "./pages/LegalPage";
import PaymentResult from "./pages/PaymentResult";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-bookings" element={<MyBookings />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/admin" element={<AdminDashboard />} />
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
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
