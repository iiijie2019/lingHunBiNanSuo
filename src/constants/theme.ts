/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/** Shared brand palette. Keep native splash, logo assets, and app surfaces in sync. */
export const BrandColors = {
  deepSpace: '#081A2F',
  deepSpaceElevated: '#102A46',
  deepSpaceSelected: '#183B5C',
  starlight: '#F1F6F9',
  silver: '#B8C8D3',
  meteor: '#71899B',
  cometBlue: '#5CB9FF',
  aurora: '#45D6C8',
  cosmicViolet: '#A78BFA',
  solar: '#FFC857',
  novaRose: '#FF6B8A',
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#F2F7FB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DCEAF4',
    textSecondary: '#536A7B',
    primary: BrandColors.deepSpace,
  },
  dark: {
    text: BrandColors.starlight,
    background: BrandColors.deepSpace,
    backgroundElement: '#102B49',
    backgroundSelected: '#1A4268',
    textSecondary: BrandColors.silver,
    primary: BrandColors.cometBlue,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
