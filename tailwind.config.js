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
        cream: "#FAFAF7",
        ink: {
          DEFAULT: "#0D0D0D",
          2: "#3A3632",
          3: "#6B6560",
        },
        surface: {
          DEFAULT: "#F3F1EC",
          2: "#EAE7E0",
          3: "#E2DDD6",
        },
        forest: {
          DEFAULT: "#16523A",
          light: "#1D6B4C",
          dark: "#0D3324",
          muted: "#D4E8DF",
        },
        lime: {
          DEFAULT: "#B8FF3C",
          dark: "#8ACC2A",
          muted: "#E8FAC8",
        },
        // Keep these for any remaining components
        slate: {
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
        },
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(13,13,13,0.06), 0 1px 2px rgba(13,13,13,0.04)",
        "card-md": "0 4px 16px rgba(13,13,13,0.08), 0 1px 4px rgba(13,13,13,0.04)",
        "card-lg": "0 8px 32px rgba(13,13,13,0.10), 0 2px 8px rgba(13,13,13,0.06)",
        "lime": "0 0 20px rgba(184,255,60,0.3)",
      },
      animation: {
        "ticker": "ticker 30s linear infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
