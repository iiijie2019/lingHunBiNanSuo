import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LogoSpinner } from '@/components/logo-spinner';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createInitialState, normalizeAppState, today, useDispatch, useStore } from '@/stores/useStore';
import { confirmAction } from '@/utils/confirm-action';

export default function DataScreen() {
  const state = useStore();
  const dispatch = useDispatch();
  const theme = useTheme();
  const [importJson, setImportJson] = useState('');
  const [busy, setBusy] = useState(false);
  const feelingDays = new Set([
    ...state.moods.map((entry) => entry.date),
    ...state.diary.filter((entry) => entry.moodEmoji).map((entry) => entry.date),
  ]).size;

  const exportData = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const json = JSON.stringify(state, null, 2);
      const fileName = `liuyinji_backup_${today()}.json`;

      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
        return;
      }

      if (!FileSystem.cacheDirectory) throw new Error('当前设备无法创建临时文件');
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
    } catch (error: unknown) {
      Alert.alert('导出失败', error instanceof Error ? error.message : '未知错误');
    } finally {
      setBusy(false);
    }
  };

  const importData = async () => {
    const t = importJson.trim();
    if (!t) {
      Alert.alert('提示', '请粘贴导出的 JSON 数据');
      return;
    }
    try {
      const parsed = normalizeAppState(JSON.parse(t));
      if (!parsed) {
        Alert.alert('错误', '数据格式不正确，请检查');
        return;
      }
      confirmAction({
        title: '确认导入',
        message: '导入将会覆盖当前所有数据，确定继续？',
        confirmText: '确定导入',
        destructive: true,
        onConfirm: () => {
          dispatch({ type: 'HYDRATE', state: parsed });
          setImportJson('');
          Alert.alert('导入成功', '数据已恢复');
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '未知错误';
      Alert.alert('导入失败', `JSON 解析错误: ${message}`);
    }
  };

  const resetAll = () => {
    confirmAction({
      title: '⚠️ 清除所有数据',
      message: '此操作不可撤销，所有数据将被永久删除。确定继续？',
      confirmText: '确定清除',
      destructive: true,
      onConfirm: () => {
        dispatch({ type: 'HYDRATE', state: createInitialState() });
        Alert.alert('已清除', '所有数据已被删除');
      },
    });
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
              <ThemedView style={styles.backBtn}>
                <FontAwesome name="angle-left" size={18} color="#FF9500" />
              </ThemedView>
              <ThemedText type="small" style={styles.backLabel}>返回</ThemedText>
            </Pressable>
            <ThemedText type="subtitle">航行档案</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              安全保管你的每一段探索记录
            </ThemedText>
          </ThemedView>

          {/* 数据概览 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              ✦ 星图概览
            </ThemedText>
            <ThemedView style={styles.statsGrid}>
              <StatItem label="习惯" value={`${state.habits.length} 个`} />
              <StatItem label="感受" value={`${feelingDays} 天`} />
              <StatItem label="日志" value={`${(state.diary ?? []).length} 篇`} />
              <StatItem label="游戏" value={`${Object.values(state.gameRecords).filter(r => r.games > 0).length} 个`} />
            </ThemedView>
          </ThemedView>

          {/* 导出 */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
              📤 导出数据
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
              将所有数据（习惯、感受、航行日志、游戏记录）导出为 JSON 文件，可用于备份或迁移
            </ThemedText>
            <Pressable style={[styles.actionBtn, busy && styles.buttonDisabled]} onPress={exportData} disabled={busy}>
              {busy ? <LogoSpinner size={20} duration={800} /> : <FontAwesome name="download" size={16} color="#FFFFFF" />}
              <ThemedText style={styles.actionBtnText}>{busy ? '正在导出...' : '导出 JSON 文件'}</ThemedText>
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
                style={[styles.importInput, { color: theme.text }]}
                placeholder="在此粘贴 JSON 数据..."
                placeholderTextColor="#999"
                value={importJson}
                onChangeText={setImportJson}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ThemedView>
            <Pressable
              style={[styles.actionBtn, styles.importBtn, !importJson.trim() && styles.buttonDisabled]}
              onPress={importData}
              disabled={!importJson.trim()}
            >
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
              删除所有本地数据，包括习惯、感受、航行日志和游戏记录。
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
  buttonDisabled: { opacity: 0.45 },

  // Import input
  importInputWrapper: {
    borderRadius: Spacing.three, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
    borderWidth: 1, borderColor: '#FF950030',
  },
  importInput: { fontSize: 14, minHeight: 80, lineHeight: 20 },
});
