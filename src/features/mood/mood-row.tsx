import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useDispatch, type MoodEntry } from '@/stores/useStore';

// ============================================================
// 心情选项（导出供外部使用）
// ============================================================

export const MOOD_OPTIONS = [
  { emoji: '😊', label: '开心' },
  { emoji: '😌', label: '平静' },
  { emoji: '🤩', label: '兴奋' },
  { emoji: '😢', label: '难过' },
  { emoji: '😡', label: '生气' },
  { emoji: '😰', label: '焦虑' },
  { emoji: '😴', label: '疲惫' },
  { emoji: '🥰', label: '幸福' },
];

// ============================================================
// 时间线行
// ============================================================

export function MoodRow({ entry }: { entry: MoodEntry }) {
  const dispatch = useDispatch();

  const moodLabel = MOOD_OPTIONS.find((m) => m.emoji === entry.mood)?.label ?? '';

  return (
    <ThemedView type="backgroundElement" style={styles.moodRow}>
      {/* emoji */}
      <ThemedView style={styles.moodEmojiBox}>
        <ThemedText style={styles.moodEmoji}>{entry.mood}</ThemedText>
      </ThemedView>

      {/* 内容 */}
      <ThemedView style={styles.moodRowContent}>
        <ThemedView style={styles.moodRowHeader}>
          <ThemedText type="smallBold">{moodLabel}</ThemedText>
          <ThemedView style={styles.moodRowMeta}>
            <ThemedText type="small" themeColor="textSecondary">
              {entry.date}
            </ThemedText>
            <Pressable
              onPress={() => dispatch({ type: 'DELETE_MOOD', id: entry.id })}
            >
              <FontAwesome name="trash" size={14} color="#FF3B30" />
            </Pressable>
          </ThemedView>
        </ThemedView>
        {entry.note ? (
          <ThemedText type="default" style={styles.moodRowNote}>
            {entry.note}
          </ThemedText>
        ) : null}
      </ThemedView>
    </ThemedView>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  moodRow: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  moodEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 28,
    lineHeight: 36,
  },
  moodRowContent: {
    flex: 1,
    gap: Spacing.one,
  },
  moodRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  moodRowNote: {
    opacity: 0.7,
  },
});
