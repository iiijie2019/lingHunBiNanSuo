import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { BrandColors } from '@/constants/theme';

const logoSource = require('@/assets/images/liuyinji-mark.png');

type LogoSpinnerProps = {
  size?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Reusable clockwise brand loader for splash screens and async requests. */
export function LogoSpinner({
  size = 56,
  duration = 1100,
  style,
  accessibilityLabel = '正在加载',
}: LogoSpinnerProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
        isInteraction: false,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [duration, progress]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="progressbar"
      style={[{ width: size, height: size, transform: [{ rotate }] }, style]}
    >
      <Image source={logoSource} contentFit="contain" style={styles.image} />
    </Animated.View>
  );
}

type NetworkLoadingProps = {
  label?: string;
  size?: number;
  overlay?: boolean;
};

/** Standard loading state to use around future API requests. */
export function NetworkLoading({ label = '正在连接时间航道…', size = 64, overlay = false }: NetworkLoadingProps) {
  return (
    <View style={[styles.loading, overlay && styles.overlay]}>
      <LogoSpinner size={size} accessibilityLabel={label} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 900,
    backgroundColor: `${BrandColors.deepSpace}E8`,
  },
  label: {
    color: '#B8C8D3',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
