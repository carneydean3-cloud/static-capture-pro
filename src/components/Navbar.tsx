import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
          ? "bg-background/80 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-1">
          <span className="text-xl font-bold tracking-tight">ConversionDoc</span>
          <svg
            width="40"
            height="24"
            viewBox="0 0 40 24"
            fill="none"
            className="text-primary"
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
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#how-it-works"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How it Works
          </a>
          <a
            href="#results"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Results
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            FAQ
          </a>
          <a
            href="https://conversiondoc.co.uk/blog"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Blog
          </a>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Currency selector */}
          <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 border border-white/10">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <select
              value={currency}
              onChange={(e) =>
                setCurrency(e.target.value as "USD" | "EUR" | "GBP")
              }
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-foreground"
            >
              <option value="USD" className="bg-navy-dark text-foreground">
                USD
              </option>
              <option value="EUR" className="bg-navy-dark text-foreground">
                EUR
              </option>
              <option value="GBP" className="bg-navy-dark text-foreground">
                GBP
              </option>
            </select>
          </div>

          {/* Auth link */}
          {isLoggedIn ? (
            <a
              href="/dashboard"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Dashboard →
            </a>
          ) : (
            <a
              href="/login"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Sign In
            </a>
          )}

          {/* CTA */}
          <a
            href="#hero-cta"
            className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Get </span>Free Audit
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
