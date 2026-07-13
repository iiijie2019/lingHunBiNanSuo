import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RangeControlProps = {
  label: string;
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  decreaseDisabled?: boolean;
  increaseDisabled?: boolean;
};

function RangeControl({
  label,
  value,
  onDecrease,
  onIncrease,
  decreaseDisabled,
  increaseDisabled,
}: RangeControlProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.rangePanel,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText
        adjustsFontSizeToFit
        numberOfLines={1}
        minimumFontScale={0.55}
        style={styles.rangeValue}
      >
        {value}
      </ThemedText>
      <View style={styles.stepRow}>
        <Pressable
          accessibilityLabel={`${label}减一`}
          accessibilityRole="button"
          disabled={decreaseDisabled}
          hitSlop={8}
          onPress={onDecrease}
          style={({ pressed }) => [
            styles.stepButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
            decreaseDisabled && styles.disabled,
          ]}
        >
          <FontAwesome name="minus" size={13} color={theme.primary} />
        </Pressable>
        <View style={[styles.stepDivider, { backgroundColor: theme.backgroundSelected }]} />
        <Pressable
          accessibilityLabel={`${label}加一`}
          accessibilityRole="button"
          disabled={increaseDisabled}
          hitSlop={8}
          onPress={onIncrease}
          style={({ pressed }) => [
            styles.stepButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
            increaseDisabled && styles.disabled,
          ]}
        >
          <FontAwesome name="plus" size={13} color={theme.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function RandomNumberScreen() {
  const theme = useTheme();
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<number | null>(null);

  const generate = () => {
    setResult(Math.floor(Math.random() * (max - min + 1)) + min);
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel="返回上一页"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.dismiss()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="angle-left" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              返回
            </ThemedText>
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.backgroundElement }]}>
              <FontAwesome name="random" size={20} color={theme.primary} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>随机数生成器</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                设定整数范围，把选择交给随机
              </ThemedText>
            </View>
          </View>

          <ThemedView
            type="backgroundElement"
            style={[styles.card, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.sectionHeading}>
              <ThemedText type="smallBold">选择范围</ThemedText>
              <View style={[styles.rangeBadge, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.rangeBadgeText}>
                  共 {max - min + 1} 个整数
                </ThemedText>
              </View>
            </View>

            <View style={styles.rangeRow}>
              <RangeControl
                label="最小值"
                value={min}
                onDecrease={() => setMin((value) => value - 1)}
                onIncrease={() => setMin((value) => Math.min(max, value + 1))}
                increaseDisabled={min >= max}
              />
              <View style={styles.rangeConnector}>
                <View style={[styles.connectorLine, { backgroundColor: theme.backgroundSelected }]} />
                <ThemedText type="smallBold" themeColor="textSecondary">
                  至
                </ThemedText>
                <View style={[styles.connectorLine, { backgroundColor: theme.backgroundSelected }]} />
              </View>
              <RangeControl
                label="最大值"
                value={max}
                onDecrease={() => setMax((value) => Math.max(min, value - 1))}
                onIncrease={() => setMax((value) => value + 1)}
                decreaseDisabled={max <= min}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={generate}
              style={({ pressed }) => [
                styles.generateButton,
                { backgroundColor: theme.primary },
                pressed && styles.generateButtonPressed,
              ]}
            >
              <FontAwesome name="random" size={17} color={theme.background} />
              <ThemedText style={[styles.generateButtonText, { color: theme.background }]}>
                生成随机数
              </ThemedText>
            </Pressable>
          </ThemedView>

          <View
            style={[
              styles.resultCard,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: result === null ? theme.backgroundSelected : theme.primary,
              },
            ]}
          >
            <View style={styles.resultHeader}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                本次结果
              </ThemedText>
              {result !== null ? (
                <View style={[styles.readyDot, { backgroundColor: theme.primary }]} />
              ) : null}
            </View>
            <ThemedText
              adjustsFontSizeToFit
              minimumFontScale={0.45}
              numberOfLines={1}
              style={[styles.result, { color: result === null ? theme.textSecondary : theme.primary }]}
            >
              {result ?? '—'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.resultHint}>
              {result === null ? '点击上方按钮生成结果' : `已从 ${min} 至 ${max} 中随机选取`}
            </ThemedText>
          </View>

          <View style={styles.noteRow}>
            <FontAwesome name="info-circle" size={13} color={BrandColors.meteor} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              范围两端均包含在随机结果中
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: Math.min(MaxContentWidth, 560),
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.five,
  },
  backButton: {
    minHeight: 36,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.35,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 38,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.four,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rangeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rangeBadgeText: {
    fontSize: 12,
    lineHeight: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangePanel: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: Spacing.three,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rangeValue: {
    width: '100%',
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  rangeConnector: {
    width: 32,
    alignItems: 'center',
    gap: 5,
  },
  connectorLine: {
    width: 1,
    height: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  stepDivider: {
    width: 8,
    height: 1,
  },
  generateButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    shadowColor: BrandColors.deepSpace,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  generateButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    minHeight: 210,
    marginTop: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  readyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  result: {
    width: '100%',
    marginVertical: 4,
    fontSize: 76,
    lineHeight: 88,
    fontWeight: '800',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  resultHint: {
    textAlign: 'center',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: Spacing.three,
  },
  noteText: {
    fontSize: 12,
  },
});
