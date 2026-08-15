import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B1F1A",
          900: "#102C25",
          800: "#173B31",
          700: "#1F4C3F",
        },
        chalk: {
          50: "#F7F5EF",
          100: "#EFEBDF",
        },
        amber: {
          400: "#E8A33D",
          500: "#D98E1F",
          600: "#B8730F",
        },
        line: "#2B4A3D",
      },
      fontFamily: {
        display: ["'Fraunces'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
