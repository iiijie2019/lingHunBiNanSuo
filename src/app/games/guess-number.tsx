import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

function pickNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

export default function GuessNumberScreen() {
  const isDark = useColorScheme() === 'dark';
  const [target, setTarget] = useState(pickNumber);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [won, setWon] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const checkGuess = useCallback(() => {
    const n = parseInt(guess, 10);
    if (isNaN(n) || n < 1 || n > 100) return;
    setAttempts((a) => [n, ...a]);
    setGuess('');
    if (n === target) {
      setMessage('🎉 猜对了！');
      setWon(true);
    } else if (n < target) {
      setMessage('📈 太小了，再大一点');
    } else {
      setMessage('📉 太大了，再小一点');
    }
  }, [guess, target]);

  const reset = () => {
    setTarget(pickNumber());
    setAttempts([]);
    setMessage('');
    setGuess('');
    setWon(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#208AEF" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedText type="subtitle">猜数字</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          我想了一个 1 ~ 100 之间的数，猜猜看
        </ThemedText>

        <ThemedView type="backgroundElement" style={styles.card}>
          {!won ? (
            <>
              <ThemedView style={styles.inputRow}>
                <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                    value={guess}
                    onChangeText={setGuess}
                    keyboardType="number-pad"
                    maxLength={3}
                    placeholder="输入数字"
                    placeholderTextColor="#999"
                    onSubmitEditing={checkGuess}
                  />
                </ThemedView>
                <Pressable style={styles.guessBtn} onPress={checkGuess}>
                  <ThemedText style={styles.guessBtnText}>猜！</ThemedText>
                </Pressable>
              </ThemedView>

              {message !== '' && (
                <ThemedText type="default" style={styles.message}>{message}</ThemedText>
              )}

              <ThemedText type="small" themeColor="textSecondary">
                已猜 {attempts.length} 次
              </ThemedText>
            </>
          ) : (
            <ThemedView style={styles.winBox}>
              <ThemedText style={styles.winEmoji}>🎉</ThemedText>
              <ThemedText type="subtitle" style={styles.winTitle}>恭喜！</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                答案就是 {target}，你用了 {attempts.length} 次猜中
              </ThemedText>
              <Pressable style={styles.resetBtn} onPress={reset}>
                <FontAwesome name="refresh" size={16} color="#FFFFFF" />
                <ThemedText style={styles.resetBtnText}>再来一局</ThemedText>
              </Pressable>
            </ThemedView>
          )}
        </ThemedView>

        {/* 历史猜测 */}
        {attempts.length > 0 && (
          <ThemedView style={styles.historySection}>
            <ThemedText type="smallBold" themeColor="textSecondary">猜测记录</ThemedText>
            <ThemedView style={styles.historyRow}>
              {attempts.map((a, i) => (
                <ThemedView
                  key={i}
                  style={[
                    styles.historyItem,
                    a === target && styles.historyWin,
                    a < target && styles.historyLow,
                    a > target && styles.historyHigh,
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={a === target ? { color: '#FFFFFF' } : undefined}
                  >
                    {a}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={a === target ? { color: '#FFFFFF' } : undefined}
                  >
                    {a === target ? '✓' : a < target ? '↑' : '↓'}
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
  backLabel: { color: '#208AEF' },
  subtitle: { marginTop: Spacing.one, marginBottom: Spacing.four },

  card: {
    padding: Spacing.four, borderRadius: Spacing.three,
    gap: Spacing.four, alignItems: 'center',
  },

  inputRow: { flexDirection: 'row', gap: Spacing.two, width: '100%' },
  inputWrapper: {
    flex: 1, borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  input: { fontSize: 28, fontWeight: '700', textAlign: 'center', padding: 0, lineHeight: 36 },
  guessBtn: {
    backgroundColor: '#208AEF', paddingHorizontal: Spacing.six,
    borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center',
  },
  guessBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  message: { fontSize: 18, fontWeight: '600', lineHeight: 24 },

  // Win
  winBox: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two },
  winEmoji: { fontSize: 64, lineHeight: 76 },
  winTitle: { color: '#34C759' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#208AEF', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five, borderRadius: Spacing.three, gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resetBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // History
  historySection: { marginTop: Spacing.four, gap: Spacing.two },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  historyWin: { backgroundColor: '#34C759' },
  historyLow: { backgroundColor: '#FF950020' },
  historyHigh: { backgroundColor: '#FF6B6B20' },
});
