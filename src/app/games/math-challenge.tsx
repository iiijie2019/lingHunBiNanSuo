import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

type Question = { a: number; op: '+' | '-' | '×'; b: number; answer: number };

function genQuestion(): Question {
  const op = (['+', '-', '×'] as const)[Math.floor(Math.random() * 3)];
  let a: number, b: number;
  if (op === '+') { a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * 50) + 10; }
  else if (op === '-') { a = Math.floor(Math.random() * 80) + 10; b = Math.floor(Math.random() * a); }
  else { a = Math.floor(Math.random() * 12) + 2; b = Math.floor(Math.random() * 12) + 2; }
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b;
  return { a, op, b, answer };
}

function genOptions(correct: number): number[] {
  const opts = new Set<number>([correct]);
  while (opts.size < 6) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const v = correct + offset;
    if (v >= 0 && v !== correct) opts.add(v);
  }
  return [...opts].sort(() => Math.random() - 0.5);
}

export default function MathChallengeScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.mathChallenge;
  const [question, setQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameSavedRef = useRef(false);

  const nextQuestion = useCallback(() => {
    const q = genQuestion();
    setQuestion(q);
    setOptions(genOptions(q.answer));
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    setGameOver(false);
    setScore(0);
    setTotal(0);
    setTimeLeft(30);
    gameSavedRef.current = false;
    nextQuestion();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [nextQuestion]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Save record when game ends
  useEffect(() => {
    if (gameOver && !gameSavedRef.current) {
      gameSavedRef.current = true;
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
      dispatch({ type: 'SAVE_GAME_RECORD', game: 'mathChallenge', score, extra1: accuracy });
    }
  }, [gameOver, score, total, dispatch]);

  const answer = (v: number) => {
    if (gameOver || !question) return;
    const correct = v === question.answer;
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
    setTotal((t) => t + 1);
    setTimeout(() => {
      setFeedback(null);
      if (!gameOver) nextQuestion();
    }, 400);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#FF6B6B" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">数学速算</ThemedText>
          {started && !gameOver && (
            <ThemedView style={[styles.timerBadge, timeLeft <= 5 && styles.timerUrgent]}>
              <ThemedText type="smallBold" style={{ color: timeLeft <= 5 ? '#FFFFFF' : '#FF9500' }}>
                ⏱ {timeLeft}s
              </ThemedText>
            </ThemedView>
          )}
        </ThemedView>

        {!started ? (
          <ThemedView type="backgroundElement" style={styles.startCard}>
            <ThemedText style={styles.startEmoji}>🧮</ThemedText>
            <ThemedText type="default" themeColor="textSecondary" style={styles.startDesc}>
              限时 30 秒，尽可能多地回答
            </ThemedText>
            <Pressable style={styles.startBtn} onPress={start}>
              <FontAwesome name="play" size={18} color="#FFFFFF" />
              <ThemedText style={styles.startBtnText}>开始挑战</ThemedText>
            </Pressable>
          </ThemedView>
        ) : gameOver ? (
          <ThemedView type="backgroundElement" style={styles.startCard}>
            <ThemedText style={styles.startEmoji}>🏆</ThemedText>
            <ThemedText type="subtitle" style={styles.endScore}>{score} 题</ThemedText>
            <ThemedText type="default" themeColor="textSecondary">
              共 {total} 题，正确率 {total > 0 ? Math.round((score / total) * 100) : 0}%
            </ThemedText>
            {bestRecord.games > 0 && (
              <ThemedView style={styles.bestRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  🏆 历史最佳 {bestRecord.best} 题 · 准确率 {bestRecord.extra1}% · 共 {bestRecord.games} 局
                </ThemedText>
              </ThemedView>
            )}
            <Pressable style={styles.startBtn} onPress={start}>
              <FontAwesome name="refresh" size={18} color="#FFFFFF" />
              <ThemedText style={styles.startBtnText}>再来一局</ThemedText>
            </Pressable>
          </ThemedView>
        ) : question ? (
          <>
            {/* 题目 */}
            <ThemedView type="backgroundElement" style={styles.questionCard}>
              <ThemedText style={styles.questionText}>
                {question.a} {question.op} {question.b} = ?
              </ThemedText>
            </ThemedView>

            {/* 选项 */}
            <ThemedView style={styles.optionsGrid}>
              {options.map((v, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.optionBtn,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={() => answer(v)}
                >
                  <ThemedText style={styles.optionText}>{v}</ThemedText>
                </Pressable>
              ))}
            </ThemedView>

            {/* 分数 */}
            <ThemedView style={styles.inlineScore}>
              <ThemedView style={styles.scoreDot} />
              <ThemedText type="small" themeColor="textSecondary">
                {score} 正确 / {total} 题
              </ThemedText>
            </ThemedView>
          </>
        ) : null}

        {feedback && (
          <ThemedText
            style={[
              styles.feedback,
              feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            {feedback === 'correct' ? '✅' : '❌'}
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
  backLabel: { color: '#FF6B6B' },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  timerBadge: {
    backgroundColor: '#FF950015', paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one, borderRadius: 16,
  },
  timerUrgent: { backgroundColor: '#FF3B30' },

  // Start / End
  startCard: {
    marginTop: Spacing.six, padding: Spacing.six,
    borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.three,
  },
  startEmoji: { fontSize: 64, lineHeight: 76 },
  startDesc: { textAlign: 'center' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF6B6B', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five, borderRadius: Spacing.three, gap: Spacing.two,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  endScore: { color: '#FF6B6B', fontSize: 40, lineHeight: 48 },

  // Question
  questionCard: {
    marginTop: Spacing.four, paddingVertical: Spacing.five, paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three, alignItems: 'center',
  },
  questionText: { fontSize: 40, fontWeight: '800', lineHeight: 48 },

  // Options
  optionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two,
    marginTop: Spacing.four,
  },
  optionBtn: {
    width: '30%', aspectRatio: 2,
    borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#C0C0C0', marginBottom: Spacing.one,
  },
  optionPressed: { opacity: 0.5 },
  optionText: { fontSize: 22, fontWeight: '700', lineHeight: 28 },

  inlineScore: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.two, marginTop: Spacing.three,
  },
  scoreDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },

  feedback: { textAlign: 'center', marginTop: Spacing.two, fontSize: 32, lineHeight: 40 },
  feedbackCorrect: { color: '#34C759' },
  feedbackWrong: { color: '#FF3B30' },
  bestRow: { paddingTop: Spacing.one },
});
