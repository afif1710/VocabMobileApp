import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeColors, ThemeMode, darkTheme, lightTheme } from './colors';
import { useAppStore } from '../stores/appStore';

interface ThemeContextProps {
  mode: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  mode: 'dark',
  colors: darkTheme,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userSettings = useAppStore(s => s.userProgress?.settings);
  const updateSettings = useAppStore(s => s.updateSettings);
  
  const [mode, setMode] = useState<ThemeMode>('dark');

  // Load theme from user settings when it becomes available
  useEffect(() => {
    if (userSettings?.theme) {
      setMode(userSettings.theme as ThemeMode);
    }
  }, [userSettings?.theme]);

  const toggleTheme = () => {
    const newMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    // Persist to store
    if (updateSettings) {
      updateSettings({ theme: newMode } as any);
    }
  };

  const colors = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ mode, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
