export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  primarySoft: string;
  primaryText: string;
  danger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  muted: string;
  tabBar: string;
}

export const darkTheme: ThemeColors = {
  background: '#0c0c0c',
  surface: '#181818',
  surfaceElevated: '#242424', // e.g card hovering or selected
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  border: '#333333',
  primary: '#4da6ff',
  primarySoft: 'rgba(77, 166, 255, 0.15)',
  primaryText: '#4da6ff',
  danger: '#ff4d4d',
  dangerSoft: 'rgba(255, 77, 77, 0.15)',
  success: '#4caf50',
  successSoft: 'rgba(76, 175, 80, 0.15)',
  muted: '#888888',
  tabBar: '#0c0c0c',
};

export const lightTheme: ThemeColors = {
  background: '#f5f6f8',
  surface: '#ffffff',
  surfaceElevated: '#eaecf0',
  textPrimary: '#1a1a1a',
  textSecondary: '#555555',
  border: '#d0d3db',
  primary: '#0066cc',
  primarySoft: 'rgba(0, 102, 204, 0.12)',
  primaryText: '#ffffff',
  danger: '#c0392b',
  dangerSoft: 'rgba(192, 57, 43, 0.12)',
  success: '#1e7e34',
  successSoft: 'rgba(30, 126, 52, 0.12)',
  muted: '#777777',
  tabBar: '#ffffff',
};

export const themes = {
  dark: darkTheme,
  light: lightTheme,
};
