import { createContext, useContext } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { CosmicBackdrop } from '@/components/cosmic-backdrop';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  cosmic?: boolean;
};

const CosmicSurfaceContext = createContext(false);

export function ThemedView({ style, lightColor, darkColor, type, cosmic, children, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  const isInsideCosmicScreen = useContext(CosmicSurfaceContext);
  const backgroundColor = cosmic || !isInsideCosmicScreen || type
    ? theme[type ?? 'background']
    : 'transparent';
  const surfaceStyle = type === 'backgroundElement'
    ? { borderColor: theme.backgroundSelected, borderWidth: StyleSheet.hairlineWidth }
    : undefined;

  const content = (
    <View style={[{ backgroundColor }, surfaceStyle, style]} {...otherProps}>
      {cosmic ? <CosmicBackdrop /> : null}
      {children}
    </View>
  );

  return cosmic
    ? <CosmicSurfaceContext.Provider value>{content}</CosmicSurfaceContext.Provider>
    : content;
}
