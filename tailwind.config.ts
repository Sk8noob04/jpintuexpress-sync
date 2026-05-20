import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Input dark mode
    "dark:bg-gray-800",
    "dark:bg-gray-700",
    "dark:bg-gray-800/70",
    "dark:border-gray-600",
    "dark:border-gray-700",
    "dark:text-gray-100",
    "dark:text-gray-200",
    "dark:text-gray-300",
    "dark:hover:bg-gray-600",
    // Frosted glass cards
    "dark:bg-white/5",
    "dark:bg-white/10",
    "dark:border-white/10",
    "dark:hover:bg-white/10",
    "dark:backdrop-blur-md",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          "50": "#eff6ff",
          "500": "#3b82f6",
          "600": "#2563eb",
          "700": "#1d4ed8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
