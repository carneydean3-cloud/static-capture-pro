import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Globe, LayoutDashboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  const isGeoMode = location.pathname.includes("geo-audit");
  const activeColor = isGeoMode ? "text-neon" : "text-pulse";
  const activeBtn = isGeoMode ? "btn-neon" : "btn-pulse";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
        scrolled
          ? "bg-obsidian/80 backdrop-blur-md border-b border-surgical"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="text-xl font-black tracking-tighter text-clinic group-hover:opacity-80 transition-opacity">
            ConversionDoc
          </span>
          <svg
            width="40"
            height="24"
            viewBox="0 0 40 24"
            fill="none"
            className={cn("transition-colors duration-500", activeColor)}
          >
            <path
              d="M2 12H10L13 4L18 20L22 10L25 14H30L34 8L38 4"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M34 4H38V8"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
          >
            Process
          </a>
          <a
            href="#pricing"
            className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
          >
            Pricing
          </a>
          <a
            href="https://conversiondoc.co.uk/blog"
            className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
          >
            Blog
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Currency selector */}
          <div className="hidden sm:flex items-center gap-2 bg-black/40 rounded-md px-3 py-1.5 border border-surgical">
            <Globe className="w-3.5 h-3.5 text-data" />
            <select
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value as "USD" | "EUR" | "GBP")
              }
              className="bg-transparent text-[10px] font-mono font-bold uppercase outline-none cursor-pointer text-clinic"
            >
              <option value="USD" className="bg-obsidian text-clinic">USD</option>
              <option value="EUR" className="bg-obsidian text-clinic">EUR</option>
              <option value="GBP" className="bg-obsidian text-clinic">GBP</option>
            </select>
          </div>

          {/* Auth link */}
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="hidden lg:flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-mono font-bold uppercase tracking-widest text-data hover:text-clinic transition-colors whitespace-nowrap"
            >
              Sign In
            </Link>
          )}

          {/* CTA */}
          <a
            href="#hero-cta"
            className={cn("text-[11px] font-mono font-bold uppercase tracking-widest py-2 px-5 transition-all duration-300", activeBtn)}
          >
            Free Audit
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
