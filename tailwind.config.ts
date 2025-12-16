import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/magicui/**/*.{ts,tsx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      animation: {
        greenFade: "greenFade 10s ease-in-out infinite",
        greenFadeSlow: "greenFadeSlow 14s ease-in-out infinite",
        greenFadeDelay: "greenFadeDelay 12s ease-in-out infinite",
      },
      keyframes: {
        greenFade: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(30px,-40px) scale(1.15)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
        greenFadeSlow: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(-40px,20px) scale(1.1)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
        greenFadeDelay: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(20px,30px) scale(1.12)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui")
  ],

  daisyui: {
    themes: ["light"],
  },
};

export default config;
