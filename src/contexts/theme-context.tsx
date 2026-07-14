import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  DefaultThemeId,
  ThemePresets,
  type ThemeColors,
  type ThemeId,
} from '@/constants/theme';

const THEME_STORAGE_KEY = '@linghun_theme_id';

type ThemeContextValue = {
  themeId: ThemeId;
  colors: ThemeColors;
  colorScheme: 'light' | 'dark';
  setThemeId: (themeId: ThemeId) => void;
};

const defaultPreset = ThemePresets[DefaultThemeId];
const ThemeContext = createContext<ThemeContextValue>({
  themeId: DefaultThemeId,
  colors: defaultPreset.colors,
  colorScheme: defaultPreset.colorScheme,
  setThemeId: () => {},
});

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && Object.prototype.hasOwnProperty.call(ThemePresets, value);
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DefaultThemeId);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedThemeId) => {
        if (!cancelled && isThemeId(storedThemeId)) setThemeIdState(storedThemeId);
      })
      .catch((error: unknown) => console.warn('[theme] Failed to load theme:', error));
    return () => { cancelled = true; };
  }, []);

  const setThemeId = useCallback((nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextThemeId)
      .catch((error: unknown) => console.warn('[theme] Failed to save theme:', error));
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const preset = ThemePresets[themeId];
    return {
      themeId,
      colors: preset.colors,
      colorScheme: preset.colorScheme,
      setThemeId,
    };
  }, [setThemeId, themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSettings() {
  return useContext(ThemeContext);
}
