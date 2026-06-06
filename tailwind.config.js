/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Lato", "system-ui", "sans-serif"] },
      colors: {
        // Board Infinity — Primary Blue
        brand: {
          50: "#E6F7FF", 100: "#A3DDFF", 200: "#74C0F2", 300: "#49A2E6",
          400: "#2384D9", 500: "#0066CC", 600: "#004DA6", 700: "#003780",
          800: "#002459", 900: "#001333",
        },
        // Orange Peel (highlights / CTAs)
        peel: {
          50: "#FFFAE6", 100: "#FFEBA8", 200: "#FFDD80", 300: "#FFCD57",
          400: "#FFB92E", 500: "#FCA106", 600: "#D68100", 700: "#B06400",
          800: "#8A4900", 900: "#633200",
        },
        // Fiery Rose (alerts / badges)
        rose: {
          50: "#FFF1F0", 100: "#FFE9E8", 200: "#F7BBBA", 300: "#EB8A8C",
          400: "#DE5F66", 500: "#D13845", 600: "#AB2635", 700: "#851727",
          800: "#5E0B1B", 900: "#380611",
        },
        // Orange Red (secondary accents)
        flame: {
          50: "#FFF6F0", 100: "#FFEFE6", 200: "#FFD4BD", 300: "#FFB694",
          400: "#FF956B", 500: "#F46C40", 600: "#CF4F2B", 700: "#A8351B",
          800: "#82200E", 900: "#5C1309",
        },
        // Neutral ramp
        ink: {
          0: "#FFFFFF", 50: "#FAFAFA", 100: "#F5F5F5", 200: "#F0F0F0",
          300: "#D9D9D9", 400: "#BFBFBF", 500: "#8C8C8C", 600: "#595959",
          700: "#434343", 800: "#262626", 900: "#1F1F1F", 950: "#141414",
        },
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        lift: "0 8px 24px rgba(0,102,204,0.10)",
      },
    },
  },
  plugins: [],
};
