/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0D10",
        panel: "#12171C",
        "panel-line": "#1E262C",
        signal: "#4FD1C5",
        "signal-dim": "#2C5F5A",
        amber: "#F2A93B",
        danger: "#E5484D",
        ink: "#E8ECEF",
        muted: "#7A8791",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
