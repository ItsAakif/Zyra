import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsService } from './settings';

export interface Theme {
  colors: {
    // Background colors
    background: string;
    surface: string;
    card: string;
    modal: string;
    
    // Text colors
    text: string;
    textSecondary: string;
    textTertiary: string;
    
    // Primary colors
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // Accent colors
    accent: string;
    success: string;
    warning: string;
    error: string;
    
    // Border colors
    border: string;
    divider: string;
    
    // Special colors
    shadow: string;
    overlay: string;
    
    // Tab bar
    tabBar: string;
    tabBarText: string;
    tabBarActive: string;
  };
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F9FAFB',
    card: '#FFFFFF',
    modal: '#FFFFFF',
    
    text: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    
    primary: '#3B82F6',
    primaryLight: '#EFF6FF',
    primaryDark: '#1E40AF',
    
    accent: '#10B981',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    border: '#E5E7EB',
    divider: '#F3F4F6',
    
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    tabBar: '#FFFFFF',
    tabBarText: '#6B7280',
    tabBarActive: '#3B82F6',
  },
  isDark: false,
};

export const darkTheme: Theme = {
  colors: {
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    modal: '#1E293B',
    
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    primary: '#60A5FA',
    primaryLight: '#1E3A8A',
    primaryDark: '#3B82F6',
    
    accent: '#34D399',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    
    border: '#475569',
    divider: '#374151',
    
    shadow: 'rgba(0, 0, 0, 0.3)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    tabBar: '#1E293B',
    tabBarText: '#94A3B8',
    tabBarActive: '#60A5FA',
  },
  isDark: true,
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load theme preference from settings
    const loadTheme = async () => {
      try {
        const settings = await settingsService.getSettings();
        setIsDark(settings.darkMode);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await settingsService.updateSetting('darkMode', newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
