import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import PaidReport from "./pages/PaidReport.tsx";
import ReportById from "./pages/ReportById.tsx";
import SubscriptionSuccess from "./pages/SubscriptionSuccess.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Refund from "./pages/Refund.tsx";

const queryClient = new QueryClient();

// Handles magic link token in URL hash and redirects to /dashboard
function AuthHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes (magic link click triggers this)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Only redirect if we're not already on dashboard or report pages
        const path = window.location.pathname;
        if (path === "/" || path === "/login") {
          navigate("/dashboard");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CurrencyProvider>
        <AuditProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthHandler />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/paid-report" element={<PaidReport />} />
              <Route path="/report/:id" element={<ReportById />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuditProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
