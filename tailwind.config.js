/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4f46e5",
        secondary: "#0891b2",
        accent: "#10b981",
        neutral100: "#f4f4f5",
        neutral900: "#18181b",
        success: "#059669",
        warning: "#d97706",
        error: "#e11d48",
        surface: "#fafafa",
        background: "#ffffff"
      }
    }
  },
  plugins: []
};
