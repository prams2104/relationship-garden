/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Zen Garden palette — calm, editorial, not gamey
        garden: {
          bg: "#F8F6F1",       // Warm off-white (paper)
          surface: "#FFFFFF",
          border: "#E8E4DD",

          // Plant health colors (subtle, not traffic-light)
          thriving: "#4A7C59",  // Deep sage green
          cooling: "#C4A35A",   // Warm amber
          "at-risk": "#B86B4A", // Terracotta
          dormant: "#9B9B9B",   // Neutral grey

          // Accents
          primary: "#2D5A3D",   // Dark forest green
          secondary: "#8B7355", // Warm brown
          text: "#2C2C2C",      // Near-black
          muted: "#7A7A7A",     // Grey text
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
        serif: ["Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
