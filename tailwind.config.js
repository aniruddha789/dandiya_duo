/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        marigold: "var(--marigold)",
        marigoldeep: "var(--marigold-deep)",
        cream: "var(--cream)",
        bark: "var(--bark)",
        crimson: "var(--crimson)",
        royal: "var(--royal)",
        leaf: "var(--leaf)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: { card: "22px", pill: "999px" },
      boxShadow: { hard: "5px 5px 0 var(--bark)", hardsm: "3px 3px 0 var(--bark)" },
    },
  },
  plugins: [],
};

module.exports = config;
