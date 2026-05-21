import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./config/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#05080d",
        panel: "#0b1118",
        line: "rgba(141, 255, 225, 0.18)",
        neon: "#49ffd0",
        acid: "#b7ff4a"
      },
      boxShadow: {
        glow: "0 0 40px rgba(73, 255, 208, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
