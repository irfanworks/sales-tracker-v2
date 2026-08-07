import type { Config } from "tailwindcss";

/**
 * Design tokens live in app/globals.css (:root).
 * Tailwind maps utilities to those CSS variables for a single source of truth.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        foreground: "var(--color-foreground)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        muted: {
          DEFAULT: "var(--color-muted)",
          soft: "var(--color-muted-soft)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          soft: "var(--color-border-soft)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          muted: "var(--color-accent-muted)",
          foreground: "var(--color-accent-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          hover: "var(--color-sidebar-hover)",
          border: "var(--color-sidebar-border)",
          foreground: "var(--color-sidebar-foreground)",
        },
        ring: "var(--color-ring)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        focus: "var(--shadow-focus)",
        "accent-hover": "var(--shadow-accent-hover)",
      },
      fontSize: {
        "app-xs": ["var(--text-xs)", { lineHeight: "1.45" }],
        "app-sm": ["var(--text-sm)", { lineHeight: "1.45" }],
        "app-base": ["var(--text-base)", { lineHeight: "1.5" }],
        "app-md": ["var(--text-md)", { lineHeight: "1.45" }],
        "app-lg": ["var(--text-lg)", { lineHeight: "1.35" }],
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      transitionTimingFunction: {
        premium: "var(--ease-premium)",
        exit: "var(--ease-exit)",
        spring: "var(--ease-spring)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
      animation: {
        shimmer: "shimmer 1.6s var(--ease-premium) infinite",
        "fade-in": "fadeIn var(--duration-normal) var(--ease-premium)",
        "slide-up": "slideUp var(--duration-slow) var(--ease-premium)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      maxWidth: {
        page: "var(--page-max-width)",
      },
    },
  },
  plugins: [],
};
export default config;
