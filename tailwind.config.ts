import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        tavern: {
          50: "#fdf8f0",
          100: "#f5e6cc",
          200: "#e8c896",
          300: "#d4a054",
          400: "#c4882a",
          500: "#a06b1e",
          600: "#7d5318",
          700: "#5c3d12",
          800: "#3d280c",
          900: "#261a08",
          950: "#140d04",
        },
        warm: {
          50: "#fff9f0",
          100: "#fff0db",
          200: "#ffe0b8",
          300: "#ffc77a",
          400: "#ffa940",
          500: "#ff8c00",
          600: "#e67a00",
          700: "#b35e00",
          800: "#804300",
          900: "#4d2800",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Noto Sans SC",
          "Source Han Sans SC",
          "WenQuanYi Micro Hei",
          "sans-serif",
        ],
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        slideUp: "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
