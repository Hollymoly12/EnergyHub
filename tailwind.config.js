/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface layers
        surface: {
          DEFAULT: "#07090F",
          1: "#0D1421",
          2: "#131C2E",
          3: "#1A2540",
          4: "#243050",
          border: "#1E2D45",
        },
        // Brand colors
        brand: {
          amber: "#F59E0B",
          "amber-light": "#FCD34D",
          "amber-dim": "#92600A",
          green: "#22C55E",
          "green-dim": "#14532D",
          purple: "#818CF8",
          "purple-dim": "#312E81",
          red: "#EF4444",
          "red-dim": "#7F1D1D",
        },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      backgroundImage: {
        "dot-grid": "radial-gradient(circle, #1A2540 1px, transparent 1px)",
        "amber-glow": "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)",
        "amber-glow-sm": "radial-gradient(ellipse 40% 30% at 50% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)",
      },
      backgroundSize: {
        "dot-24": "24px 24px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow": "flow 3s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease forwards",
      },
      keyframes: {
        flow: {
          "0%, 100%": { opacity: "0.4", transform: "scaleX(0.95)" },
          "50%": { opacity: "1", transform: "scaleX(1)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        "amber-glow": "0 0 30px rgba(245,158,11,0.15), 0 0 80px rgba(245,158,11,0.05)",
        "amber-glow-sm": "0 0 12px rgba(245,158,11,0.2)",
        "card": "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        "card-hover": "0 4px 20px rgba(0,0,0,0.5), 0 0 1px rgba(245,158,11,0.3)",
      },
    },
  },
  plugins: [],
};
