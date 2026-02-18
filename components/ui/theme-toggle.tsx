"use client";

import { useTheme } from "next-themes";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full border border-line bg-elevated px-3 py-1.5 text-xs font-medium tracking-wide text-muted transition hover:border-ink hover:text-ink"
    >
      {theme === "dark" ? "Light" : "Dark"} mode
    </button>
  );
};
