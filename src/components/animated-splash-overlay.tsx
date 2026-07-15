import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';

import { LogoSpinner } from '@/components/logo-spinner';
import { BrandColors } from '@/constants/theme';

const HOLD_DURATION = 1050;
const EXIT_DURATION = 320;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') SplashScreen.hide();

    const animation = Animated.sequence([
      Animated.delay(HOLD_DURATION),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: EXIT_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(scale, {
          toValue: 0.92,
          duration: EXIT_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      ]),
    ]);

    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });

    return () => animation.stop();
  }, [opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.brand, { transform: [{ scale }] }]}>
        <LogoSpinner size={172} duration={900} accessibilityLabel="夜航正在启动" />
        <View style={styles.copy}>
          <Text style={styles.name}>夜航</Text>
          <Text style={styles.tagline}>沿时间之流，驶向未知</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.deepSpace,
  },
  brand: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  copy: {
    alignItems: 'center',
    gap: 6,
  },
  name: {
    color: '#F1F6F9',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 8,
    marginLeft: 8,
  },
  tagline: {
    color: '#71899B',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 2,
  },
});
