import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { saveState } from '@/stores/storage';
import { useDispatch, useStore, type AppState } from '@/stores/useStore';

export default function DataScreen() {
  const state = useStore();
  const dispatch = useDispatch();
  const [importJson, setImportJson] = useState('');

  const exportData = async () => {
    try {
      const json = JSON.stringify(state, null, 2);
      const fileName = `soul_refuge_backup_${new Date().toISOString().slice(0, 10)}.json`;
      const path = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(path, json);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: 'application/json',
          dialogTitle: '导出数据',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('导出成功', `文件已保存到:\n${path}`);
      }
    } catch (e: any) {
      Alert.alert('导出失败', e.message);
    }
  };

  const importData = async () => {
    const t = importJson.trim();
    if (!t) {
      Alert.alert('提示', '请粘贴导出的 JSON 数据');
      return;
    }
    try {
      const parsed: AppState = JSON.parse(t);
      // Basic validation
      if (!parsed.habits || !parsed.moods || !parsed.gameRecords) {
        Alert.alert('错误', '数据格式不正确，请检查');
        return;
      }
      Alert.alert('确认导入', '导入将会覆盖当前所有数据，确定继续？', [
        { text: '取消', style: 'cancel' },
        {
          text: '确定导入', style: 'destructive',
          onPress: async () => {
            dispatch({ type: 'HYDRATE', state: parsed });
            await saveState(parsed);
            setImportJson('');
            Alert.alert('导入成功', '数据已恢复');
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('导入失败', 'JSON 解析错误: ' + e.message);
    }
  };

  const resetAll = () => {
    Alert.alert('⚠️ 清除所有数据', '此操作不可撤销，所有数据将被永久删除。确定继续？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定清除', style: 'destructive',
        onPress: () => {
          const empty: AppState = {
            habits: [], moods: [], diary: [],
            gameRecords: {
              guessNumber: { best: 999, games: 0, extra1: 0, extra2: 0, lastPlayed: null },
              whackAMole: { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null },
              reaction: { best: 9999, games: 0, extra1: 0, extra2: 0, lastPlayed: null },
              colorWord: { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null },
              mathChallenge: { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null },
            },
          };
          dispatch({ type: 'HYDRATE', state: empty });
          saveState(empty);
          Alert.alert('已清除', '所有数据已被删除');
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
              <ThemedView style={styles.backBtn}>
                <FontAwesome name="angle-left" size={18} color="#FF9500" />
              </ThemedView>
              <ThemedText type="small" style={styles.backLabel}>返回</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">数据管理</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              导出、备份与恢复数据
            </ThemedText>
          </ThemedView>

          {/* 数据概览 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              📊 数据概览
            </ThemedText>
            <ThemedView style={styles.statsGrid}>
              <StatItem label="习惯" value={`${state.habits.length} 个`} />
              <StatItem label="心情" value={`${state.moods.length} 条`} />
              <StatItem label="日记" value={`${(state.diary ?? []).length} 篇`} />
              <StatItem label="游戏" value={`${Object.values(state.gameRecords).filter(r => r.games > 0).length} 个`} />
            </ThemedView>
          </ThemedView>

          {/* 导出 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              📤 导出数据
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
              将所有数据（习惯、心情、日记、游戏记录）导出为 JSON 文件，可用于备份或迁移
            </ThemedText>
            <Pressable style={styles.actionBtn} onPress={exportData}>
              <FontAwesome name="download" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionBtnText}>导出 JSON 文件</ThemedText>
            </Pressable>
          </ThemedView>

          {/* 导入 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              📥 导入数据
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
              粘贴之前导出的 JSON 数据来恢复
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.importInputWrapper}>
              <TextInput
                style={styles.importInput}
                placeholder="在此粘贴 JSON 数据..."
                placeholderTextColor="#999"
                value={importJson}
                onChangeText={setImportJson}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ThemedView>
            <Pressable style={[styles.actionBtn, styles.importBtn]} onPress={importData}>
              <FontAwesome name="upload" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionBtnText}>导入数据</ThemedText>
            </Pressable>
          </ThemedView>

          {/* 清除 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              🗑 清除数据
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
              删除所有本地数据（习惯、心情、日记）。游戏记录将保留。
            </ThemedText>
            <Pressable style={[styles.actionBtn, styles.dangerBtn]} onPress={resetAll}>
              <FontAwesome name="trash" size={16} color="#FFFFFF" />
              <ThemedText style={styles.actionBtnText}>清除所有数据</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView style={styles.statItem}>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },

  // Header
  header: { paddingVertical: Spacing.three, gap: Spacing.half },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.one, alignSelf: 'flex-start',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: '#FF950012', alignItems: 'center', justifyContent: 'center',
  },
  backLabel: { color: '#FF9500' },

  // Cards
  card: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.three },
  sectionLabel: { marginBottom: -Spacing.one },
  desc: { lineHeight: 20 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: Spacing.two },
  statItem: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: Spacing.two, borderRadius: Spacing.two,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#FF9500' },

  // Buttons
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF9500', paddingVertical: Spacing.three,
    borderRadius: Spacing.three, gap: Spacing.two,
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  importBtn: { backgroundColor: '#34C759' },
  dangerBtn: { backgroundColor: '#FF3B30' },

  // Import input
  importInputWrapper: {
    borderRadius: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderWidth: 1, borderColor: '#FF950030',
  },
  importInput: { fontSize: 14, minHeight: 80, color: '#FF9500', lineHeight: 20 },
});
