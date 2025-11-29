import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        monad: {
          purple: "#836EF9",
          "purple-dim": "#6B5ACC",
          "purple-glow": "rgba(131, 110, 249, 0.4)",
          "purple-subtle": "rgba(131, 110, 249, 0.1)",
        },
        signal: {
          buy: "#00FF88",
          "buy-dim": "rgba(0, 255, 136, 0.2)",
          sell: "#FF4757",
          "sell-dim": "rgba(255, 71, 87, 0.2)",
        },
        bg: {
          primary: "#0A0A0F",
          secondary: "#12121A",
          card: "rgba(18, 18, 26, 0.8)",
          elevated: "#1A1A24",
        },
        text: {
          primary: "#FAFAFA",
          secondary: "#A0A0B0",
          muted: "#606070",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.06)",
          active: "rgba(131, 110, 249, 0.5)",
        },
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        display: ["Outfit", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "monad-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(131, 110, 249, 0.1), transparent)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        glow: "0 0 30px -10px rgba(131, 110, 249, 0.4)",
        "glow-lg": "0 0 60px -15px rgba(131, 110, 249, 0.5)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-in": "slide-in-right 0.3s ease-out forwards",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
