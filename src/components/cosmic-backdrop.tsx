import { useIsFocused } from '@react-navigation/native';
import { memo, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, StyleSheet, View } from 'react-native';

import { BrandColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const STARS = [
  { left: '7%', top: '9%', size: 2, opacity: 0.55 },
  { left: '18%', top: '21%', size: 3, opacity: 0.28 },
  { left: '31%', top: '6%', size: 2, opacity: 0.38 },
  { left: '43%', top: '17%', size: 2, opacity: 0.62 },
  { left: '57%', top: '8%', size: 3, opacity: 0.32 },
  { left: '72%', top: '24%', size: 2, opacity: 0.5 },
  { left: '88%', top: '12%', size: 2, opacity: 0.65 },
  { left: '94%', top: '37%', size: 3, opacity: 0.24 },
  { left: '12%', top: '46%', size: 2, opacity: 0.35 },
  { left: '82%', top: '52%', size: 2, opacity: 0.42 },
  { left: '23%', top: '68%', size: 3, opacity: 0.2 },
  { left: '91%', top: '74%', size: 2, opacity: 0.55 },
  { left: '8%', top: '87%', size: 2, opacity: 0.48 },
  { left: '49%', top: '91%', size: 3, opacity: 0.24 },
  { left: '76%', top: '96%', size: 2, opacity: 0.4 },
] as const;

/** Lightweight decorative layer shared by all full-page surfaces. */
export const CosmicBackdrop = memo(function CosmicBackdrop() {
  const theme = useTheme();
  const isDark = theme.background === BrandColors.deepSpace;
  const isFocused = useIsFocused();
  const [reduceMotion, setReduceMotion] = useState(false);
  const meteorTravel = useRef(new Animated.Value(0)).current;
  // Web's Animated driver runs this loop on the JS thread. Keep the decorative
  // meteor native-only so it cannot compete with scrolling and input handling.
  const shouldAnimateMeteor = Platform.OS !== 'web' && isFocused && !reduceMotion;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    meteorTravel.stopAnimation();
    meteorTravel.setValue(0);
    if (!shouldAnimateMeteor) return undefined;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(2400),
        Animated.timing(meteorTravel, {
          toValue: 1,
          duration: 1100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.delay(3200),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [meteorTravel, shouldAnimateMeteor]);

  const meteorOpacity = meteorTravel.interpolate({
    inputRange: [0, 0.12, 0.72, 1],
    outputRange: [0, isDark ? 0.58 : 0.2, isDark ? 0.38 : 0.12, 0],
  });
  const meteorX = meteorTravel.interpolate({ inputRange: [0, 1], outputRange: [-40, 240] });
  const meteorY = meteorTravel.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[
          styles.nebula,
          styles.nebulaTop,
          { backgroundColor: isDark ? BrandColors.cosmicViolet : BrandColors.cometBlue },
        ]}
      />
      {shouldAnimateMeteor ? (
        <Animated.View
          renderToHardwareTextureAndroid
          style={[
            styles.meteor,
            {
              opacity: meteorOpacity,
              transform: [{ translateX: meteorX }, { translateY: meteorY }, { rotate: '23deg' }],
            },
          ]}
        >
          <View style={styles.meteorTail} />
          <View style={styles.meteorHead} />
        </Animated.View>
      ) : null}
      <View
        style={[
          styles.nebula,
          styles.nebulaBottom,
          { backgroundColor: BrandColors.aurora },
        ]}
      />
      <View
        style={[
          styles.orbit,
          {
            borderColor: isDark ? `${BrandColors.cometBlue}18` : `${BrandColors.deepSpace}0A`,
          },
        ]}
      />
      {STARS.map((star, index) => (
        <View
          key={index}
          style={[
            styles.star,
            {
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              borderRadius: star.size / 2,
              opacity: isDark ? star.opacity : star.opacity * 0.32,
              backgroundColor: isDark ? BrandColors.starlight : BrandColors.deepSpace,
            },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  nebula: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.055,
  },
  nebulaTop: {
    top: -150,
    right: -110,
  },
  nebulaBottom: {
    bottom: -180,
    left: -150,
  },
  orbit: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    borderWidth: 1,
    top: 110,
    right: -300,
    transform: [{ rotate: '-18deg' }],
  },
  star: {
    position: 'absolute',
  },
  meteor: {
    position: 'absolute',
    top: 52,
    left: -30,
    width: 86,
    height: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meteorTail: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColors.cometBlue,
  },
  meteorHead: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: BrandColors.starlight,
  },
});
