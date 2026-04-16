import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, Link } from "react-router-dom";
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
import Contact from "./pages/Contact.tsx"; 

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

// [INJECTED] Temporary Command Center Hub
const CommandCenterHub = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian text-clinic text-center p-6">
    <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">SYSTEM INITIALIZING...</h1>
    <p className="text-data tech-readout mb-12 opacity-80">[COMMAND_CENTER_AWAITING_DEPLOYMENT]</p>
    
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
      <div className="flex-1 border border-surgical bg-black/40 p-8 rounded-lg text-left">
        <h2 className="text-pulse tech-readout mb-2 text-sm">[01_HUMAN_LAYER]</h2>
        <h3 className="text-2xl font-bold mb-4 text-clinic">Conversion Diagnostics</h3>
        <p className="text-data mb-6">Identify psychological friction and visual leaks causing high bounce rates.</p>
        <Link to="/conversion-audit" className="btn-pulse inline-block w-full text-center">ENTER_CONVERSION_LAB</Link>
      </div>

      <div className="flex-1 border border-surgical bg-black/40 p-8 rounded-lg text-left">
        <h2 className="text-neon tech-readout mb-2 text-sm">[02_MACHINE_LAYER]</h2>
        <h3 className="text-2xl font-bold mb-4 text-clinic">GEO AI Visibility</h3>
        <p className="text-data mb-6">Diagnose machine unreadability and prevent AI Search (LLM) exclusion.</p>
        <Link to="/geo-audit" className="btn-neon inline-block w-full text-center">ENTER_GEO_LAB</Link>
      </div>
    </div>
  </div>
);

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
              {/* [NEW] The Command Center Hub */}
              <Route path="/" element={<CommandCenterHub />} />
              
              {/* [MOVED] The Conversion Tool */}
              <Route path="/conversion-audit" element={<Index />} />
              
              {/* [EXISTING] Core Routes */}
              <Route path="/geo-audit" element={<GeoAudit />} />
              <Route path="/paid-report" element={<PaidReport />} />
              <Route path="/report/:id" element={<ReportById />} />
              <Route path="/free-audit/:id" element={<FreeAuditReport />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/account" element={<AccountSettings />} />
              
              {/* [EXISTING] Legal & Info */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/refund" element={<Refund />} />
              <Route path="/contact" element={<Contact />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuditProvider>
      </CurrencyProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
