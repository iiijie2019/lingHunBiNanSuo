import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { MOOD_OPTIONS } from '@/features/mood/mood-row';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore, type DiaryEntry } from '@/stores/useStore';
import { confirmAction } from '@/utils/confirm-action';

export default function DiaryScreen() {
  const { diary } = useStore();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodEmoji, setMoodEmoji] = useState<string | undefined>();

  const openEditor = (entry?: DiaryEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setTitle(entry.title);
      setContent(entry.content);
      setMoodEmoji(entry.moodEmoji);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
      setMoodEmoji(undefined);
    }
    setModalVisible(true);
  };

  const save = () => {
    const t = title.trim();
    if (!t) return;
    if (editingId) {
      dispatch({ type: 'UPDATE_DIARY', id: editingId, title: t, content: content.trim(), moodEmoji });
    } else {
      dispatch({ type: 'ADD_DIARY', title: t, content: content.trim(), moodEmoji });
    }
    setModalVisible(false);
  };

  const deleteDiary = (entry: DiaryEntry) => {
    confirmAction({
      title: '删除日记',
      message: `确定要删除「${entry.title}」吗？`,
      confirmText: '删除',
      destructive: true,
      onConfirm: () => dispatch({ type: 'DELETE_DIARY', id: entry.id }),
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedView style={styles.header}>
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}>
              <FontAwesome name="angle-left" size={18} color="#AF52DE" />
            </ThemedView>
            <ThemedText type="small" style={styles.backLabel}>返回</ThemedText>
          </Pressable>
          <ThemedText type="subtitle">航行日志</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            已记录 {diary.length} 段旅程
          </ThemedText>
        </ThemedView>

        <FlatList
          data={diary}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView type="backgroundElement" style={styles.empty}>
              <ThemedText style={styles.emptyEmoji}>📝</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">航行日志还是空的</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">写下此刻，点亮第一颗记忆星</ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <Pressable onPress={() => openEditor(item)} onLongPress={() => deleteDiary(item)}>
              <ThemedView type="backgroundElement" style={styles.diaryCard}>
                <ThemedView style={styles.diaryHeader}>
                  <ThemedText type="default" style={styles.diaryTitle}>
                    {item.moodEmoji ? `${item.moodEmoji} ` : ''}{item.title}
                  </ThemedText>
                  <ThemedView style={styles.diaryMeta}>
                    <ThemedText type="small" themeColor="textSecondary">{formatDate(item.createdAt)}</ThemedText>
                    <Pressable
                      hitSlop={8}
                      onPress={(event) => {
                        event.stopPropagation();
                        deleteDiary(item);
                      }}
                    >
                      <FontAwesome name="trash-o" size={15} color="#FF3B30" />
                    </Pressable>
                  </ThemedView>
                </ThemedView>
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={3} style={styles.diaryPreview}>
                  {item.content}
                </ThemedText>
                {item.tags.length > 0 && (
                  <ThemedView style={styles.tagsRow}>
                    {item.tags.map((tag) => (
                      <ThemedView key={tag} style={styles.tag}>
                        <ThemedText type="small" style={styles.tagText}>{tag}</ThemedText>
                      </ThemedView>
                    ))}
                  </ThemedView>
                )}
              </ThemedView>
            </Pressable>
          )}
        />

        <Pressable style={styles.fab} onPress={() => openEditor()}>
          <FontAwesome name="pencil" size={22} color="#FFFFFF" />
        </Pressable>

        {/* Editor Modal */}
        <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" transparent>
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ThemedView type="backgroundElement" style={styles.modalContent}>
              <ThemedText type="subtitle" style={styles.modalTitle}>
                {editingId ? '编辑日记' : '写日记'}
              </ThemedText>

              {/* 心情选择 */}
              <ThemedText type="smallBold" themeColor="textSecondary">今日心情</ThemedText>
              <ThemedView style={styles.moodRow}>
                {MOOD_OPTIONS.map(({ emoji, label }) => (
                  <Pressable
                    key={emoji}
                    style={[styles.moodOption, moodEmoji === emoji && styles.moodSelected]}
                    onPress={() => setMoodEmoji(moodEmoji === emoji ? undefined : emoji)}
                  >
                    <ThemedText style={styles.moodOptionText}>{emoji}</ThemedText>
                  </Pressable>
                ))}
              </ThemedView>

              {/* 标题 */}
              <ThemedText type="smallBold" themeColor="textSecondary">标题</ThemedText>
              <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                <TextInput
                  style={[styles.titleInput, { color: theme.text }]}
                  placeholder="今天发生了什么..."
                  placeholderTextColor="#999"
                  value={title}
                  onChangeText={setTitle}
                />
              </ThemedView>

              {/* 正文 */}
              <ThemedText type="smallBold" themeColor="textSecondary">正文</ThemedText>
              <ThemedView type="backgroundElement" style={styles.inputWrapper}>
                <TextInput
                  style={[styles.contentInput, { color: theme.text }]}
                  placeholder="写下你的想法..."
                  placeholderTextColor="#999"
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />
              </ThemedView>

              {/* 按钮 */}
              <ThemedView style={styles.modalButtons}>
                <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <ThemedText type="default">取消</ThemedText>
                </Pressable>
                <Pressable style={styles.confirmButton} onPress={save}>
                  <ThemedText style={styles.confirmButtonText}>{editingId ? '保存' : '写好了'}</ThemedText>
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

  // Header
  header: { paddingVertical: Spacing.three, gap: Spacing.half },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.one, alignSelf: 'flex-start',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#AF52DE12', alignItems: 'center', justifyContent: 'center',
  },
  backLabel: { color: '#AF52DE' },

  // List
  list: { gap: Spacing.three, paddingBottom: 80 },
  empty: {
    alignItems: 'center', gap: Spacing.two,
    paddingVertical: Spacing.six * 2, borderRadius: Spacing.three,
  },
  emptyEmoji: { fontSize: 48, lineHeight: 56 },

  // Card
  diaryCard: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.two },
  diaryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    gap: Spacing.two,
  },
  diaryTitle: { fontWeight: '600', flex: 1 },
  diaryMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  diaryPreview: { lineHeight: 20, opacity: 0.7 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  tag: {
    backgroundColor: '#AF52DE15', paddingHorizontal: Spacing.two,
    paddingVertical: 2, borderRadius: 8,
  },
  tagText: { color: '#AF52DE' },

  // FAB
  fab: {
    position: 'absolute', right: Spacing.four, bottom: Spacing.six,
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#AF52DE',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#AF52DE', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.four, gap: Spacing.two, paddingBottom: Spacing.six,
    maxHeight: '90%',
  },
  modalTitle: { textAlign: 'center', marginBottom: Spacing.one },
  moodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  moodOption: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  moodSelected: { borderColor: '#AF52DE', backgroundColor: '#AF52DE15' },
  moodOptionText: { fontSize: 22, lineHeight: 28 },

  inputWrapper: {
    borderRadius: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  titleInput: { fontSize: 18, fontWeight: '600', padding: 0 },
  contentInput: { fontSize: 16, minHeight: 160, padding: 0, lineHeight: 24 },

  modalButtons: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  cancelButton: {
    flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three,
    alignItems: 'center', borderWidth: 1, borderColor: '#C0C0C0',
  },
  confirmButton: {
    flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three,
    alignItems: 'center', backgroundColor: '#AF52DE',
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
