/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "var(--ink)",
        night: "var(--night)",
        night2: "var(--night-2)",
        surface: "var(--surface)",
        marigold: "var(--marigold)",
        pink: "var(--pink)",
        teal: "var(--teal)",
        saffron: "var(--saffron)",
        cream: "var(--cream)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { card: "24px", pill: "999px" },
      boxShadow: {
        glow: "0 0 34px -12px rgba(255, 79, 139, 0.55)",
        soft: "0 18px 44px -18px rgba(0, 0, 0, 0.55)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
