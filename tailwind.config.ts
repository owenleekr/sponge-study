import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1124",
          900: "#0F1729",
          800: "#172238",
          700: "#1F2E4A",
          600: "#2A3C5E",
          500: "#3B4E73",
        },
        gold: {
          50: "#FFF8E1",
          100: "#FFECB3",
          200: "#FFE082",
          300: "#FFD54F",
          400: "#FFCA28",
          500: "#FFC107",
          600: "#FFB300",
          700: "#FFA000",
        },
        cream: {
          50: "#FFFBF3",
          100: "#FBF1DE",
          200: "#F5E6C6",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Pretendard",
          "'Apple SD Gothic Neo'",
          "system-ui",
          "sans-serif",
        ],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        gold: "0 10px 40px -10px rgba(255, 193, 7, 0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
