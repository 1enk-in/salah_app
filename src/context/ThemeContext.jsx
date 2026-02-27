import { createContext, useContext, useState } from "react";
import { themes } from "../theme/themes";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState("emerald");

  const value = {
    theme: themes[currentTheme],
    currentTheme,
    setCurrentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
