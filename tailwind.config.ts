import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff5f2", 100: "#ffe6de", 200: "#ffc7b5", 300: "#ff9f82",
          400: "#fb7148", 500: "#e8501f", 600: "#c63d12", 700: "#a12f10",
          800: "#7f2812", 900: "#682413",
        },
        olive: { 500: "#5b7a3a", 600: "#48622d" },
      },
      fontFamily: { sans: ["system-ui", "Segoe UI", "Roboto", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
