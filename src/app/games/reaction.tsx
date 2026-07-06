import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Phase = 'waiting' | 'ready' | 'go' | 'result' | 'too-early';

export default function ReactionScreen() {
  const [phase, setPhase] = useState<Phase>('waiting');
  const [reaction, setReaction] = useState<number | null>(null);
  const [best, setBest] = useState<number | null>(null);
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

  useEffect(() => cleanup, [cleanup]);

  const avg = results.length > 0 ? Math.round(results.reduce((a, b) => a + b, 0) / results.length) : 0;

  const bgColor = phase === 'go' ? '#34C759' : phase === 'too-early' ? '#FF3B30' : phase === 'ready' ? '#FF9500' : undefined;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => { cleanup(); router.back(); }}>
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

  readyEmoji: { fontSize: 64 },
  goText: { fontSize: 36, fontWeight: '900', color: '#FFFFFF' },
  earlyEmoji: { fontSize: 48 },
  earlyText: { color: '#FFFFFF' },
  resultMs: { fontSize: 48, fontWeight: '800', color: '#FFFFFF' },
  resultHint: { color: '#FFFFFF', opacity: 0.7 },

  statsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  statNum: { fontSize: 20, fontWeight: '700' },

  resultsList: { marginTop: Spacing.four, gap: Spacing.two },
  resultsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  resultBadge: {
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
    borderRadius: Spacing.one, backgroundColor: '#208AEF15',
  },
  resultBest: { backgroundColor: '#34C759' },
});
