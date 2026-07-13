import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

const EMOJIS = ['🍎','🍊','🍋','🍇','🍓','🫐','🥑','🌽','🧸','🦊','🐸','🐼','🐨','🐙','🦋','🐳','🌻','🍀','⭐','🔥'];

function buildDeck(pairCount: number): string[] {
  const shuffle = <T,>(items: T[]) => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const picked = shuffle([...EMOJIS]).slice(0, pairCount);
  return shuffle([...picked, ...picked]);
}

export default function MemoryCardScreen() {
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.memoryCard ?? { best: 0, games: 0 };
  const [cards, setCards] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [matched, setMatched] = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(false);
  const [won, setWon] = useState(false);
  const [level, setLevel] = useState(6); // 6 pairs = 12 cards (default medium)
  const lockRef = useRef(false);
  const gameSavedRef = useRef(false);

  const newGame = useCallback((pairCount: number) => {
    const deck = buildDeck(pairCount);
    setCards(deck);
    setFlipped(new Array(deck.length).fill(false));
    setMatched(new Array(deck.length).fill(false));
    setSelected([]);
    setMoves(0);
    setWon(false);
    setStarted(true);
    gameSavedRef.current = false;
    lockRef.current = false;
  }, []);

  const flipCard = (i: number) => {
    if (lockRef.current) return;
    if (flipped[i] || matched[i]) return;
    const newFlipped = [...flipped];
    newFlipped[i] = true;
    setFlipped(newFlipped);
    const newSelected = [...selected, i];
    setSelected(newSelected);

    if (newSelected.length === 2) {
      lockRef.current = true;
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = newSelected;
      if (cards[a] === cards[b]) {
        const newMatched = [...matched];
        newMatched[a] = true;
        newMatched[b] = true;
        setMatched(newMatched);
        setSelected([]);
        lockRef.current = false;
        // Check win
        const allDone = newMatched.every(Boolean);
        if (allDone) {
          setWon(true);
          if (!gameSavedRef.current) {
            gameSavedRef.current = true;
            const score = Math.max(1, Math.round((cards.length / nextMoves) * 100));
            dispatch({ type: 'SAVE_GAME_RECORD', game: 'memoryCard', score });
          }
        }
      } else {
        setTimeout(() => {
          const revert = [...flipped];
          revert[a] = false;
          revert[b] = false;
          setFlipped(revert);
          setSelected([]);
          lockRef.current = false;
        }, 800);
      }
    }
  };

  const best = bestRecord.best || 0;

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}><FontAwesome name="angle-left" size={18} color="#34C759" /></ThemedView>
            <ThemedText type="small" style={{ color: '#34C759' }}>返回</ThemedText>
          </Pressable>

          <ThemedView style={styles.headerRow}>
            <ThemedView>
              <ThemedText type="subtitle">记忆翻牌</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">翻开两张，找到相同的图案</ThemedText>
            </ThemedView>
            {started && !won && (
              <ThemedView style={styles.moveBadge}>
                <ThemedText type="smallBold" style={{ color: '#34C759' }}>📝 {moves} 步</ThemedText>
              </ThemedView>
            )}
          </ThemedView>

          {!started || won ? (
            <ThemedView type="backgroundElement" style={styles.startCard}>
              <ThemedText style={styles.startEmoji}>{won ? '🎉' : '🧠'}</ThemedText>
              {won && <ThemedText style={styles.winText}>完成！用了 {moves} 步</ThemedText>}
              {best > 0 && <ThemedText type="small" themeColor="textSecondary">🏆 最高分: {best}</ThemedText>}
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>选择难度</ThemedText>
              <ThemedView style={styles.levelRow}>
                {[6, 8, 12].map((n) => (
                  <Pressable key={n} style={[styles.levelBtn, level === n && styles.levelActive]} onPress={() => { setLevel(n); newGame(n); }}>
                    <ThemedText type="smallBold" style={level === n ? { color: '#FFFFFF' } : undefined}>{n * 2} 张</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>
            </ThemedView>
          ) : (
            <ThemedView style={styles.grid}>
              {cards.map((emoji, i) => {
                const show = flipped[i] || matched[i];
                return (
                  <Pressable key={i} style={styles.cardWrapper} onPress={() => flipCard(i)}>
                    <ThemedView type={show ? 'backgroundSelected' : undefined} style={[styles.card, matched[i] && styles.cardMatched, show && styles.cardFlipped]}>
                      <ThemedText style={styles.cardEmoji}>{show ? emoji : '?'}</ThemedText>
                    </ThemedView>
                  </Pressable>
                );
              })}
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { paddingBottom: Spacing.six },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#34C75912', alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  moveBadge: { backgroundColor: '#34C75915', paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: 16 },

  startCard: { marginTop: Spacing.five, padding: Spacing.six, borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.two },
  startEmoji: { fontSize: 64, lineHeight: 76 },
  winText: { fontSize: 20, fontWeight: '700', color: '#34C759' },
  levelRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.one },
  levelBtn: { paddingHorizontal: Spacing.five, paddingVertical: Spacing.two, borderRadius: Spacing.three, borderWidth: 1.5, borderColor: '#C0C0C0' },
  levelActive: { backgroundColor: '#34C759', borderColor: '#34C759' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two, marginTop: Spacing.three },
  cardWrapper: { width: '22%', aspectRatio: 0.9, padding: 2 },
  card: { flex: 1, borderRadius: Spacing.two, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#34C75930' },
  cardFlipped: { backgroundColor: '#34C75912', borderColor: '#34C759' },
  cardMatched: { backgroundColor: '#34C75925', borderColor: '#34C759', opacity: 0.5 },
  cardEmoji: { fontSize: 26, lineHeight: 34 },
});
