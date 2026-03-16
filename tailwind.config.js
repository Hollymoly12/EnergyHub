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
        primary: "#16523A",
        accent: "#B8FF3C",
        "background-light": "#FAFAF7",
        "background-dark": "#121815",
        // Legacy aliases kept for backward compat
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
      },
      fontFamily: {
        display: ["Bricolage Grotesque", "sans-serif"],
        sans: ["Public Sans", "sans-serif"],
        body: ["Public Sans", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md": "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "card-lg": "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        primary: "0 8px 32px rgba(22,82,58,0.25)",
        lime: "0 0 20px rgba(184,255,60,0.3)",
      },
      animation: {
        ticker: "ticker 30s linear infinite",
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        ping: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
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
