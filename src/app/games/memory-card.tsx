import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore } from '@/stores/useStore';

const ACCENT = BrandColors.aurora;
const EMOJIS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🫐', '🥑', '🌽', '🧸', '🦊', '🐸', '🐼', '🐨', '🐙', '🦋', '🐳', '🌻', '🍀', '⭐', '🔥'];
const LEVELS = [
  { pairs: 6, label: '轻松', detail: '12 张牌' },
  { pairs: 8, label: '标准', detail: '16 张牌' },
  { pairs: 12, label: '挑战', detail: '24 张牌' },
] as const;

type Phase = 'setup' | 'playing' | 'won';
type PairCount = (typeof LEVELS)[number]['pairs'];

function shuffle<T>(items: T[]) {
  for (let index = items.length - 1; index > 0; index--) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }
  return items;
}

function buildDeck(pairCount: number) {
  const selectedEmojis = shuffle([...EMOJIS]).slice(0, pairCount);
  return shuffle([...selectedEmojis, ...selectedEmojis]);
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export default function MemoryCardScreen() {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { width: windowWidth } = useWindowDimensions();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.memoryCard ?? { best: 0, games: 0 };
  const [phase, setPhase] = useState<Phase>('setup');
  const [level, setLevel] = useState<PairCount>(6);
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const lockRef = useRef(false);
  const mismatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameSavedRef = useRef(false);

  const availableWidth = Math.min(windowWidth - Spacing.three * 2, 528);
  const cardGap = Spacing.two;
  const cardWidth = Math.floor((availableWidth - cardGap * 3) / 4);
  const matchedPairs = useMemo(() => matched.filter(Boolean).length / 2, [matched]);

  const startGame = useCallback((pairCount: PairCount = level) => {
    if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
    const deck = buildDeck(pairCount);
    setLevel(pairCount);
    setCards(deck);
    setFlipped(new Array(deck.length).fill(false));
    setMatched(new Array(deck.length).fill(false));
    setSelected([]);
    setMoves(0);
    setSeconds(0);
    setFinalScore(0);
    setPhase('playing');
    gameSavedRef.current = false;
    lockRef.current = false;
  }, [level]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const timer = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => () => {
    if (mismatchTimerRef.current) clearTimeout(mismatchTimerRef.current);
  }, []);

  const flipCard = (index: number) => {
    if (phase !== 'playing' || lockRef.current || flipped[index] || matched[index]) return;

    const nextFlipped = [...flipped];
    nextFlipped[index] = true;
    setFlipped(nextFlipped);
    const nextSelected = [...selected, index];
    setSelected(nextSelected);

    if (nextSelected.length !== 2) return;

    lockRef.current = true;
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [firstIndex, secondIndex] = nextSelected;

    if (cards[firstIndex] === cards[secondIndex]) {
      const nextMatched = [...matched];
      nextMatched[firstIndex] = true;
      nextMatched[secondIndex] = true;
      setMatched(nextMatched);
      setSelected([]);
      lockRef.current = false;

      if (nextMatched.every(Boolean)) {
        const score = Math.max(1, Math.round((cards.length / nextMoves) * 100));
        setFinalScore(score);
        setPhase('won');
        if (!gameSavedRef.current) {
          gameSavedRef.current = true;
          dispatch({ type: 'SAVE_GAME_RECORD', game: 'memoryCard', score });
        }
      }
      return;
    }

    mismatchTimerRef.current = setTimeout(() => {
      setFlipped((current) => current.map((isFlipped, cardIndex) => (
        cardIndex === firstIndex || cardIndex === secondIndex ? false : isFlipped
      )));
      setSelected([]);
      lockRef.current = false;
    }, 760);
  };

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
              <FontAwesome name="clone" size={21} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>记忆翻牌</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">记住图案位置，找出全部配对</ThemedText>
            </View>
          </View>

          {phase === 'setup' ? (
            <ThemedView
              type="backgroundElement"
              style={[styles.setupCard, { borderColor: `${ACCENT}40` }]}
            >
              <View style={[styles.heroIcon, { backgroundColor: `${ACCENT}18` }]}>
                <FontAwesome name="lightbulb-o" size={32} color={ACCENT} />
              </View>
              <View style={styles.setupCopy}>
                <ThemedText style={styles.setupTitle}>选择牌局规模</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                  每次翻开两张牌，配对成功的牌会留在桌面上
                </ThemedText>
              </View>

              <View style={styles.levelRow}>
                {LEVELS.map((item) => {
                  const selectedLevel = item.pairs === level;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: selectedLevel }}
                      key={item.pairs}
                      onPress={() => setLevel(item.pairs)}
                      style={({ pressed }) => [
                        styles.levelCard,
                        {
                          backgroundColor: selectedLevel ? `${ACCENT}18` : theme.background,
                          borderColor: selectedLevel ? ACCENT : theme.backgroundSelected,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText type="smallBold" style={selectedLevel ? { color: ACCENT } : undefined}>
                        {item.label}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.levelDetail}>
                        {item.detail}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {bestRecord.games > 0 ? (
                <View style={[styles.bestRow, { backgroundColor: theme.background }]}>
                  <FontAwesome name="trophy" size={14} color={BrandColors.solar} />
                  <ThemedText type="small" themeColor="textSecondary">
                    历史最高 {bestRecord.best} 分 · 已完成 {bestRecord.games} 局
                  </ThemedText>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => startGame()}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              >
                <FontAwesome name="play" size={16} color={BrandColors.deepSpace} />
                <ThemedText style={styles.primaryButtonText}>开始记忆</ThemedText>
              </Pressable>
            </ThemedView>
          ) : phase === 'won' ? (
            <ThemedView
              type="backgroundElement"
              style={[styles.setupCard, { borderColor: `${ACCENT}55` }]}
            >
              <View style={[styles.heroIcon, styles.winIcon]}>
                <FontAwesome name="check" size={30} color={BrandColors.deepSpace} />
              </View>
              <View style={styles.setupCopy}>
                <ThemedText style={[styles.setupTitle, { color: ACCENT }]}>全部配对完成！</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">这次记忆表现很不错</ThemedText>
              </View>

              <View style={[styles.summaryRow, { backgroundColor: theme.background }]}>
                <SummaryItem label="步数" value={String(moves)} />
                <View style={[styles.summaryDivider, { backgroundColor: theme.backgroundSelected }]} />
                <SummaryItem label="用时" value={formatTime(seconds)} />
                <View style={[styles.summaryDivider, { backgroundColor: theme.backgroundSelected }]} />
                <SummaryItem label="得分" value={String(finalScore)} accent />
              </View>

              <View style={styles.winActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPhase('setup')}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { borderColor: theme.backgroundSelected },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold">调整难度</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => startGame(level)}
                  style={({ pressed }) => [styles.replayButton, pressed && styles.primaryButtonPressed]}
                >
                  <FontAwesome name="refresh" size={15} color={BrandColors.deepSpace} />
                  <ThemedText style={styles.primaryButtonText}>再来一局</ThemedText>
                </Pressable>
              </View>
            </ThemedView>
          ) : (
            <>
              <ThemedView
                type="backgroundElement"
                style={[styles.gameStatus, { borderColor: theme.backgroundSelected }]}
              >
                <View style={styles.progressCopy}>
                  <ThemedText type="smallBold">已找到 {matchedPairs}/{level} 对</ThemedText>
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundSelected }]}>
                    <View style={[styles.progressFill, { width: `${(matchedPairs / level) * 100}%` }]} />
                  </View>
                </View>
                <View style={styles.compactStats}>
                  <View style={[styles.compactBadge, { backgroundColor: theme.background }]}>
                    <FontAwesome name="hand-pointer-o" size={12} color={ACCENT} />
                    <ThemedText type="smallBold">{moves}</ThemedText>
                  </View>
                  <View style={[styles.compactBadge, { backgroundColor: theme.background }]}>
                    <FontAwesome name="clock-o" size={12} color={ACCENT} />
                    <ThemedText type="smallBold">{formatTime(seconds)}</ThemedText>
                  </View>
                </View>
              </ThemedView>

              <View style={[styles.grid, { width: availableWidth, gap: cardGap }]}>
                {cards.map((emoji, index) => {
                  const isVisible = flipped[index] || matched[index];
                  const isMatched = matched[index];
                  return (
                    <Pressable
                      accessibilityLabel={`第 ${index + 1} 张牌，${isVisible ? emoji : '未翻开'}`}
                      accessibilityRole="button"
                      disabled={isVisible || lockRef.current}
                      key={`${index}-${emoji}`}
                      onPress={() => flipCard(index)}
                      style={({ pressed }) => [
                        styles.cardWrapper,
                        { width: cardWidth, height: cardWidth * 1.08 },
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.card,
                          isVisible
                            ? { backgroundColor: theme.backgroundElement, borderColor: ACCENT }
                            : styles.cardBack,
                          isMatched && styles.cardMatched,
                        ]}
                      >
                        {isVisible ? (
                          <ThemedText style={styles.cardEmoji}>{emoji}</ThemedText>
                        ) : (
                          <>
                            <View style={styles.cardBackRing} />
                            <FontAwesome name="star-o" size={19} color={BrandColors.deepSpace} />
                          </>
                        )}
                        {isMatched ? (
                          <View style={styles.matchBadge}>
                            <FontAwesome name="check" size={8} color={BrandColors.deepSpace} />
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => startGame(level)}
                style={({ pressed }) => [
                  styles.restartButton,
                  { borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="refresh" size={14} color={theme.textSecondary} />
                <ThemedText type="smallBold" themeColor="textSecondary">重新洗牌</ThemedText>
              </Pressable>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function SummaryItem({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.summaryItem}>
      <ThemedText style={[styles.summaryValue, accent && { color: ACCENT }]}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%', maxWidth: 560, alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  backButton: {
    minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  header: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  headerTitle: { fontSize: 30, lineHeight: 38 },
  setupCard: {
    width: '100%', alignItems: 'center', borderRadius: 26, padding: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  heroIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  winIcon: { backgroundColor: ACCENT },
  setupCopy: { alignItems: 'center', gap: Spacing.half },
  setupTitle: { fontSize: 22, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  centerText: { maxWidth: 330, textAlign: 'center' },
  levelRow: { width: '100%', flexDirection: 'row', gap: Spacing.two },
  levelCard: {
    flex: 1, minWidth: 0, alignItems: 'center', paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.three, borderRadius: 16, borderWidth: 1, gap: Spacing.half,
  },
  levelDetail: { fontSize: 11, lineHeight: 15, textAlign: 'center' },
  bestRow: {
    minHeight: 36, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'stretch', paddingHorizontal: Spacing.three, borderRadius: 14, gap: Spacing.two,
  },
  primaryButton: {
    width: '100%', minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, backgroundColor: ACCENT, gap: Spacing.two,
  },
  primaryButtonPressed: { opacity: 0.86, transform: [{ scale: 0.985 }] },
  primaryButtonText: { color: BrandColors.deepSpace, fontSize: 16, fontWeight: '800' },
  summaryRow: {
    width: '100%', minHeight: 82, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.two, borderRadius: 18,
  },
  summaryItem: { flex: 1, alignItems: 'center', gap: Spacing.half },
  summaryValue: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  summaryDivider: { width: StyleSheet.hairlineWidth, height: 34 },
  winActions: { width: '100%', flexDirection: 'row', gap: Spacing.two },
  secondaryButton: {
    flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center',
    borderRadius: 17, borderWidth: 1,
  },
  replayButton: {
    flex: 1.2, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 17, backgroundColor: ACCENT, gap: Spacing.two,
  },
  gameStatus: {
    width: '100%', minHeight: 72, flexDirection: 'row', alignItems: 'center',
    padding: Spacing.three, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  progressCopy: { flex: 1, minWidth: 0, gap: Spacing.two },
  progressTrack: { width: '100%', height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: ACCENT },
  compactStats: { flexDirection: 'row', gap: Spacing.one },
  compactBadge: {
    minHeight: 32, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, borderRadius: 12, gap: 5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cardWrapper: { borderRadius: 16 },
  cardPressed: { transform: [{ scale: 0.94 }] },
  card: {
    flex: 1, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    shadowColor: BrandColors.deepSpace, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 7, elevation: 2,
  },
  cardBack: { backgroundColor: ACCENT, borderColor: `${BrandColors.deepSpace}26` },
  cardBackRing: {
    position: 'absolute', width: '66%', aspectRatio: 1, borderRadius: 999,
    borderWidth: 1, borderColor: `${BrandColors.deepSpace}22`,
  },
  cardMatched: { backgroundColor: `${ACCENT}20`, opacity: 0.7 },
  cardEmoji: { fontSize: 28, lineHeight: 36 },
  matchBadge: {
    position: 'absolute', top: 5, right: 5, width: 16, height: 16, borderRadius: 8,
    backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center',
  },
  restartButton: {
    minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'stretch', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.two,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
