import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const SIDES = ['正面', '反面'] as const;

export default function CoinFlipScreen() {
  const [flipping, setFlipping] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  const flip = () => {
    setFlipping(true);
    setResult(null);
    setTimeout(() => {
      const r = Math.random() < 0.5 ? 0 : 1;
      setResult(r);
      setHistory((h) => [r, ...h].slice(0, 20));
      setFlipping(false);
    }, 600);
  };

  const positive = history.filter((h) => h === 0).length;
  const negative = history.filter((h) => h === 1).length;

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#FF9500" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">抛硬币</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            做个简单的二选一决定
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          {/* 硬币动画区 */}
          <Pressable onPress={flip} disabled={flipping} style={styles.coinArea}>
            <ThemedText style={[styles.coin, flipping && styles.coinFlipping]}>🪙</ThemedText>
            {result !== null && (
              <ThemedText style={styles.resultLabel}>{SIDES[result]}！</ThemedText>
            )}
          </Pressable>

          <Pressable style={[styles.btn, { backgroundColor: '#FF9500' }]} onPress={flip} disabled={flipping}>
            <FontAwesome name="dot-circle-o" size={18} color="#FFFFFF" />
            <ThemedText style={styles.btnText}>
              {flipping ? '抛掷中...' : '抛硬币'}
            </ThemedText>
          </Pressable>

          {/* 统计 */}
          {history.length > 0 && (
            <ThemedView style={styles.statsRow}>
              <ThemedView style={styles.statBadge}>
                <ThemedText style={styles.statNum}>{positive}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">正面</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statBadge}>
                <ThemedText style={styles.statNum}>{negative}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">反面</ThemedText>
              </ThemedView>
              <ThemedView style={styles.statBadge}>
                <ThemedText style={styles.statNum}>{history.length}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">总计</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {/* 历史 */}
          {history.length > 0 && (
            <ThemedView style={styles.historyRow}>
              {history.map((h, i) => (
                <ThemedView
                  key={i}
                  style={[styles.historyDot, { backgroundColor: h === 0 ? '#FF9500' : '#C0C0C0' }]}
                />
              ))}
            </ThemedView>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.two, alignSelf: 'flex-start',
  },
  backLabel: { color: '#FF9500' },
  header: { paddingBottom: Spacing.four, gap: Spacing.half },

  card: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.four, alignItems: 'center' },

  coinArea: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  coin: { fontSize: 80, lineHeight: 92 },
  coinFlipping: { opacity: 0.25 },
  resultLabel: { fontSize: 22, fontWeight: '700', color: '#FF9500', lineHeight: 28 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.six,
    borderRadius: Spacing.three, gap: Spacing.two,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: Spacing.three, width: '100%' },
  statBadge: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  statNum: { fontSize: 20, fontWeight: '700', lineHeight: 26 },

  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  historyDot: { width: 10, height: 10, borderRadius: 5 },
});
