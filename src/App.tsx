// src/App.tsx
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
import FreeAuditReport from "./pages/FreeAuditReport.tsx";
import SubscriptionSuccess from "./pages/SubscriptionSuccess.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import Terms from "./pages/Terms.tsx";
import Privacy from "./pages/Privacy.tsx";
import Refund from "./pages/Refund.tsx";
import GeoAudit from "./pages/GeoAudit.tsx";
import AccountSettings from "./pages/AccountSettings.tsx";
import Contact from "./pages/Contact.tsx"; // ← added

const queryClient = new QueryClient();

function AuthHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
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
              <Route path="/free-audit/:id" element={<FreeAuditReport />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/geo-audit" element={<GeoAudit />} />
              <Route path="/account" element={<AccountSettings />} />
              <Route path="/contact" element={<Contact />} /> {/* ← added */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuditProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
