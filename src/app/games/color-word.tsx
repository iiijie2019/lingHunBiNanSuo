import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

const COLORS = [
  { name: '红色', hex: '#FF3B30' },
  { name: '蓝色', hex: '#208AEF' },
  { name: '绿色', hex: '#34C759' },
  { name: '橙色', hex: '#FF9500' },
  { name: '紫色', hex: '#AF52DE' },
];

const ROUND_LENGTH = 10;

function randomPair() {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  let ink;
  do { ink = COLORS[Math.floor(Math.random() * COLORS.length)]; }
  while (ink.name === word.name && COLORS.length > 1);
  return { word, ink };
}

export default function ColorWordScreen() {
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.colorWord;
  const [pair, setPair] = useState(randomPair);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    setPair(randomPair());
    setScore(0);
    setTotal(0);
    setFeedback(null);
    setStarted(true);
    setGameOver(false);
  }, []);

  const answer = useCallback((colorName: string) => {
    if (feedback || gameOver || !started) return;
    const correct = colorName === pair.ink.name;
    const nextScore = score + (correct ? 1 : 0);
    const nextTotal = total + 1;
    setFeedback(correct ? 'correct' : 'wrong');
    setScore(nextScore);
    setTotal(nextTotal);
    nextTimerRef.current = setTimeout(() => {
      if (nextTotal >= ROUND_LENGTH) {
        const accuracy = Math.round((nextScore / nextTotal) * 100);
        dispatch({ type: 'SAVE_GAME_RECORD', game: 'colorWord', score: nextScore, extra1: accuracy });
        setGameOver(true);
      } else {
        setPair(randomPair());
      }
      setFeedback(null);
    }, 500);
  }, [dispatch, feedback, gameOver, pair, score, started, total]);

  useEffect(() => () => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
  }, []);

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#AF52DE" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">颜色判断</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          选择字的颜色（墨水颜色），而不是字的意思
        </ThemedText>

        {!started || gameOver ? (
          <ThemedView type="backgroundElement" style={styles.startCard}>
            <ThemedText style={styles.startEmoji}>{gameOver ? '🏆' : '🎨'}</ThemedText>
            {gameOver ? (
              <>
                <ThemedText style={styles.endScore}>{score} / {ROUND_LENGTH}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  本轮正确率 {Math.round((score / ROUND_LENGTH) * 100)}%
                </ThemedText>
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary" style={styles.startDesc}>
                每轮 {ROUND_LENGTH} 题，只看文字的显示颜色
              </ThemedText>
            )}
            {bestRecord.games > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                历史最佳 {bestRecord.best} 题 · 准确率 {bestRecord.extra1}% · 共 {bestRecord.games} 局
              </ThemedText>
            )}
            <Pressable style={styles.startBtn} onPress={startRound}>
              <FontAwesome name={gameOver ? 'refresh' : 'play'} size={18} color="#FFFFFF" />
              <ThemedText style={styles.startBtnText}>{gameOver ? '再来一轮' : '开始挑战'}</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <>
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
              disabled={feedback !== null}
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
            <ThemedText type="small" themeColor="textSecondary">进度 / {ROUND_LENGTH}</ThemedText>
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
          </>
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

  startCard: {
    marginTop: Spacing.four, padding: Spacing.six,
    borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.three,
  },
  startEmoji: { fontSize: 64, lineHeight: 76 },
  startDesc: { textAlign: 'center' },
  endScore: { fontSize: 40, lineHeight: 48, fontWeight: '800', color: '#AF52DE' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: '#AF52DE', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five, borderRadius: Spacing.three,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  card: {
    paddingVertical: Spacing.six, borderRadius: Spacing.three,
    alignItems: 'center', gap: Spacing.two,
  },
  colorWord: { fontSize: 56, fontWeight: '900', lineHeight: 64 },

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
  scoreNum: { fontSize: 22, fontWeight: '700', lineHeight: 28 },

  feedback: { textAlign: 'center', marginTop: Spacing.three, fontSize: 18, fontWeight: '600' },
  feedbackCorrect: { color: '#34C759' },
  feedbackWrong: { color: '#FF3B30' },
});
