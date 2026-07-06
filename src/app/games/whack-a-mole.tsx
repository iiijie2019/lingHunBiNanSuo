import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

const GRID = 9;
const MOLE_UP_MS = 800;
const SPAWN_MIN = 400;
const SPAWN_MAX = 1200;
const GAME_DURATION = 30;
const BOMB_CHANCE = 0.22;      // 22% 概率出炸弹
const BOMB_PENALTY = 3;        // 打到炸弹扣分

export default function WhackAMoleScreen() {
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.whackAMole;
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [activeHole, setActiveHole] = useState<number | null>(null);
  const [hitFlash, setHitFlash] = useState<{ hole: number; type: 'mole' | 'bomb' } | null>(null);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const gameSavedRef = useRef(false);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const molesHitRef = useRef(0);
  const bombsHitRef = useRef(0);
  const isBombRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameStartRef = useRef(0);

  const clearMole = useCallback(() => {
    if (moleTimerRef.current) {
      clearTimeout(moleTimerRef.current);
      moleTimerRef.current = null;
    }
  }, []);

  const spawnMole = useCallback(() => {
    if (gameStartRef.current === 0) return;
    const hole = Math.floor(Math.random() * GRID);
    const isBomb = Math.random() < BOMB_CHANCE;
    isBombRef.current = isBomb;
    setActiveHole(hole);

    moleTimerRef.current = setTimeout(() => {
      setActiveHole((current) => {
        if (current === hole) {
          setCombo(0);
          comboRef.current = 0;
        }
        return current === hole ? null : current;
      });
      const delay = SPAWN_MIN + Math.random() * (SPAWN_MAX - SPAWN_MIN);
      moleTimerRef.current = setTimeout(spawnMole, delay);
    }, MOLE_UP_MS);
  }, []);

  const start = useCallback(() => {
    clearMole();
    setStarted(true);
    setGameOver(false);
    setScore(0);
    setCombo(0);
    setTimeLeft(GAME_DURATION);
    setActiveHole(null);
    setHitFlash(null);
    scoreRef.current = 0;
    comboRef.current = 0;
    molesHitRef.current = 0;
    bombsHitRef.current = 0;
    gameSavedRef.current = false;
    gameStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          gameStartRef.current = 0;
          clearMole();
          setGameOver(true);
          setActiveHole(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    setTimeout(spawnMole, 500);
  }, [spawnMole, clearMole]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearMole();
    };
  }, [clearMole]);

  // Save record when game ends
  useEffect(() => {
    if (gameOver && !gameSavedRef.current) {
      gameSavedRef.current = true;
      dispatch({ type: 'SAVE_GAME_RECORD', game: 'whackAMole', score: scoreRef.current });
    }
  }, [gameOver, dispatch]);

  const hit = (hole: number) => {
    if (!started || gameOver) return;
    if (activeHole !== hole) {
      // 点到空穴，重置 combo
      if (comboRef.current > 0) {
        comboRef.current = 0;
        setCombo(0);
      }
      return;
    }

    clearMole();
    const isBomb = isBombRef.current;

    if (isBomb) {
      // 打到炸弹
      bombsHitRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      scoreRef.current = Math.max(0, scoreRef.current - BOMB_PENALTY);
      setScore(scoreRef.current);
      setActiveHole(null);
      setHitFlash({ hole, type: 'bomb' });
      setTimeout(() => setHitFlash(null), 400);
    } else {
      // 打到地鼠
      molesHitRef.current += 1;
      comboRef.current += 1;
      const newCombo = comboRef.current;
      setCombo(newCombo);
      const bonus = Math.min(newCombo - 1, 5);
      scoreRef.current += 1 + bonus;
      setScore(scoreRef.current);
      setActiveHole(null);
      setHitFlash({ hole, type: 'mole' });
      setTimeout(() => setHitFlash(null), 300);
    }

    const delay = 200 + Math.random() * 400;
    moleTimerRef.current = setTimeout(spawnMole, delay);
  };

  const progress = timeLeft / GAME_DURATION;

  const getFlashStyle = (holeIndex: number) => {
    if (!hitFlash || hitFlash.hole !== holeIndex) return undefined;
    return hitFlash.type === 'bomb' ? styles.holeFlashBomb : styles.holeFlashMole;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#FF6B6B" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">打地鼠</ThemedText>
          {started && !gameOver && (
            <ThemedView style={styles.scoreBadge}>
              <ThemedText style={styles.scoreBadgeText}>{score} 分</ThemedText>
              {combo > 1 && (
                <ThemedText style={styles.comboText}>🔥 x{combo}</ThemedText>
              )}
            </ThemedView>
          )}
        </ThemedView>

        {started && !gameOver && (
          <ThemedView style={styles.progressSection}>
            <ThemedView type="backgroundElement" style={styles.progressBar}>
              <ThemedView
                style={[
                  styles.progressFill,
                  {
                    width: `${progress * 100}%`,
                    backgroundColor: progress < 0.3 ? '#FF3B30' : progress < 0.6 ? '#FF9500' : '#34C759',
                  },
                ]}
              />
            </ThemedView>
            <ThemedView style={styles.progressMeta}>
              <ThemedView style={styles.legendRow}>
                <ThemedView style={styles.legendItem}>
                  <ThemedText style={styles.legendEmoji}>🐹</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">+分</ThemedText>
                </ThemedView>
                <ThemedView style={styles.legendItem}>
                  <ThemedText style={styles.legendEmoji}>💣</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">-{BOMB_PENALTY}分</ThemedText>
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary">
                  ⏱ {timeLeft}s
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>
        )}

        {!started || gameOver ? (
          <ThemedView type="backgroundElement" style={styles.startCard}>
            <ThemedText style={styles.startEmoji}>
              {gameOver ? '🏆' : '🐹'}
            </ThemedText>
            {gameOver ? (
              <>
                <ThemedText style={styles.endScore}>{score} 分</ThemedText>
                {/* 详细统计 */}
                <ThemedView style={styles.resultStats}>
                  <ThemedView style={styles.resultItem}>
                    <ThemedText style={styles.resultEmoji}>🐹</ThemedText>
                    <ThemedText style={styles.resultNum}>{molesHitRef.current}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">击中地鼠</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.resultDivider} />
                  <ThemedView style={styles.resultItem}>
                    <ThemedText style={styles.resultEmoji}>💣</ThemedText>
                    <ThemedText style={[styles.resultNum, { color: '#FF3B30' }]}>
                      {bombsHitRef.current}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">误触炸弹</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.resultDivider} />
                  <ThemedView style={styles.resultItem}>
                    <ThemedText style={styles.resultEmoji}>⭐</ThemedText>
                    <ThemedText style={[styles.resultNum, { color: '#FF9500' }]}>
                      {score}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">最终得分</ThemedText>
                  </ThemedView>
                </ThemedView>
              </>
            ) : (
              <>
                <ThemedText type="default" themeColor="textSecondary" style={styles.startDesc}>
                  快速点击冒出的 🐹 地鼠得分
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  注意避开 💣 炸弹！打到扣 {BOMB_PENALTY} 分
                </ThemedText>
              </>
            )}
            {bestRecord.games > 0 && (
              <ThemedView style={styles.bestRecordRow}>
                <ThemedText style={styles.bestRecordEmoji}>🏆</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  最高分 {bestRecord.best} · 共 {bestRecord.games} 局
                </ThemedText>
              </ThemedView>
            )}
            <Pressable style={styles.startBtn} onPress={start}>
              <FontAwesome name={gameOver ? 'refresh' : 'play'} size={18} color="#FFFFFF" />
              <ThemedText style={styles.startBtnText}>
                {gameOver ? '再来一局' : '开始游戏'}
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          <ThemedView style={styles.grid}>
            {Array.from({ length: GRID }).map((_, i) => {
              const isActive = activeHole === i;
              const flashStyle = getFlashStyle(i);
              const showBomb = isActive && isBombRef.current;

              return (
                <Pressable
                  key={i}
                  style={styles.holeWrapper}
                  onPress={() => hit(i)}
                >
                  <ThemedView
                    type="backgroundElement"
                    style={[
                      styles.hole,
                      showBomb && styles.holeBomb,
                      flashStyle,
                    ]}
                  >
                    {isActive && (
                      <ThemedView style={styles.mole}>
                        <ThemedText style={styles.moleEmoji}>
                          {showBomb ? '💣' : '🐹'}
                        </ThemedText>
                      </ThemedView>
                    )}
                    {!isActive && <ThemedView style={styles.holeBottom} />}
                  </ThemedView>
                </Pressable>
              );
            })}
          </ThemedView>
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
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  scoreBadgeText: { fontSize: 20, fontWeight: '800', lineHeight: 26 },
  comboText: { fontSize: 16, fontWeight: '700', color: '#FF9500', lineHeight: 22 },

  // Progress
  progressSection: { gap: Spacing.one, marginTop: Spacing.two },
  progressBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressMeta: { alignItems: 'flex-end', marginTop: 2 },
  legendRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  legendEmoji: { fontSize: 14, lineHeight: 20 },

  // Start / End
  startCard: {
    marginTop: Spacing.six, padding: Spacing.six,
    borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.three,
  },
  startEmoji: { fontSize: 72, lineHeight: 84 },
  startDesc: { textAlign: 'center' },
  endScore: { fontSize: 40, fontWeight: '800', color: '#208AEF', lineHeight: 48 },

  // Result stats
  resultStats: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.two, gap: Spacing.two,
  },
  resultItem: { alignItems: 'center', gap: 2, flex: 1 },
  resultEmoji: { fontSize: 28, lineHeight: 36 },
  resultNum: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  resultDivider: { width: 1, height: 40, backgroundColor: '#E0E0E0' },

  startBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF6B6B', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five, borderRadius: Spacing.three, gap: Spacing.two,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', lineHeight: 24 },

  // Grid
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: Spacing.two,
    marginTop: Spacing.four,
  },
  holeWrapper: { width: '30%', aspectRatio: 1, padding: Spacing.one },
  hole: {
    flex: 1, borderRadius: Spacing.three,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2, borderColor: '#8B6914', borderBottomWidth: 6,
  },
  holeBomb: {
    borderColor: '#FF3B3030',
    borderBottomColor: '#FF3B3040',
  },
  holeFlashMole: {
    backgroundColor: '#34C75930',
    borderColor: '#34C759',
  },
  holeFlashBomb: {
    backgroundColor: '#FF3B3030',
    borderColor: '#FF3B30',
  },
  holeBottom: {
    width: '60%', height: '35%',
    backgroundColor: '#8B691430',
    borderBottomLeftRadius: 40, borderBottomRightRadius: 40,
    position: 'absolute', bottom: 4,
  },
  mole: { position: 'absolute', bottom: 0, alignItems: 'center' },
  moleEmoji: { fontSize: 44, lineHeight: 52 },
  bestRecordRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  bestRecordEmoji: { fontSize: 16, lineHeight: 22 },
});
