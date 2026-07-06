import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { HabitRow } from '@/features/habits/habit-row';
import { today, useDispatch, useStore, type Habit } from '@/stores/useStore';

const EMOJI_OPTIONS = ['🏃', '📚', '💧', '🧘', '💻', '🎸', '✍️', '🍎', '😴', '🚭', '💊', '🎯'];

export default function HabitsScreen() {
  const { habits } = useStore();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏃');

  const todaysDate = today();
  const completedToday = habits.filter((h) => h.completedDates.includes(todaysDate)).length;
  const progress = habits.length > 0 ? completedToday / habits.length : 0;

  const addHabit = () => {
    const name = newName.trim();
    if (!name) return;
    dispatch({ type: 'ADD_HABIT', name, emoji: newEmoji });
    setNewName('');
    setNewEmoji('🏃');
    setModalVisible(false);
  };

  const deleteHabit = (habit: Habit) => {
    Alert.alert('删除习惯', `确定要删除「${habit.emoji} ${habit.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: () => dispatch({ type: 'DELETE_HABIT', id: habit.id }),
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">习惯打卡</ThemedText>
          <ThemedView style={styles.badge}>
            <ThemedText type="smallBold" style={styles.badgeText}>
              {completedToday}/{habits.length} 今日
            </ThemedText>
          </ThemedView>
        </ThemedView>

        {habits.length > 0 && (
          <ThemedView style={styles.progressSection}>
            <ThemedView type="backgroundElement" style={styles.progressBar}>
              <ThemedView style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              {progress >= 1 ? '🎉 全部完成！' : `${Math.round(progress * 100)}% 已完成`}
            </ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={habits}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>🎯</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                还没有习惯
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                点击下方按钮开始添加
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <HabitRow habit={item} onDelete={() => deleteHabit(item)} />
          )}
        />

        <Pressable style={styles.addButton} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus" size={20} color="#FFFFFF" />
          <ThemedText style={styles.addButtonText}>添加新习惯</ThemedText>
        </Pressable>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
          <ThemedView style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <ThemedView style={styles.modalHandle} />
            <ThemedText type="subtitle" style={styles.modalTitle}>新建习惯</ThemedText>

            <ThemedText type="smallBold" themeColor="textSecondary">选择图标</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((emoji) => (
                <Pressable
                  key={emoji}
                  style={[styles.emojiOption, newEmoji === emoji && styles.emojiSelected]}
                  onPress={() => setNewEmoji(emoji)}
                >
                  <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>

            <ThemedText type="smallBold" themeColor="textSecondary">习惯名称</ThemedText>
            <ThemedView type="backgroundElement" style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                placeholder="例如：每天阅读30分钟"
                placeholderTextColor="#999"
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
            </ThemedView>

            <ThemedView style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <ThemedText type="default">取消</ThemedText>
              </Pressable>
              <Pressable style={styles.confirmButton} onPress={addHabit}>
                <ThemedText style={styles.confirmButtonText}>创建</ThemedText>
              </Pressable>
            </ThemedView>
          </ThemedView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  badge: {
    backgroundColor: '#208AEF18', paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one, borderRadius: 20,
  },
  badgeText: { color: '#208AEF' },

  // Progress
  progressSection: { gap: Spacing.two, marginBottom: Spacing.one },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },

  // List
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  empty: {
    alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.six * 2, borderRadius: Spacing.three,
  },
  emptyEmoji: { fontSize: 48 },

  // Add button
  addButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#208AEF', paddingVertical: Spacing.three,
    borderRadius: Spacing.three, gap: Spacing.two, marginTop: Spacing.two,
    shadowColor: '#208AEF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six,
    marginTop: 'auto',
  },
  modalContentDark: { backgroundColor: '#1C1C1E' },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: '#C0C0C0',
    alignSelf: 'center', marginBottom: Spacing.one,
  },
  modalTitle: { textAlign: 'center' },
  emojiRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.one },
  emojiOption: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  emojiSelected: { borderColor: '#208AEF', backgroundColor: '#208AEF15' },
  emojiText: { fontSize: 24 },
  inputWrapper: {
    borderRadius: Spacing.three, paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  input: { fontSize: 16, padding: 0 },
  modalButtons: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  cancelButton: {
    flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three,
    alignItems: 'center', borderWidth: 1, borderColor: '#C0C0C0',
  },
  confirmButton: {
    flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three,
    alignItems: 'center', backgroundColor: '#208AEF',
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
