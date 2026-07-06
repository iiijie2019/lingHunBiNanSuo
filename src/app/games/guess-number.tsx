import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, useStore } from '@/stores/useStore';

function pickNumber() {
  return Math.floor(Math.random() * 100) + 1;
}

export default function GuessNumberScreen() {
  const isDark = useColorScheme() === 'dark';
  const dispatch = useDispatch();
  const { gameRecords } = useStore();
  const bestRecord = gameRecords.guessNumber;
  const [target, setTarget] = useState(pickNumber);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [message, setMessage] = useState('');
  const [won, setWon] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const gameSavedRef = useRef(false);

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
    gameSavedRef.current = false;
    inputRef.current?.focus();
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Save record when game is won (only once per game)
  useEffect(() => {
    if (won && !gameSavedRef.current) {
      gameSavedRef.current = true;
      dispatch({ type: 'SAVE_GAME_RECORD', game: 'guessNumber', score: attempts.length });
    }
  }, [won, attempts.length, dispatch]);

  const getMessageStyle = () => {
    if (!message) return {};
    if (message.includes('太小')) return { backgroundColor: isDark ? '#FF950020' : '#FF950012', color: '#FF9500' };
    if (message.includes('太大')) return { backgroundColor: isDark ? '#FF6B6B20' : '#FF6B6B12', color: '#FF6B6B' };
    return { backgroundColor: isDark ? '#34C75920' : '#34C75912', color: '#34C759' };
  };

  // 动态计算有效范围
  const effectiveMin = attempts.length > 0
    ? Math.max(1, ...attempts.filter(a => a < target)) : 1;
  const effectiveMax = attempts.length > 0
    ? Math.min(100, ...attempts.filter(a => a > target)) : 100;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 头部 */}
          <ThemedView style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
              <ThemedView style={styles.backBtn}>
                <FontAwesome name="angle-left" size={18} color="#208AEF" />
              </ThemedView>
              <ThemedText type="small" style={styles.backLabel}>返回</ThemedText>
            </Pressable>
            <ThemedView style={styles.titleRow}>
              <ThemedView style={styles.titleIcon}>
                <ThemedText style={styles.titleIconText}>🎯</ThemedText>
              </ThemedView>
              <ThemedView style={styles.titleInfo}>
                <ThemedText type="subtitle">猜数字</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  猜猜我想的是哪个数字
                </ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          {/* 游戏规则 */}
          <Pressable
            style={styles.rulesToggle}
            onPress={() => setShowRules(!showRules)}
          >
            <ThemedView style={styles.rulesToggleInner}>
              <FontAwesome name="info-circle" size={14} color="#208AEF" />
              <ThemedText type="smallBold" style={styles.rulesToggleText}>
                游戏规则
              </ThemedText>
            </ThemedView>
            <FontAwesome
              name={showRules ? 'angle-up' : 'angle-down'}
              size={12}
              color="#999"
            />
          </Pressable>

          {showRules && (
            <ThemedView type="backgroundElement" style={styles.rulesCard}>
              <RuleItem icon="1" text="系统随机生成一个 1~100 之间的整数" />
              <ThemedView style={styles.ruleDivider} />
              <RuleItem icon="2" text={'在输入框中输入你猜的数字，点击"猜！"或按确认键'} />
              <ThemedView style={styles.ruleDivider} />
              <RuleItem icon="3" text={'系统会提示"太大"或"太小"，帮你缩小范围'} />
              <ThemedView style={styles.ruleDivider} />
              <RuleItem icon="4" text="不断调整，直到猜中为止，次数越少越厉害！" />
            </ThemedView>
          )}

          {/* 游戏面板 */}
          <ThemedView type="backgroundElement" style={styles.gameCard}>
            {/* 范围提示 */}
            <ThemedView style={styles.rangeRow}>
              <ThemedView style={styles.rangeBadge}>
                <ThemedText type="smallBold" style={styles.rangeText}>{effectiveMin}</ThemedText>
              </ThemedView>
              <ThemedView style={styles.rangeLineContainer}>
                <ThemedView style={styles.rangeLine} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.rangeHint}>
                  剩余 {effectiveMax - effectiveMin + 1} 个数
                </ThemedText>
              </ThemedView>
              <ThemedView style={styles.rangeBadge}>
                <ThemedText type="smallBold" style={styles.rangeText}>{effectiveMax}</ThemedText>
              </ThemedView>
            </ThemedView>

            {!won ? (
              <>
                {/* 输入区 */}
                <ThemedView style={styles.inputRow}>
                  <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                    <TextInput
                      ref={inputRef}
                      style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                      value={guess}
                      onChangeText={setGuess}
                      keyboardType="number-pad"
                      maxLength={3}
                      placeholder="?"
                      placeholderTextColor={isDark ? '#555' : '#CCC'}
                      onSubmitEditing={checkGuess}
                      selectTextOnFocus
                    />
                  </ThemedView>
                  <Pressable
                    style={({ pressed }) => [
                      styles.guessBtn,
                      pressed && styles.guessBtnPressed,
                    ]}
                    onPress={checkGuess}
                  >
                    <ThemedText style={styles.guessBtnText}>猜！</ThemedText>
                  </Pressable>
                </ThemedView>

                {/* 反馈消息 */}
                {message !== '' && (
                  <ThemedView style={[styles.messageBox, getMessageStyle()]}>
                    <ThemedText
                      type="default"
                      style={[styles.messageText, { color: getMessageStyle().color }]}
                    >
                      {message}
                    </ThemedText>
                  </ThemedView>
                )}

                {/* 统计信息 */}
                <ThemedView style={styles.statsRow}>
                  <ThemedView style={styles.statItem}>
                    <ThemedText style={styles.statIcon}>📝</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      已猜 {attempts.length} 次
                    </ThemedText>
                  </ThemedView>
                  {attempts.length > 0 && (
                    <ThemedView style={styles.statItem}>
                      <ThemedText style={styles.statIcon}>💡</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {attempts[0] < target ? '↑ 往上猜' : '↓ 往下猜'}
                      </ThemedText>
                    </ThemedView>
                  )}
                  {bestRecord.games > 0 && (
                    <ThemedView style={styles.statItem}>
                      <ThemedText style={styles.statIcon}>🏆</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        最佳 {bestRecord.best} 次
                      </ThemedText>
                    </ThemedView>
                  )}
                </ThemedView>
              </>
            ) : (
              /* 胜利状态 */
              <ThemedView style={styles.winBox}>
                <ThemedView style={styles.winEmojiWrap}>
                  <ThemedText style={styles.winEmoji}>🎉</ThemedText>
                </ThemedView>
                <ThemedText style={styles.winTitle}>恭喜猜中！</ThemedText>
                <ThemedView style={styles.winStats}>
                  <ThemedView style={styles.winStatItem}>
                    <ThemedText type="subtitle" style={styles.winStatValue}>
                      {target}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">答案</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.winStatDivider} />
                  <ThemedView style={styles.winStatItem}>
                    <ThemedText type="subtitle" style={styles.winStatValue}>
                      {attempts.length}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">次数</ThemedText>
                  </ThemedView>
                  <ThemedView style={styles.winStatDivider} />
                  <ThemedView style={styles.winStatItem}>
                    <ThemedText type="subtitle" style={styles.winStatValue}>
                      {attempts.length <= 5 ? '🏆' : attempts.length <= 10 ? '👍' : '💪'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">评价</ThemedText>
                  </ThemedView>
                </ThemedView>
                <Pressable
                  style={({ pressed }) => [
                    styles.resetBtn,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={reset}
                >
                  <FontAwesome name="refresh" size={15} color="#FFFFFF" />
                  <ThemedText style={styles.resetBtnText}>再来一局</ThemedText>
                </Pressable>
              </ThemedView>
            )}
          </ThemedView>

          {/* 猜测记录 */}
          {attempts.length > 0 && (
            <ThemedView style={styles.historySection}>
              <ThemedView style={styles.historyHeader}>
                <FontAwesome name="history" size={13} color="#999" />
                <ThemedText type="smallBold" themeColor="textSecondary">
                  猜测记录
                </ThemedText>
                {attempts.length > 0 && won && (
                  <ThemedText type="small" style={styles.bestScore}>
                    👏 用了 {attempts.length} 次
                  </ThemedText>
                )}
              </ThemedView>
              <ThemedView style={styles.historyRow}>
                {attempts.map((a, i) => {
                  const isWin = a === target;
                  const isLow = a < target;
                  return (
                    <ThemedView
                      key={i}
                      style={[
                        styles.historyItem,
                        isWin && styles.historyWin,
                        !isWin && isLow && styles.historyLow,
                        !isWin && !isLow && styles.historyHigh,
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={[styles.historyStep, isWin && styles.historyStepWin]}
                      >
                        #{attempts.length - i}
                      </ThemedText>
                      <ThemedText
                        type="smallBold"
                        style={isWin ? styles.historyNumWin : undefined}
                      >
                        {a}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={isWin ? styles.historyNumWin : undefined}
                      >
                        {isWin ? '✓' : isLow ? '↑' : '↓'}
                      </ThemedText>
                    </ThemedView>
                  );
                })}
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

/** 规则条目子组件 */
function RuleItem({ icon, text }: { icon: string; text: string }) {
  return (
    <ThemedView style={styles.ruleItem}>
      <ThemedView style={styles.ruleIcon}>
        <ThemedText type="smallBold" style={styles.ruleIconText}>{icon}</ThemedText>
      </ThemedView>
      <ThemedText type="small" themeColor="textSecondary" style={styles.ruleText}>{text}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { paddingBottom: Spacing.six },

  // Header
  header: { gap: Spacing.three, paddingBottom: Spacing.three },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.one, alignSelf: 'flex-start',
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#208AEF12', alignItems: 'center', justifyContent: 'center',
  },
  backLabel: { color: '#208AEF' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  titleIcon: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#208AEF12', alignItems: 'center', justifyContent: 'center',
  },
  titleIconText: { fontSize: 28, lineHeight: 36 },
  titleInfo: { gap: 2 },

  // Rules
  rulesToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.two,
  },
  rulesToggleInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  rulesToggleText: { color: '#208AEF' },
  rulesCard: {
    padding: Spacing.four, borderRadius: Spacing.three,
    marginBottom: Spacing.three, gap: Spacing.three,
  },
  ruleItem: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  ruleIcon: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#208AEF12', alignItems: 'center', justifyContent: 'center',
  },
  ruleIconText: { color: '#208AEF', fontSize: 12 },
  ruleText: { flex: 1, lineHeight: 20 },
  ruleDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E5E5EA', marginLeft: 34 },

  // Game Card
  gameCard: {
    padding: Spacing.five, borderRadius: Spacing.four,
    gap: Spacing.four, alignItems: 'center',
  },

  // Range
  rangeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two, width: '100%',
  },
  rangeBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#208AEF12', alignItems: 'center', justifyContent: 'center',
  },
  rangeText: { color: '#208AEF', fontSize: 15 },
  rangeLineContainer: { flex: 1, alignItems: 'center', gap: Spacing.one },
  rangeLine: {
    width: '100%', height: 3, backgroundColor: '#208AEF18',
    borderRadius: 2,
  },
  rangeHint: { fontSize: 12 },

  // Input
  inputRow: { flexDirection: 'row', gap: Spacing.two, width: '100%' },
  inputWrapper: {
    flex: 1, borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderWidth: 2, borderColor: '#208AEF30',
  },
  input: {
    fontSize: 32, fontWeight: '700', textAlign: 'center',
    padding: 0, lineHeight: 42,
  },
  guessBtn: {
    backgroundColor: '#208AEF', paddingHorizontal: 28,
    borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center',
    minWidth: 80,
  },
  guessBtnPressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
  guessBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  // Message
  messageBox: {
    paddingVertical: Spacing.two, paddingHorizontal: Spacing.four,
    borderRadius: 20, width: '100%', alignItems: 'center',
  },
  messageText: { fontSize: 16, fontWeight: '600', lineHeight: 22 },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: Spacing.five,
    paddingTop: Spacing.one,
  },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  statIcon: { fontSize: 14 },

  // Win
  winBox: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.two },
  winEmojiWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#34C75912', alignItems: 'center', justifyContent: 'center',
  },
  winEmoji: { fontSize: 48, lineHeight: 56 },
  winTitle: { fontSize: 24, fontWeight: '700', color: '#34C759' },
  winStats: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.five,
    paddingVertical: Spacing.three,
  },
  winStatItem: { alignItems: 'center', gap: 4 },
  winStatValue: { color: '#208AEF' },
  winStatDivider: { width: 1, height: 36, backgroundColor: '#E5E5EA' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#208AEF', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.six, borderRadius: 25, gap: Spacing.two,
    marginTop: Spacing.one,
  },
  resetBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // History
  historySection: { marginTop: Spacing.four, gap: Spacing.three },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
  },
  bestScore: { color: '#34C759', marginLeft: 'auto' },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
    borderRadius: 10,
  },
  historyStep: { opacity: 0.4, marginRight: 2, fontSize: 11 },
  historyStepWin: { opacity: 0.7, color: '#FFFFFF' },
  historyNumWin: { color: '#FFFFFF' },
  historyWin: { backgroundColor: '#34C759' },
  historyLow: { backgroundColor: '#FF950012' },
  historyHigh: { backgroundColor: '#FF6B6B12' },
});
