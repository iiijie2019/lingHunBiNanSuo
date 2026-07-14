import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ACCENT = BrandColors.solar;
const SIDES = ['正面', '反面'] as const;

type CoinSide = 0 | 1;

function CoinArtwork({ side }: { side: CoinSide }) {
  return (
    <View style={styles.coinArtwork}>
      <Svg height="100%" viewBox="0 0 220 220" width="100%">
        <Defs>
          <LinearGradient id="coinEdge" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#FFF0A8" />
            <Stop offset="0.26" stopColor="#F7C750" />
            <Stop offset="0.58" stopColor="#B86A12" />
            <Stop offset="0.78" stopColor="#F9CF63" />
            <Stop offset="1" stopColor="#8E4B0B" />
          </LinearGradient>
          <LinearGradient id="coinFace" x1="0.08" x2="0.92" y1="0.04" y2="0.96">
            <Stop offset="0" stopColor="#FFF8C8" />
            <Stop offset="0.3" stopColor="#FFD76A" />
            <Stop offset="0.72" stopColor="#D88A19" />
            <Stop offset="1" stopColor="#A85B0D" />
          </LinearGradient>
          <LinearGradient id="coinShine" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.74" />
            <Stop offset="0.48" stopColor="#FFFFFF" stopOpacity="0.04" />
            <Stop offset="1" stopColor="#7A3B00" stopOpacity="0.24" />
          </LinearGradient>
        </Defs>
        <Circle cx="110" cy="110" fill="url(#coinEdge)" r="106" />
        <Circle cx="110" cy="110" fill="#8C4C0D" opacity="0.42" r="96" />
        <Circle cx="110" cy="106" fill="url(#coinFace)" r="94" />
        <Circle cx="110" cy="106" fill="none" r="81" stroke="#8D4D0E" strokeOpacity="0.5" strokeWidth="3" />
        <Circle cx="110" cy="106" fill="none" r="76" stroke="#FFF0A0" strokeOpacity="0.52" strokeWidth="1.5" />
        <Path
          d="M44 77c19-44 76-64 119-35"
          fill="none"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeOpacity="0.58"
          strokeWidth="8"
        />
        <Path
          d="M173 151c-20 36-65 51-103 31"
          fill="none"
          stroke="#7B3900"
          strokeLinecap="round"
          strokeOpacity="0.2"
          strokeWidth="7"
        />
        <Circle cx="110" cy="106" fill="url(#coinShine)" r="74" />
      </Svg>

      <View pointerEvents="none" style={styles.coinMark}>
        <ThemedText style={styles.coinMicrocopy}>{side === 0 ? 'HEADS' : 'TAILS'}</ThemedText>
        <ThemedText style={styles.coinCharacter}>{side === 0 ? '正' : '反'}</ThemedText>
        <View style={styles.coinStars}>
          <View style={styles.coinStarDot} />
          <FontAwesome name="star" size={9} color="#9A550D" />
          <View style={styles.coinStarDot} />
        </View>
      </View>
    </View>
  );
}

export default function CoinFlipScreen() {
  const theme = useTheme();
  const [flipping, setFlipping] = useState(false);
  const [displayedSide, setDisplayedSide] = useState<CoinSide>(0);
  const [result, setResult] = useState<CoinSide | null>(null);
  const [history, setHistory] = useState<CoinSide[]>([]);
  const [reduceMotion, setReduceMotion] = useState(false);
  const flipProgress = useRef(new Animated.Value(0)).current;
  const activeAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      mounted = false;
      subscription.remove();
      activeAnimation.current?.stop();
    };
  }, []);

  const finishFlip = (nextResult: CoinSide) => {
    setResult(nextResult);
    setHistory((current) => [nextResult, ...current].slice(0, 20));
    setFlipping(false);
    AccessibilityInfo.announceForAccessibility(`抛硬币结果：${SIDES[nextResult]}`);
  };

  const flip = () => {
    if (flipping) return;

    const nextResult: CoinSide = Math.random() < 0.5 ? 0 : 1;
    setFlipping(true);
    setResult(null);
    flipProgress.setValue(0);

    if (reduceMotion) {
      setDisplayedSide(nextResult);
      flipProgress.setValue(1);
      finishFlip(nextResult);
      return;
    }

    const firstHalf = Animated.timing(flipProgress, {
      toValue: 0.5,
      duration: 430,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    });
    activeAnimation.current = firstHalf;
    firstHalf.start(({ finished }) => {
      if (!finished) return;
      setDisplayedSide(nextResult);

      const secondHalf = Animated.timing(flipProgress, {
        toValue: 1,
        duration: 470,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
      activeAnimation.current = secondHalf;
      secondHalf.start(({ finished: secondFinished }) => {
        if (secondFinished) finishFlip(nextResult);
      });
    });
  };

  const positive = history.filter((side) => side === 0).length;
  const negative = history.length - positive;
  const positiveRate = history.length === 0 ? 0 : Math.round((positive / history.length) * 100);
  const coinRotation = flipProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '810deg', '1800deg'],
  });
  const coinScale = flipProgress.interpolate({
    inputRange: [0, 0.18, 0.5, 0.82, 1],
    outputRange: [1, 1.06, 0.82, 1.05, 1],
  });
  const coinLift = flipProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -28, 0],
  });
  const shadowScale = flipProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.58, 1],
  });
  const shadowOpacity = flipProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.22, 0.08, 0.22],
  });

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="返回上一页"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.dismiss()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="angle-left" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>返回</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${ACCENT}20` }]}>
              <FontAwesome name="dot-circle-o" size={21} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>抛硬币</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                当两个选择势均力敌，让运气替你决定
              </ThemedText>
            </View>
          </View>

          <ThemedView
            type="backgroundElement"
            style={[styles.heroCard, { borderColor: `${ACCENT}42` }]}
          >
            <View style={[styles.fairBadge, { backgroundColor: `${ACCENT}18` }]}>
              <View style={styles.fairDot} />
              <ThemedText type="smallBold" style={styles.fairText}>公平随机 · 50 / 50</ThemedText>
            </View>

            <Pressable
              accessibilityHint="随机得到硬币的正面或反面"
              accessibilityLabel={flipping ? '正在抛硬币' : '点击抛硬币'}
              accessibilityRole="button"
              accessibilityState={{ disabled: flipping }}
              disabled={flipping}
              onPress={flip}
              style={styles.coinStage}
            >
              <View style={[styles.orbitLarge, { borderColor: `${ACCENT}16` }]} />
              <View style={[styles.orbitSmall, { borderColor: `${ACCENT}24` }]} />
              <View style={styles.sparkLeft}>
                <FontAwesome name="star" size={9} color={`${ACCENT}A0`} />
              </View>
              <View style={styles.sparkRight}>
                <FontAwesome name="star" size={6} color={`${ACCENT}80`} />
              </View>

              <Animated.View
                style={[
                  styles.coinWrap,
                  {
                    transform: [
                      { perspective: 900 },
                      { translateY: coinLift },
                      { rotateY: coinRotation },
                      { scale: coinScale },
                    ],
                  },
                ]}
              >
                <CoinArtwork side={displayedSide} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.coinShadow,
                  { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] },
                ]}
              />
            </Pressable>

            <View style={styles.resultBlock}>
              <ThemedText
                accessibilityLiveRegion="polite"
                style={[styles.resultLabel, { color: result === null ? theme.text : ACCENT }]}
              >
                {flipping ? '命运正在旋转…' : result === null ? '准备好了吗？' : `是${SIDES[result]}！`}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.resultHint}>
                {flipping
                  ? '硬币落下前，答案仍在星光里'
                  : result === null
                    ? '轻点硬币或下方按钮开始'
                    : result === 0 ? '正面朝上，这就是本次选择' : '反面朝上，答案已经揭晓'}
              </ThemedText>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={flipping}
              onPress={flip}
              style={({ pressed }) => [
                styles.flipButton,
                pressed && !flipping && styles.flipButtonPressed,
                flipping && styles.disabled,
              ]}
            >
              <FontAwesome name={flipping ? 'circle-o-notch' : 'refresh'} size={17} color="#5C3500" />
              <ThemedText style={styles.flipButtonText}>
                {flipping ? '抛掷中…' : history.length === 0 ? '抛一次硬币' : '再抛一次'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView
            type="backgroundElement"
            style={[styles.statsCard, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText type="smallBold">抛掷统计</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">最近 20 次结果</ThemedText>
              </View>
              {history.length > 0 ? (
                <Pressable
                  accessibilityLabel="清空抛掷记录"
                  accessibilityRole="button"
                  hitSlop={8}
                  onPress={() => {
                    setHistory([]);
                    setResult(null);
                  }}
                  style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
                >
                  <FontAwesome name="trash-o" size={13} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">清空</ThemedText>
                </Pressable>
              ) : null}
            </View>

            <View style={[styles.statsRow, { backgroundColor: theme.background }]}>
              <View style={styles.statItem}>
                <ThemedText style={[styles.statNumber, { color: ACCENT }]}>{positive}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">正面</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{negative}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">反面</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
              <View style={styles.statItem}>
                <ThemedText style={styles.statNumber}>{positiveRate}%</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">正面率</ThemedText>
              </View>
            </View>

            {history.length > 0 ? (
              <View style={styles.historyWrap}>
                {history.map((side, index) => (
                  <View
                    accessibilityLabel={`第 ${index + 1} 个记录：${SIDES[side]}`}
                    key={`${index}-${side}`}
                    style={[
                      styles.historyCoin,
                      side === 0
                        ? styles.historyCoinHeads
                        : { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.historyCoinText,
                        side === 0 && styles.historyCoinTextHeads,
                      ]}
                    >
                      {side === 0 ? '正' : '反'}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyHistory}>
                <FontAwesome name="history" size={16} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">抛掷后，记录会出现在这里</ThemedText>
              </View>
            )}
          </ThemedView>

          <View style={styles.noteRow}>
            <FontAwesome name="info-circle" size={13} color={BrandColors.meteor} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              每次抛掷相互独立，历史结果不会影响下一次
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  backButton: {
    minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  headerTitle: { fontSize: 30, lineHeight: 38 },
  heroCard: {
    alignItems: 'center', borderRadius: 28, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.three,
    overflow: 'hidden',
  },
  fairBadge: {
    zIndex: 2, flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    minHeight: 30, paddingHorizontal: Spacing.three, borderRadius: 15, gap: Spacing.two,
  },
  fairDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  fairText: { color: '#B36B05', fontSize: 12 },
  coinStage: {
    width: '100%', height: 270, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  orbitLarge: {
    position: 'absolute', width: 270, height: 270, borderRadius: 135,
    borderWidth: 1, transform: [{ scaleY: 0.55 }, { rotate: '-13deg' }],
  },
  orbitSmall: {
    position: 'absolute', width: 218, height: 218, borderRadius: 109,
    borderWidth: 1, transform: [{ scaleY: 0.62 }, { rotate: '19deg' }],
  },
  sparkLeft: { position: 'absolute', left: '16%', top: 74 },
  sparkRight: { position: 'absolute', right: '17%', bottom: 74 },
  coinWrap: {
    width: 184, height: 184, zIndex: 2,
    shadowColor: '#6B3A00', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3,
    shadowRadius: 18, elevation: 12,
  },
  coinArtwork: { flex: 1 },
  coinMark: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center', paddingTop: 4,
  },
  coinMicrocopy: {
    color: '#92500C', fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 2.4,
  },
  coinCharacter: {
    color: '#7B3F06', fontSize: 64, lineHeight: 76, fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.38)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 0,
  },
  coinStars: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  coinStarDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#9A550D' },
  coinShadow: {
    position: 'absolute', bottom: 24, width: 128, height: 15, borderRadius: 999,
    backgroundColor: '#4C2900',
  },
  resultBlock: { alignItems: 'center', gap: Spacing.half, minHeight: 58, paddingHorizontal: Spacing.two },
  resultLabel: { fontSize: 23, lineHeight: 30, fontWeight: '800', textAlign: 'center' },
  resultHint: { textAlign: 'center' },
  flipButton: {
    width: '100%', minHeight: 52, marginTop: Spacing.three, borderRadius: 18,
    backgroundColor: ACCENT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.two, shadowColor: ACCENT, shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.24, shadowRadius: 12, elevation: 5,
  },
  flipButtonText: { color: '#5C3500', fontSize: 16, lineHeight: 22, fontWeight: '800' },
  flipButtonPressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  statsCard: {
    borderRadius: 24, padding: Spacing.three, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearButton: { flexDirection: 'row', alignItems: 'center', padding: Spacing.two, gap: Spacing.one },
  statsRow: {
    minHeight: 82, flexDirection: 'row', alignItems: 'center', borderRadius: 18,
    paddingHorizontal: Spacing.two,
  },
  statItem: { flex: 1, alignItems: 'center', gap: Spacing.half },
  statNumber: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 34 },
  historyWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  historyCoin: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  historyCoinHeads: { backgroundColor: '#FFF0B8', borderColor: '#E6A62D' },
  historyCoinText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
  historyCoinTextHeads: { color: '#8B4C08' },
  emptyHistory: {
    minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.two,
  },
  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
    paddingHorizontal: Spacing.three, gap: Spacing.two,
  },
  noteText: { flexShrink: 1, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.68 },
});
