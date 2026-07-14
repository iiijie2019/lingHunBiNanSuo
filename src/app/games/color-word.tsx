import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore } from '@/stores/useStore';

const ACCENT = BrandColors.cosmicViolet;
const ROUND_LENGTH = 10;
const COLORS = [
  { name: '红色', hex: '#F04452' },
  { name: '蓝色', hex: '#3D8BFF' },
  { name: '绿色', hex: '#24B47E' },
  { name: '橙色', hex: '#FF9500' },
  { name: '紫色', hex: '#A855D6' },
] as const;

type Feedback = 'correct' | 'wrong' | null;

function randomPair() {
  return {
    word: COLORS[Math.floor(Math.random() * COLORS.length)],
    ink: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function ColorWordScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.colorWord;
  const [pair, setPair] = useState(randomPair);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startRound = useCallback(() => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    setPair(randomPair());
    setScore(0);
    setTotal(0);
    setFeedback(null);
    setSelectedAnswer(null);
    setStarted(true);
    setGameOver(false);
  }, []);

  const answer = useCallback((colorName: string) => {
    if (feedback || gameOver || !started) return;

    const correct = colorName === pair.ink.name;
    const nextScore = score + (correct ? 1 : 0);
    const nextTotal = total + 1;
    setSelectedAnswer(colorName);
    setFeedback(correct ? 'correct' : 'wrong');
    setScore(nextScore);
    setTotal(nextTotal);

    nextTimerRef.current = setTimeout(() => {
      if (nextTotal >= ROUND_LENGTH) {
        const accuracy = Math.round((nextScore / ROUND_LENGTH) * 100);
        dispatch({ type: 'SAVE_GAME_RECORD', game: 'colorWord', score: nextScore, extra1: accuracy });
        setGameOver(true);
      } else {
        setPair(randomPair());
      }
      setSelectedAnswer(null);
      setFeedback(null);
    }, 720);
  }, [dispatch, feedback, gameOver, pair.ink.name, score, started, total]);

  useEffect(() => () => {
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
  }, []);

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const currentQuestion = feedback ? total : Math.min(total + 1, ROUND_LENGTH);

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
              <FontAwesome name="eye" size={21} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>颜色判断</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">忽略文字含义，只选择它显示的颜色</ThemedText>
            </View>
          </View>

          {!started || gameOver ? (
            <ThemedView
              type="backgroundElement"
              style={[styles.startCard, { borderColor: `${ACCENT}42` }]}
            >
              <View style={[styles.heroIcon, { backgroundColor: `${ACCENT}18` }]}>
                <FontAwesome name={gameOver ? 'trophy' : 'paint-brush'} size={31} color={ACCENT} />
              </View>

              {gameOver ? (
                <>
                  <View style={styles.startCopy}>
                    <ThemedText style={[styles.startTitle, { color: ACCENT }]}>本轮完成</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      你答对了 {score} 道题
                    </ThemedText>
                  </View>
                  <View style={[styles.finalScoreCard, { backgroundColor: theme.background }]}>
                    <ThemedText style={styles.finalScore}>{score}/{ROUND_LENGTH}</ThemedText>
                    <View style={[styles.finalDivider, { backgroundColor: theme.backgroundSelected }]} />
                    <View>
                      <ThemedText style={styles.finalAccuracy}>{Math.round((score / ROUND_LENGTH) * 100)}%</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">正确率</ThemedText>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.startCopy}>
                    <ThemedText style={styles.startTitle}>准备好挑战注意力了吗？</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                      每轮 {ROUND_LENGTH} 题，文字含义可能与显示颜色相同，也可能不同
                    </ThemedText>
                  </View>
                  <View style={[styles.exampleCard, { backgroundColor: theme.background }]}>
                    <ThemedText style={[styles.exampleWord, { color: COLORS[1].hex }]}>红色</ThemedText>
                    <FontAwesome name="long-arrow-right" size={15} color={theme.textSecondary} />
                    <View style={[styles.exampleAnswer, { borderColor: COLORS[1].hex }]}>
                      <View style={[styles.exampleDot, { backgroundColor: COLORS[1].hex }]} />
                      <ThemedText type="smallBold">选择“蓝色”</ThemedText>
                    </View>
                  </View>
                </>
              )}

              {bestRecord.games > 0 ? (
                <View style={styles.bestRow}>
                  <FontAwesome name="star" size={13} color={BrandColors.solar} />
                  <ThemedText type="small" themeColor="textSecondary">
                    历史最佳 {bestRecord.best} 题 · {bestRecord.extra1}% 正确率 · {bestRecord.games} 局
                  </ThemedText>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={startRound}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              >
                <FontAwesome name={gameOver ? 'refresh' : 'play'} size={16} color="#FFFFFF" />
                <ThemedText style={styles.primaryButtonText}>{gameOver ? '再来一轮' : '开始挑战'}</ThemedText>
              </Pressable>
            </ThemedView>
          ) : (
            <>
              <ThemedView
                type="backgroundElement"
                style={[styles.progressCard, { borderColor: theme.backgroundSelected }]}
              >
                <View style={styles.progressHeader}>
                  <ThemedText type="smallBold">第 {currentQuestion}/{ROUND_LENGTH} 题</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">答对 {score} 题</ThemedText>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={[styles.progressFill, { width: `${(total / ROUND_LENGTH) * 100}%` }]} />
                </View>
              </ThemedView>

              <ThemedView
                type="backgroundElement"
                style={[
                  styles.questionCard,
                  {
                    borderColor: feedback === 'correct'
                      ? `${BrandColors.aurora}80`
                      : feedback === 'wrong' ? `${BrandColors.novaRose}80` : `${ACCENT}32`,
                  },
                ]}
              >
                <View style={[styles.focusBadge, { backgroundColor: `${pair.ink.hex}16` }]}>
                  <FontAwesome name="eye" size={12} color={pair.ink.hex} />
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.focusText}>只看颜色</ThemedText>
                </View>
                <ThemedText
                  accessibilityLabel={`文字内容${pair.word.name}，请选择显示颜色`}
                  style={[styles.colorWord, { color: pair.ink.hex }]}
                >
                  {pair.word.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">这个字显示的是什么颜色？</ThemedText>
              </ThemedView>

              <View style={styles.optionsGrid}>
                {COLORS.map((color) => {
                  const isCorrectAnswer = feedback !== null && color.name === pair.ink.name;
                  const isWrongSelection = feedback === 'wrong' && color.name === selectedAnswer;
                  return (
                    <Pressable
                      accessibilityLabel={`选择${color.name}`}
                      accessibilityRole="button"
                      disabled={feedback !== null}
                      key={color.name}
                      onPress={() => answer(color.name)}
                      style={({ pressed }) => [
                        styles.optionButton,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                        isCorrectAnswer && styles.correctOption,
                        isWrongSelection && styles.wrongOption,
                        pressed && !feedback && styles.optionPressed,
                      ]}
                    >
                      <View style={[styles.optionDotWrap, { backgroundColor: `${color.hex}18` }]}>
                        <View style={[styles.optionDot, { backgroundColor: color.hex }]} />
                      </View>
                      <ThemedText type="smallBold" style={styles.optionLabel}>{color.name}</ThemedText>
                      {isCorrectAnswer ? <FontAwesome name="check" size={13} color={BrandColors.aurora} /> : null}
                      {isWrongSelection ? <FontAwesome name="times" size={13} color={BrandColors.novaRose} /> : null}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.feedbackArea}>
                {feedback ? (
                  <View style={[
                    styles.feedbackBadge,
                    { backgroundColor: feedback === 'correct' ? `${BrandColors.aurora}18` : `${BrandColors.novaRose}18` },
                  ]}>
                    <FontAwesome
                      name={feedback === 'correct' ? 'check-circle' : 'times-circle'}
                      size={16}
                      color={feedback === 'correct' ? BrandColors.aurora : BrandColors.novaRose}
                    />
                    <ThemedText type="smallBold" style={{ color: feedback === 'correct' ? BrandColors.aurora : BrandColors.novaRose }}>
                      {feedback === 'correct' ? '判断正确' : `正确答案是${pair.ink.name}`}
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">选择一个颜色继续</ThemedText>
                )}
              </View>

              <View style={[styles.statsRow, { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected }]}>
                <StatItem label="正确" value={String(score)} accent={BrandColors.aurora} />
                <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
                <StatItem label="已答" value={String(total)} />
                <View style={[styles.statDivider, { backgroundColor: theme.backgroundSelected }]} />
                <StatItem label="正确率" value={`${accuracy}%`} />
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatItem({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <View style={styles.statItem}>
      <ThemedText style={[styles.statValue, accent ? { color: accent } : undefined]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  headerTitle: { fontSize: 30, lineHeight: 38 },
  startCard: {
    alignItems: 'center', borderRadius: 26, padding: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  startCopy: { alignItems: 'center', gap: Spacing.half },
  startTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  centerText: { maxWidth: 340, textAlign: 'center' },
  exampleCard: {
    width: '100%', minHeight: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, padding: Spacing.three, gap: Spacing.three,
  },
  exampleWord: { fontSize: 24, lineHeight: 31, fontWeight: '900' },
  exampleAnswer: {
    minHeight: 38, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three,
    borderRadius: 13, borderWidth: 1, gap: Spacing.two,
  },
  exampleDot: { width: 12, height: 12, borderRadius: 6 },
  bestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  primaryButton: {
    width: '100%', minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, backgroundColor: ACCENT, gap: Spacing.two,
  },
  primaryButtonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  finalScoreCard: {
    width: '100%', minHeight: 100, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', borderRadius: 20, gap: Spacing.four,
  },
  finalScore: { fontSize: 42, lineHeight: 52, fontWeight: '900', color: ACCENT },
  finalDivider: { width: StyleSheet.hairlineWidth, height: 42 },
  finalAccuracy: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  progressCard: { borderRadius: 18, padding: Spacing.three, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.two },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: ACCENT },
  questionCard: {
    minHeight: 220, alignItems: 'center', justifyContent: 'center',
    borderRadius: 26, borderWidth: 1, gap: Spacing.three,
  },
  focusBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, gap: 6,
  },
  focusText: { fontSize: 12 },
  colorWord: { fontSize: 64, lineHeight: 76, fontWeight: '900', letterSpacing: 2 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  optionButton: {
    flexGrow: 1, flexBasis: '47%', maxWidth: '49%', minHeight: 58,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three,
    borderRadius: 17, borderWidth: 1, gap: Spacing.two,
  },
  optionDotWrap: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  optionDot: { width: 14, height: 14, borderRadius: 7 },
  optionLabel: { flex: 1 },
  optionPressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  correctOption: { borderColor: BrandColors.aurora, backgroundColor: `${BrandColors.aurora}12` },
  wrongOption: { borderColor: BrandColors.novaRose, backgroundColor: `${BrandColors.novaRose}12` },
  feedbackArea: { minHeight: 38, alignItems: 'center', justifyContent: 'center' },
  feedbackBadge: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 14, gap: Spacing.two,
  },
  statsRow: {
    minHeight: 78, flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, borderWidth: StyleSheet.hairlineWidth,
  },
  statItem: { flex: 1, alignItems: 'center', gap: Spacing.half },
  statValue: { fontSize: 21, lineHeight: 27, fontWeight: '800' },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
