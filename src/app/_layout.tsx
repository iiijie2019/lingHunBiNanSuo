import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import React from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BrandColors, Colors } from '@/constants/theme';
import { StoreProvider } from '@/stores/useStore';

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.backgroundElement,
      notification: BrandColors.meteor,
    },
  };

  return (
    <StoreProvider>
      <ThemeProvider value={navigationTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false, freezeOnBlur: true }} />
      </ThemeProvider>
    </StoreProvider>
  );
}
