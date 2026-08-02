import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        or: "#FF5F1F",
        ord: "#E04E10",
        bg: "#080808",
        bg2: "#101010",
        card: "#131313",
        card2: "#1A1A1A",
        bdr: "#1E1E1E",
        bdr2: "#282828",
        txt: "#F5F5F5",
        mut: "#6B6B6B",
        mut2: "#4A4A4A",
      },
      fontFamily: {
        display: ["var(--font-bebas)", "Bebas Neue", "cursive"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
