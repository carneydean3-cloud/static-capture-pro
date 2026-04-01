import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-12 px-6 border-t border-white/10">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold">ConversionDoc</span>
        <svg width="32" height="20" viewBox="0 0 40 24" fill="none" className="text-primary">
          <path d="M2 12H10L13 4L18 20L22 10L25 14H30L34 8L38 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M34 4H38V8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        <Link to="/refund" className="hover:text-foreground transition-colors">
          Refund
        </Link>
        <a 
          href="mailto:support@conversiondoc.co.uk" 
          className="hover:text-foreground transition-colors"
        >
          Contact
        </a>
      </div>

      <p className="text-xs text-muted-foreground">
        © 2026 ConversionDoc Ltd. All rights reserved.
      </p>

    </div>
  </footer>
);

export default Footer;
