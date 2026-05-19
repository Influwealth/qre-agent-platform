import typography from "@tailwindcss/typography";
import containerQueries from "@tailwindcss/container-queries";
import animate from "tailwindcss-animate";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx,html,css}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring) / <alpha-value>)",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary) / <alpha-value>)",
          foreground: "oklch(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary) / <alpha-value>)",
          foreground: "oklch(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive) / <alpha-value>)",
          foreground: "oklch(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted) / <alpha-value>)",
          foreground: "oklch(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "oklch(var(--accent) / <alpha-value>)",
          foreground: "oklch(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
        },
        chart: {
          1: "oklch(var(--chart-1))",
          2: "oklch(var(--chart-2))",
          3: "oklch(var(--chart-3))",
          4: "oklch(var(--chart-4))",
          5: "oklch(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        green: {
          50: "oklch(0.97 0.05 142)",
          100: "oklch(0.94 0.11 142)",
          200: "oklch(0.88 0.17 142)",
          300: "oklch(0.84 0.20 142)",
          400: "oklch(0.78 0.22 142)",
          500: "oklch(0.72 0.22 142)",
          600: "oklch(0.65 0.20 142)",
          700: "oklch(0.55 0.18 142)",
          800: "oklch(0.42 0.15 142)",
          900: "oklch(0.28 0.10 142)",
          950: "oklch(0.16 0.07 142)",
        },
        amber: {
          50: "oklch(0.98 0.04 95)",
          100: "oklch(0.95 0.10 95)",
          200: "oklch(0.90 0.16 95)",
          300: "oklch(0.85 0.20 95)",
          400: "oklch(0.78 0.22 95)",
          500: "oklch(0.72 0.22 95)",
          600: "oklch(0.65 0.20 95)",
          700: "oklch(0.56 0.18 95)",
          800: "oklch(0.45 0.15 95)",
          900: "oklch(0.30 0.10 95)",
          950: "oklch(0.17 0.07 95)",
        },
        red: {
          50: "oklch(0.97 0.05 25)",
          100: "oklch(0.94 0.11 25)",
          200: "oklch(0.88 0.17 25)",
          300: "oklch(0.84 0.20 25)",
          400: "oklch(0.78 0.22 25)",
          500: "oklch(0.72 0.22 25)",
          600: "oklch(0.65 0.20 25)",
          700: "oklch(0.55 0.18 25)",
          800: "oklch(0.42 0.15 25)",
          900: "oklch(0.28 0.10 25)",
          950: "oklch(0.16 0.07 25)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0,0,0,0.05)",
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
  plugins: [typography, containerQueries, animate],
};
