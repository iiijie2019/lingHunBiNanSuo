import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BrandColors } from '@/constants/theme';
import { AppThemeProvider, useThemeSettings } from '@/contexts/theme-context';
import { VideoPlayerProvider } from '@/plugins/video-player';
import { StoreProvider } from '@/stores/useStore';

// Set a dark-safe native root color before React mounts so no white system
// surface can appear while the persisted theme is being restored.
void SystemUI.setBackgroundColorAsync(BrandColors.deepSpace);

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <RootNavigator />
    </AppThemeProvider>
  );
}

function RootNavigator() {
  const { colorScheme, colors } = useThemeSettings();
  const isDark = colorScheme === 'dark';
  const videoPlayerTheme = useMemo(() => ({
    // Keep media playback in the app's deep-space dark visual language even
    // if a user has selected the optional light content theme.
    background: BrandColors.deepSpace,
    surface: BrandColors.deepSpaceElevated,
    surfaceRaised: BrandColors.deepSpaceSelected,
    text: BrandColors.starlight,
    textMuted: BrandColors.silver,
    accent: BrandColors.cometBlue,
    accentSecondary: BrandColors.aurora,
    track: BrandColors.deepSpaceSelected,
    danger: BrandColors.novaRose,
  }), []);
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

  useEffect(() => {
    // Keep the native root view in sync with the active theme. Native stack
    // transitions can briefly reveal this layer around the moving screens.
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <ThemeProvider value={navigationTheme}>
      <VideoPlayerProvider returnOrientation="portrait" theme={videoPlayerTheme}>
        <StoreProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <AnimatedSplashOverlay />
          <Stack
            screenOptions={{
              animation: Platform.OS === 'web' ? 'fade' : 'slide_from_right',
              contentStyle: { backgroundColor: colors.background },
              freezeOnBlur: true,
              gestureDirection: 'horizontal',
              gestureEnabled: true,
              headerShown: false,
            }}
          />
        </StoreProvider>
      </VideoPlayerProvider>
    </ThemeProvider>
  );
}
