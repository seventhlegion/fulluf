"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useThemeStore } from "@/lib/stores/theme-store";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();
  const { setTheme, resolvedTheme } = useTheme();

  // Sync Zustand store with next-themes when store changes
  useEffect(() => {
    setTheme(theme);
  }, [theme, setTheme]);

  const handleToggle = () => {
    toggle();
    setTheme(useThemeStore.getState().theme);
  };

  const isDark = resolvedTheme === "dark";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <SunIcon className="size-5" />
          ) : (
            <MoonIcon className="size-5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {theme === "system"
          ? `System (${resolvedTheme ?? "light"})`
          : theme === "dark"
            ? "Dark"
            : "Light"}
        — click to cycle
      </TooltipContent>
    </Tooltip>
  );
}
