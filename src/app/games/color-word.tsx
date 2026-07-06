import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const COLORS = [
  { name: '红色', hex: '#FF3B30' },
  { name: '蓝色', hex: '#208AEF' },
  { name: '绿色', hex: '#34C759' },
  { name: '橙色', hex: '#FF9500' },
  { name: '紫色', hex: '#AF52DE' },
];

function randomPair() {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink;
  do { ink = COLORS[Math.floor(Math.random() * COLORS.length)]; }
  while (ink.name === word.name && COLORS.length > 1);
  return { word, ink };
}

export default function ColorWordScreen() {
  const [pair, setPair] = useState(randomPair);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const answer = useCallback((colorName: string) => {
    const correct = colorName === pair.ink.name;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
    setTotal((t) => t + 1);
    setTimeout(() => {
      setPair(randomPair());
      setFeedback(null);
    }, 500);
  }, [pair]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome name="angle-left" size={20} color="#AF52DE" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">颜色判断</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          选择字的颜色（墨水颜色），而不是字的意思
        </ThemedText>

        {/* 颜色字 */}
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText style={[styles.colorWord, { color: pair.ink.hex }]}>
            {pair.word.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            这个字的墨水颜色是？
          </ThemedText>
        </ThemedView>

        {/* 选项 */}
        <ThemedView style={styles.optionsGrid}>
          {COLORS.map((c) => (
            <Pressable
              key={c.name}
              style={({ pressed }) => [
                styles.optionBtn,
                pressed && styles.optionPressed,
              ]}
              onPress={() => answer(c.name)}
            >
              <ThemedView
                style={[styles.optionDot, { backgroundColor: c.hex }]}
              />
              <ThemedText type="small">{c.name}</ThemedText>
            </Pressable>
          ))}
        </ThemedView>

        {/* 得分 */}
        <ThemedView style={styles.scoreRow}>
          <ThemedView type="backgroundElement" style={styles.scoreItem}>
            <ThemedText style={styles.scoreNum}>{score}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">正确</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.scoreItem}>
            <ThemedText style={styles.scoreNum}>{total}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">总计</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.scoreItem}>
            <ThemedText style={styles.scoreNum}>
              {total > 0 ? Math.round((score / total) * 100) : 0}%
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">正确率</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 反馈 */}
        {feedback && (
          <ThemedText
            type="default"
            style={[
              styles.feedback,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            {feedback === 'correct' ? '✅ 正确！' : '❌ 再想想'}
          </ThemedText>
        )}
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
  subtitle: { marginTop: Spacing.one, marginBottom: Spacing.four },

  card: {
    paddingVertical: Spacing.six, borderRadius: Spacing.three,
    alignItems: 'center', gap: Spacing.two,
  },
  colorWord: { fontSize: 56, fontWeight: '900' },

  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two,
    marginTop: Spacing.four,
  },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderRadius: Spacing.three, borderWidth: 1.5, borderColor: '#C0C0C0',
  },
  optionPressed: { opacity: 0.6 },
  optionDot: { width: 16, height: 16, borderRadius: 8 },

  scoreRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  scoreItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  scoreNum: { fontSize: 22, fontWeight: '700' },

  feedback: { textAlign: 'center', marginTop: Spacing.three, fontSize: 18, fontWeight: '600' },
  feedbackCorrect: { color: '#34C759' },
  feedbackWrong: { color: '#FF3B30' },
});
