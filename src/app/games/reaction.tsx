import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'too-early';

export default function ReactionScreen() {
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const savedBest = gameRecords.reaction.best;
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reaction, setReaction] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(savedBest < 9999 ? savedBest : null);
  const [results, setResults] = useState<number[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goTimeRef = useRef(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  const start = useCallback(() => {
    cleanup();
    setPhase('ready');
    const delay = 1500 + Math.random() * 3000; // 1.5-4.5s random
    timerRef.current = setTimeout(() => {
      goTimeRef.current = Date.now();
      setPhase('go');
    }, delay);
  }, [cleanup]);

  const tap = useCallback(() => {
    if (phase === 'waiting') return;
    if (phase === 'ready') {
      cleanup();
      setPhase('too-early');
      return;
    }
    if (phase === 'go') {
      const ms = Date.now() - goTimeRef.current;
      setReaction(ms);
      setResults((r) => [ms, ...r].slice(0, 10));
      setBest((b) => (b === null ? ms : Math.min(b, ms)));
      setPhase('result');
    }
  }, [phase, cleanup]);

  const reset = () => {
    cleanup();
    setPhase('waiting');
    setReaction(null);
  };

  // Save record after each reaction test
  useEffect(() => {
    if (phase === 'result' && reaction !== null) {
      dispatch({ type: 'SAVE_GAME_RECORD', game: 'reaction', score: reaction });
    }
  }, [phase, reaction, dispatch]);

  useEffect(() => cleanup, [cleanup]);

  const avg = results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0;

  const bgColor = phase === 'go' ? '#34C759' : phase === 'too-early' ? '#FF3B30' : phase === 'ready' ? '#FF9500' : undefined;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Pressable style={styles.backRow} onPress={() => { cleanup(); router.dismiss(); }}>
            <FontAwesome name="angle-left" size={20} color="#FF9500" />
            <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">反应速度测试</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {phase === 'waiting' && '点击下方开始，屏幕变绿时立刻点击'}
            {phase === 'ready' && '等待屏幕变绿...'}
            {phase === 'go' && '现在点击！'}
            {phase === 'too-early' && '太早了！等变绿再点'}
            {phase === 'result' && `你的反应时间: ${reaction}ms`}
          </ThemedText>

          {/* 主测试区域 */}
          <Pressable onPress={phase === 'result' || phase === 'too-early' ? reset : tap}>
            <ThemedView
              type="backgroundElement"
              style={[styles.testArea, bgColor ? { backgroundColor: bgColor } : undefined]}
            >
              {phase === 'waiting' && (
                <Pressable style={styles.startBtn} onPress={(e) => { e.stopPropagation(); start(); }}>
                  <FontAwesome name="bolt" size={24} color="#FFFFFF" />
                  <ThemedText style={styles.startBtnText}>开始测试</ThemedText>
                </Pressable>
              )}
              {phase === 'ready' && (
                <ThemedText style={styles.readyEmoji}>👀</ThemedText>
              )}
              {phase === 'go' && (
                <ThemedText style={styles.goText}>点！</ThemedText>
              )}
              {phase === 'too-early' && (
                <>
                  <ThemedText style={styles.earlyEmoji}>😅</ThemedText>
                  <ThemedText type="default" style={styles.earlyText}>点早了！点击重试</ThemedText>
                </>
              )}
              {phase === 'result' && (
                <>
                  <ThemedText style={styles.resultMs}>{reaction} ms</ThemedText>
                  <ThemedText type="small" style={styles.resultHint}>点击再来一次</ThemedText>
                </>
              )}
            </ThemedView>
          </Pressable>

          {/* 统计 */}
          {results.length > 0 && (
            <ThemedView style={styles.statsRow}>
              <ThemedView type="backgroundElement" style={styles.statItem}>
                <ThemedText style={styles.statNum}>{best}ms</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">最佳</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statItem}>
                <ThemedText style={styles.statNum}>{avg}ms</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">平均</ThemedText>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.statItem}>
                <ThemedText style={styles.statNum}>{results.length}次</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">测试</ThemedText>
              </ThemedView>
            </ThemedView>
          )}

          {results.length > 0 && (
            <ThemedView style={styles.resultsList}>
              <ThemedText type="smallBold" themeColor="textSecondary">最近记录</ThemedText>
              <ThemedView style={styles.resultsRow}>
                {results.map((r, i) => (
                  <ThemedView key={i} style={[styles.resultBadge, r === best && styles.resultBest]}>
                    <ThemedText type="small" style={r === best ? { color: '#FFFFFF' } : undefined}>
                      {r}ms
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          )}

          {/* 游戏规则 */}
          <ThemedView style={styles.refSection}>
            <Collapsible title="游戏规则">
              <ThemedText type="small" themeColor="textSecondary" style={styles.rulesDesc}>
                屏幕变绿时以最快速度点击。绿色出现时间随机（1.5~4.5 秒），考验真实反应而非预判。
              </ThemedText>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.refTitle}>
                📊 反应速度参考标准
              </ThemedText>
              <RefRow emoji="🏆" label="精英级" range="< 200ms" desc="职业运动员/飞行员水平" color="#FFD700" />
              <RefRow emoji="⚡" label="优秀" range="200 - 250ms" desc="远超常人" color="#34C759" />
              <RefRow emoji="👍" label="良好" range="250 - 300ms" desc="比大多数人都快" color="#208AEF" />
              <RefRow emoji="📊" label="平均水平" range="300 - 350ms" desc="正常成年人" color="#FF9500" />
              <RefRow emoji="🐢" label="偏慢" range="350 - 450ms" desc="可能疲劳或分心" color="#FF6B6B" />
              <RefRow emoji="💤" label="很慢" range="> 450ms" desc="建议休息一下再试" color="#999" />
            </Collapsible>
          </ThemedView>

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** 参考表格行 */
function RefRow({ emoji, label, range, desc, color }: {
  emoji: string; label: string; range: string; desc: string; color: string;
}) {
  return (
    <ThemedView style={[refStyles.row, { borderLeftColor: color }]}>
      <ThemedText style={refStyles.emoji}>{emoji}</ThemedText>
      <ThemedView style={refStyles.info}>
        <ThemedView style={refStyles.topLine}>
          <ThemedText type="smallBold">{label}</ThemedText>
          <ThemedText type="small" style={[refStyles.range, { color }]}>{range}</ThemedText>
        </ThemedView>
        <ThemedText type="small" themeColor="textSecondary">{desc}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const refStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.two,
    borderLeftWidth: 3, borderRadius: Spacing.one,
  },
  emoji: { fontSize: 22, lineHeight: 28, width: 36, textAlign: 'center' },
  info: { flex: 1, gap: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  range: { fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { paddingBottom: Spacing.six },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.two, alignSelf: 'flex-start',
  },
  backLabel: { color: '#FF9500' },
  subtitle: { marginTop: Spacing.one, marginBottom: Spacing.four },

  testArea: {
    height: 220, borderRadius: Spacing.three,
    alignItems: 'center', justifyContent: 'center',
    gap: Spacing.two,
  },

  startBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FF9500', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six, borderRadius: Spacing.three, gap: Spacing.two,
  },
  startBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  readyEmoji: { fontSize: 64, lineHeight: 76 },
  goText: { fontSize: 36, fontWeight: '900', color: '#FFFFFF', lineHeight: 44 },
  earlyEmoji: { fontSize: 48, lineHeight: 56 },
  earlyText: { color: '#FFFFFF' },
  resultMs: { fontSize: 48, fontWeight: '800', color: '#FFFFFF', lineHeight: 56 },
  resultHint: { color: '#FFFFFF', opacity: 0.7 },

  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  statNum: { fontSize: 20, fontWeight: '700', lineHeight: 26 },

  resultsList: { marginTop: Spacing.four, gap: Spacing.two },
  resultsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  resultBadge: {
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
    borderRadius: Spacing.one, backgroundColor: '#208AEF15',
  },
  resultBest: { backgroundColor: '#34C759' },

  // Reference
  refSection: { marginTop: Spacing.four },
  rulesDesc: { lineHeight: 20, marginBottom: Spacing.two },
  refTitle: { marginBottom: Spacing.two },
});
