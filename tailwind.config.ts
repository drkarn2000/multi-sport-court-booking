import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pc: {
          green: "#1e503e",
          deep: "#12382b",
          nav: "#12251d",
          adminGreen: "#176b4d",
          lime: "#dff27a",
          olive: "#3f6a28",
          cream: "#e8f3ec",
          surface: "#f2faf4",
          band: "#dbece2",
          badge: "#d8f0c8",
          badgeText: "#1c4a22",
          muted: "#365043",
          line: "#bed6c7",
          text: "#0e271d",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 16px 36px rgba(18, 56, 43, 0.10)",
        float: "0 16px 42px rgba(18, 56, 43, 0.16)",
        admin: "0 8px 24px rgba(18, 56, 43, 0.07)",
      },
    },
  },
  plugins: [],
};
export default config;
