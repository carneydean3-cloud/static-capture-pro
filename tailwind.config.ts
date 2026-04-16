import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"], // [INJECTED] The Surgical Data Font
      },
      colors: {
        // === [THE OBSIDIAN SYSTEM: CYBER-CLINICAL LAYER] ===
        obsidian: "#050505",      // Main Background
        pulse: "#06B6D4",         // Teal (Conversion Layer)
        neon: "#D946EF",          // Magenta (GEO Layer)
        clinic: "#FFFFFF",        // High Contrast Text
        data: "#A1A1AA",          // Low Contrast Text / Metadata
        surgical: "#1A1A1A",      // Borders & Dividers
        warning: "#E11D48",       // Leaks / Errors
        // ===================================================

        // --- Lovable / Shadcn Legacy Variables (Preserved to prevent breaks) ---
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "navy-deep": "hsl(var(--navy-deep))",
        "navy-dark": "hsl(var(--navy-dark))",
        "slate-body": "hsl(var(--slate-body))",
        "headline-white": "hsl(var(--headline-white))",
        "score-green": "hsl(var(--score-green))",
        "score-amber": "hsl(var(--score-amber))",
        "score-red": "hsl(var(--score-red))",
        "body": "hsl(var(--body))",
        "caption": "hsl(var(--caption))",
        "card-text": "hsl(var(--card-text))",
        "subheading": "hsl(var(--subheading))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // === [OBSIDIAN GLOW FX] ===
        'pulse-glow': '0 0 20px rgba(6, 182, 212, 0.15)',
        'neon-glow': '0 0 20px rgba(217, 70, 239, 0.15)',
        'pulse-heavy': '0 0 30px rgba(6, 182, 212, 0.4)',
        'neon-heavy': '0 0 30px rgba(217, 70, 239, 0.4)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
