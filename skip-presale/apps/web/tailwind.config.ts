import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./config/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050505",
        panel: "#0d0d0d",
        line: "rgba(255, 106, 0, 0.22)",
        neon: "#ff6a00",
        acid: "#ff8a00"
      },
      boxShadow: {
        glow: "0 0 46px rgba(255, 106, 0, 0.28)"
      }
    }
  },
  plugins: []
};

export default config;
