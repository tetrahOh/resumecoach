/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12181B",       // near-black body text
        parchment: "#F7F4EC", // warm paper background
        slate: "#2E3A41",     // deep blue-slate for panels
        brass: "#9C6B2E",     // muted brass accent (not the usual terracotta/orange)
        moss: "#4B6455",      // secondary accent, used for "positive" signals
        rust: "#8C4A3A",      // used sparingly for trade-off/negative signals
        line: "#DAD2BF",      // hairline borders on parchment
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
