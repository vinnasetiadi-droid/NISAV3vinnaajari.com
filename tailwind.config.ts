import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        brand: ["var(--font-brand)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          50: "#e6f1ff",
          100: "#cce3ff",
          200: "#99c7ff",
          300: "#66aaff",
          400: "#338eff",
          500: "#0a70ff",
          600: "#085ed6",
          700: "#064aa8",
          800: "#04387d",
          900: "#032a5e",
        },
        teal2: "#00ffff",
        cream: "#f2efe6",
        ink: "#0b0e1a",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(20,20,60,0.12), inset 0 1px 0 rgba(255,255,255,0.45)",
        "glass-dark": "0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
        pop: "0 16px 48px rgba(25,20,80,0.18)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blob: {
          "0%,100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-40px) scale(1.08)" },
          "66%": { transform: "translate(-25px,25px) scale(0.95)" },
        },
      },
      animation: {
        shimmer: "shimmer 2.2s linear infinite",
        rise: "rise .22s ease-out both",
        blob: "blob 16s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
