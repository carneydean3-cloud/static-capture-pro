import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate, Link } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuditProvider } from "@/contexts/AuditContext";
import { supabase } from "@/integrations/supabase/client";

import Home from "./pages/Home.tsx";
import Newsletter from "./pages/Newsletter.tsx";

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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

// Tool selector hub (moved to /tools)
const CommandCenterHub = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-obsidian text-clinic p-6">
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
        Select Diagnostic Suite
      </h1>
      <p className="text-data max-w-lg mx-auto text-lg">
        Choose the specialized analysis you need to run today. Both tools diagnose your page in
        under 60 seconds.
      </p>
    </div>

    <div className="flex flex-col md:flex-row gap-6 w-full max-w-4xl">
      {/* Conversion Suite */}
      <div className="flex-1 border border-surgical bg-[#0A0A0A] p-8 rounded-lg text-left hover:border-pulse/40 transition-colors duration-300">
        <div className="text-pulse font-mono text-xs tracking-widest uppercase mb-4">
          Human Layer
        </div>
        <h3 className="text-2xl font-bold mb-3 text-clinic">Conversion Audit</h3>
        <p className="text-data mb-8 leading-relaxed">
          Identify psychological friction, trust gaps, and visual leaks that are actively killing
          your conversion rate.
        </p>
        <Link to="/conversion-audit" className="btn-pulse inline-block w-full text-center">
          Run Conversion Audit
        </Link>
      </div>

      {/* GEO Suite */}
      <div className="flex-1 border border-surgical bg-[#0A0A0A] p-8 rounded-lg text-left hover:border-neon/40 transition-colors duration-300">
        <div className="text-neon font-mono text-xs tracking-widest uppercase mb-4">
          Machine Layer
        </div>
        <h3 className="text-2xl font-bold mb-3 text-clinic">GEO AI Audit</h3>
        <p className="text-data mb-8 leading-relaxed">
          Diagnose structural unreadability and prevent your page from being excluded by ChatGPT,
          Perplexity, and AI Overviews.
        </p>
        <Link to="/geo-audit" className="btn-neon inline-block w-full text-center">
          Run GEO Audit
        </Link>
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
              {/* Homepage */}
              <Route path="/" element={<Home />} />

              {/* Newsletter */}
              <Route path="/newsletter" element={<Newsletter />} />

              {/* Tool Selector (old homepage) */}
              <Route path="/tools" element={<CommandCenterHub />} />

              {/* Tools (unchanged) */}
              <Route path="/conversion-audit" element={<Index />} />
              <Route path="/geo-audit" element={<GeoAudit />} />

              {/* Existing Routes */}
              <Route path="/paid-report" element={<PaidReport />} />
              <Route path="/report/:id" element={<ReportById />} />
              <Route path="/free-audit/:id" element={<FreeAuditReport />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/account" element={<AccountSettings />} />

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
