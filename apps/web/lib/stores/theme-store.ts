import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      toggle: () =>
        set((state) => {
          const next: Record<Theme, Theme> = {
            light: "dark",
            dark: "system",
            system: "light",
          };
          return { theme: next[state.theme] };
        }),
    }),
    {
      name: "fulluf-theme",
      partialize: (s) => ({ theme: s.theme }),
    }
  )
);
