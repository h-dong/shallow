import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type Theme = {
  name: "light" | "dark";
  contrast: "normal" | "high";
};

const ThemeContext = createContext<Theme>({
  name: "light",
  contrast: "normal",
});

type ThemeProviderProps = {
  value: Theme;
  children: ReactNode;
};

export function ThemeProvider({ value, children }: ThemeProviderProps) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

type ThemeLabelProps = {
  name: string;
  contrast: string;
};

export function ThemeLabel({ name, contrast }: ThemeLabelProps) {
  return (
    <span>
      {name} theme, {contrast} contrast
    </span>
  );
}

export function ThemeSummary() {
  const theme = useTheme();

  return <ThemeLabel name={theme.name} contrast={theme.contrast} />;
}
