import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const DICE: Record<number, string> = { 1: '⚀', 2: '⚁', 3: '⚂', 4: '⚃', 5: '⚄', 6: '⚅' };

export default function DiceRollScreen() {
  const [count, setCount] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [results, setResults] = useState<number[]>([]);

  const roll = () => {
    setRolling(true);
    setResults([]);
    setTimeout(() => {
      setResults(Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1));
      setRolling(false);
    }, 500);
  };

  const total = results.reduce((a, b) => a + b, 0);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome name="angle-left" size={20} color="#AF52DE" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">掷骰子</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            选择数量，点击投掷
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          {/* 数量选择 */}
          <ThemedText type="small" themeColor="textSecondary">骰子数量</ThemedText>
          <ThemedView style={styles.countRow}>
            {[1, 2, 3, 4].map((n) => (
              <Pressable
                key={n}
                style={[styles.countBtn, count === n && styles.countActive]}
                onPress={() => setCount(n)}
              >
                <ThemedText style={[styles.countText, count === n && styles.countTextActive]}>
                  {n} 颗
                </ThemedText>
              </Pressable>
            ))}
          </ThemedView>

          {/* 骰子 */}
          <ThemedView style={styles.diceRow}>
            {results.length > 0
              ? results.map((r, i) => (
                  <ThemedText key={i} style={styles.diceFace}>{DICE[r]}</ThemedText>
                ))
              : Array.from({ length: count }).map((_, i) => (
                  <ThemedText key={i} style={[styles.diceFace, rolling && styles.rolling]}>🎲</ThemedText>
                ))}
          </ThemedView>

          {results.length > 0 && count > 1 && (
            <ThemedView style={styles.totalBox}>
              <ThemedText type="small" themeColor="textSecondary">合计</ThemedText>
              <ThemedText style={styles.totalText}>{total}</ThemedText>
            </ThemedView>
          )}

          <Pressable style={[styles.btn, { backgroundColor: '#AF52DE' }]} onPress={roll} disabled={rolling}>
            <FontAwesome name="cube" size={18} color="#FFFFFF" />
            <ThemedText style={styles.btnText}>
              {rolling ? '投掷中...' : '掷骰子'}
            </ThemedText>
          </Pressable>
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
  backLabel: { color: '#AF52DE' },
  header: { paddingBottom: Spacing.four, gap: Spacing.half },

  card: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.four, alignItems: 'center' },

  countRow: { flexDirection: 'row', gap: Spacing.two },
  countBtn: {
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderRadius: Spacing.three, borderWidth: 1.5, borderColor: '#C0C0C0',
  },
  countActive: { backgroundColor: '#AF52DE', borderColor: '#AF52DE' },
  countText: { fontSize: 14, fontWeight: '600' },
  countTextActive: { color: '#FFFFFF' },

  diceRow: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  diceFace: { fontSize: 56 },
  rolling: { opacity: 0.25 },

  totalBox: { alignItems: 'center', gap: Spacing.half },
  totalText: { fontSize: 36, fontWeight: '800', color: '#AF52DE' },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.six,
    borderRadius: Spacing.three, gap: Spacing.two,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
