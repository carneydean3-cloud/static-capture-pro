import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Footer = () => {
  const { pathname } = useLocation();
  const isGeoMode = pathname.includes("geo-audit");

  const activeColor = isGeoMode ? "text-neon" : "text-pulse";

  return (
    <footer className="py-12 px-6 bg-obsidian border-t border-surgical">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tighter text-clinic">
            ConversionDoc
          </span>
          <svg
            width="32"
            height="20"
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
        </div>

        {/* Tagline */}
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-data text-center md:text-left opacity-60">
          Diagnose. Fix. Convert. Built for humans. Ready for AI.
        </p>

        {/* Links */}
        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest font-bold">
          <Link
            to="/privacy"
            className="text-data hover:text-clinic transition-colors"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-data hover:text-clinic transition-colors"
          >
            Terms
          </Link>
          <Link
            to="/refund"
            className="text-data hover:text-clinic transition-colors"
          >
            Refund
          </Link>
          <Link
            to="/contact"
            className="text-data hover:text-clinic transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* Copyright */}
        <p className="font-mono text-[10px] uppercase tracking-widest text-surgical">
          © 2026 ConversionDoc Ltd.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
