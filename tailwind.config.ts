import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        panel: "var(--panel)",
        elevated: "var(--elevated)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        soft: "var(--soft)",
        line: "var(--line)",
        accent: "var(--accent)",
        correct: "var(--correct)",
        incorrect: "var(--incorrect)",
        warning: "var(--warning)",
      },
      fontFamily: {
        headline: ["var(--font-headline)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
    },
  },
};

export default config;
