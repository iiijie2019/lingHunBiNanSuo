/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useThemeSettings } from '@/contexts/theme-context';

export function useTheme() {
  return useThemeSettings().colors;
}
