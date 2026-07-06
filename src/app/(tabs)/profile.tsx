import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const MENU_ITEMS = [
  { icon: 'cog' as const, title: '设置' },
  { icon: 'question-circle' as const, title: '帮助与反馈' },
  { icon: 'info-circle' as const, title: '关于' },
];

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* 头像区域 */}
        <ThemedView style={styles.avatarSection}>
          <ThemedView type="backgroundElement" style={styles.avatar}>
            <FontAwesome name="user" size={36} color="#208AEF" />
          </ThemedView>
          <ThemedText type="subtitle">未登录用户</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            点击登录，体验更多功能
          </ThemedText>
        </ThemedView>

        {/* 统计小卡片 */}
        <ThemedView style={styles.statsRow}>
          <ThemedView type="backgroundElement" style={styles.statItem}>
            <ThemedText type="title" style={styles.statNum}>0</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">习惯</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statItem}>
            <ThemedText type="title" style={styles.statNum}>0</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">心情</ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.statItem}>
            <ThemedText type="title" style={styles.statNum}>0天</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">连续</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 菜单 */}
        <ThemedView type="backgroundElement" style={styles.menuSection}>
          {MENU_ITEMS.map(({ icon, title }) => (
            <Pressable key={title} style={styles.menuItem}>
              <FontAwesome name={icon} size={20} color="#208AEF" />
              <ThemedText type="default" style={styles.menuTitle}>{title}</ThemedText>
              <FontAwesome name="angle-right" size={16} color="#999" />
            </Pressable>
          ))}
        </ThemedView>

        <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
          v1.0.0
        </ThemedText>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  avatarSection: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },
  statsRow: { flexDirection: 'row', gap: Spacing.two, paddingTop: Spacing.four },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  statNum: { fontSize: 28, lineHeight: 34, color: '#208AEF' },
  menuSection: { borderRadius: Spacing.three, marginTop: Spacing.four },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  menuTitle: { flex: 1 },
  version: { marginTop: 'auto', paddingBottom: Spacing.four, textAlign: 'center' },
});
