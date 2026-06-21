/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium corporate navy & dark charcoal theme
        brand: {
          dark: "#0F172A",      // Deep navy/charcoal slate-900
          card: "#1E293B",      // Card background slate-800
          accent: "#0D9488",    // Confident teal accent teal-600
          accentHover: "#0F766E", // teal-700
          textMuted: "#94A3B8", // slate-400
          textLight: "#F8FAFC"  // slate-50
        }
      }
    },
  },
  plugins: [],
}
