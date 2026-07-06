import { FontAwesome } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MOOD_OPTIONS, MoodRow } from '@/features/mood/mood-row';
import { useDispatch, useStore } from '@/stores/useStore';

export default function MoodScreen() {
  const { moods } = useStore();
  const dispatch = useDispatch();
  const isDark = useColorScheme() === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState('😊');
  const [note, setNote] = useState('');

  const todayMood = moods.find(
    (m) => m.date === new Date().toISOString().slice(0, 10),
  );

  const saveMood = () => {
    dispatch({ type: 'ADD_MOOD', mood: selectedMood, note: note.trim() });
    setSelectedMood('😊');
    setNote('');
    setModalVisible(false);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">心情日记</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            记录每一天的心情
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.todayCard}>
          {todayMood ? (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                今天的心情
              </ThemedText>
              <ThemedText style={styles.todayMoodEmoji}>{todayMood.mood}</ThemedText>
              {todayMood.note ? (
                <ThemedText type="default" style={styles.todayNote}>
                  "{todayMood.note}"
                </ThemedText>
              ) : null}
            </>
          ) : (
            <>
              <ThemedText type="default" themeColor="textSecondary">
                今天还没有记录心情
              </ThemedText>
              <Pressable
                style={styles.recordButton}
                onPress={() => setModalVisible(true)}
              >
                <ThemedText style={styles.recordButtonText}>立即记录</ThemedText>
              </Pressable>
            </>
          )}
        </ThemedView>

        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
          历史记录
        </ThemedText>

        <FlatList
          data={moods}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <FontAwesome name="heart" size={48} color="#999" />
              <ThemedText type="default" themeColor="textSecondary">
                还没有记录，点击右下角按钮开始记录吧
              </ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => <MoodRow entry={item} />}
        />

        <Pressable style={styles.fab} onPress={() => setModalVisible(true)}>
          <FontAwesome name="plus" size={24} color="#FFFFFF" />
        </Pressable>

        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          transparent
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
          >
            <ThemedView style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                记录心情
              </ThemedText>

              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                此刻的感受
              </ThemedText>
              <ThemedView style={styles.moodGrid}>
                {MOOD_OPTIONS.map(({ emoji, label }) => (
                  <Pressable
                    key={emoji}
                    style={[
                      styles.moodOption,
                      selectedMood === emoji && styles.moodSelected,
                    ]}
                    onPress={() => setSelectedMood(emoji)}
                  >
                    <ThemedText style={styles.moodOptionEmoji}>{emoji}</ThemedText>
                    <ThemedText type="small">{label}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>

              <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
                备注（可选）
              </ThemedText>
              <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFFFFF' : '#000000' }]}
                  placeholder="今天发生了什么..."
                  placeholderTextColor="#999"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  numberOfLines={3}
                />
              </ThemedView>

              <ThemedView style={styles.modalButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <ThemedText type="default">取消</ThemedText>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={saveMood}>
                  <ThemedText style={styles.confirmButtonText}>记录</ThemedText>
                </Pressable>
              </ThemedView>
            </ThemedView>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  header: { paddingVertical: Spacing.three, gap: Spacing.half },
  todayCard: {
    padding: Spacing.four, borderRadius: Spacing.four,
    alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.four,
  },
  todayMoodEmoji: { fontSize: 64, lineHeight: 76 },
  todayNote: { fontStyle: 'italic', opacity: 0.7, textAlign: 'center' },
  recordButton: {
    backgroundColor: '#208AEF', paddingHorizontal: Spacing.six,
    paddingVertical: Spacing.two, borderRadius: Spacing.three, marginTop: Spacing.two,
  },
  recordButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  sectionTitle: { marginBottom: Spacing.three },
  list: { gap: Spacing.two, paddingBottom: 80 },
  empty: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six * 2 },
  fab: {
    position: 'absolute', right: Spacing.four, bottom: Spacing.six,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#208AEF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#208AEF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six,
  },
  modalTitle: { textAlign: 'center', marginBottom: Spacing.two },
  label: { marginBottom: -Spacing.two },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  moodOption: {
    width: '23%', aspectRatio: 1, borderRadius: Spacing.three,
    alignItems: 'center', justifyContent: 'center', gap: 2,
    borderWidth: 2, borderColor: 'transparent',
  },
  moodSelected: { borderColor: '#208AEF', backgroundColor: '#208AEF15' },
  moodOptionEmoji: { fontSize: 28, lineHeight: 36 },
  inputWrapper: {
    borderRadius: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  input: { fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
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
