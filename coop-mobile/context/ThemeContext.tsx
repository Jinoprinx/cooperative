import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useColorScheme as useNativeWindColorScheme, vars } from 'nativewind';
import { useTenant } from './TenantContext';
import { View } from 'react-native';

interface ThemeContextType {
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  toggleColorScheme: () => void;
  primaryColor: string;
  themeVars: any;
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_PRIMARY = '#3b82f6';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme, setColorScheme, toggleColorScheme } = useNativeWindColorScheme();
  const { tenantDetails } = useTenant();
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY);

  useEffect(() => {
    if (tenantDetails?.branding?.primaryColor) {
      setPrimaryColor(tenantDetails.branding.primaryColor);
    } else {
      setPrimaryColor(DEFAULT_PRIMARY);
    }
  }, [tenantDetails]);

  const themeVars = useMemo(() => {
    return vars({
      '--primary': hexToRgb(primaryColor),
    });
  }, [primaryColor]);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme: colorScheme || 'dark',
        setColorScheme: (scheme) => setColorScheme(scheme),
        toggleColorScheme,
        primaryColor,
        themeVars,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
