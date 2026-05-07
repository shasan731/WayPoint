import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          foreground: "hsl(var(--surface-foreground))"
        }
      },
      boxShadow: {
        panel: "0 16px 50px rgb(15 23 42 / 0.12)"
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.75)", opacity: "0.75" },
          "80%, 100%": { transform: "scale(2.2)", opacity: "0" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.7s ease-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
