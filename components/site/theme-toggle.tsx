"use client";

import { Moon, Sun } from "lucide-react";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.contains("dark") ? "light" : "dark";
  const apply = () => {
    root.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem("theme", next);
    } catch {}
  };
  // Cross-fade where supported; instant swap otherwise or with reduced motion.
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "startViewTransition" in document) document.startViewTransition(apply);
  else apply();
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle color theme"
      className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-[color,background-color,scale] duration-150 ease-ui-out hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.97]"
    >
      <Sun className="hidden size-4 dark:block" aria-hidden="true" />
      <Moon className="size-4 dark:hidden" aria-hidden="true" />
    </button>
  );
}
