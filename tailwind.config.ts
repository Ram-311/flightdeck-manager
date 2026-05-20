import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        cloud: "#f5f7fb",
        runway: "#145c64",
        sky: "#4f8fbf",
        signal: "#e15b4f",
        taxi: "#f4b942"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(23, 32, 42, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
