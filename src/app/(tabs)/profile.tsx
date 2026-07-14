import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemePickerModal } from '@/components/theme-picker-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, BottomTabInset, Spacing, ThemePresets } from '@/constants/theme';
import { useThemeSettings } from '@/contexts/theme-context';
import { useTheme } from '@/hooks/use-theme';

const MENU_ITEMS = [
  { icon: 'book' as const, title: '日记', href: '/diary' as Href, color: BrandColors.cosmicViolet },
  { icon: 'database' as const, title: '数据管理', href: '/data' as Href, color: BrandColors.cometBlue },
  { icon: 'question-circle' as const, title: '帮助与反馈', href: null, color: BrandColors.aurora },
  { icon: 'info-circle' as const, title: '关于', href: null, color: BrandColors.meteor },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const { themeId } = useThemeSettings();
  const [themePickerVisible, setThemePickerVisible] = useState(false);

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="smallBold" style={{ color: theme.primary }}>个人信息</ThemedText>
            <ThemedText type="subtitle">我的</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.profileCard}>
            <ThemedView style={[styles.avatarOrbit, { borderColor: `${theme.primary}30` }]}>
              <ThemedView style={[styles.avatar, { backgroundColor: `${theme.primary}14` }]}>
                <FontAwesome name="user" size={34} color={theme.primary} />
              </ThemedView>
            </ThemedView>
            <ThemedView style={styles.profileCopy}>
              <ThemedText type="subtitle" style={styles.profileName}>时间旅人</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                沿时间之流，记录每一次成长
              </ThemedText>
              <ThemedView style={[styles.identityBadge, { backgroundColor: `${BrandColors.cometBlue}16` }]}>
                <FontAwesome name="rocket" size={12} color={BrandColors.cometBlue} />
                <ThemedText type="smallBold" style={{ color: BrandColors.cometBlue }}>航行中</ThemedText>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">个人设置</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.menuSection}>
            <Pressable
              accessibilityLabel="切换主题"
              accessibilityRole="button"
              onPress={() => setThemePickerVisible(true)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <ThemedView style={styles.menuItem}>
                <ThemedView style={[styles.menuIconBox, { backgroundColor: `${BrandColors.cometBlue}15` }]}>
                  <FontAwesome name={themeId === 'dark' ? 'moon-o' : 'sun-o'} size={18} color={BrandColors.cometBlue} />
                </ThemedView>
                <ThemedText type="default" style={styles.menuTitle}>主题</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{ThemePresets[themeId].label}</ThemedText>
                <FontAwesome name="angle-right" size={16} color={theme.textSecondary} />
              </ThemedView>
            </Pressable>

            {MENU_ITEMS.map(({ icon, title, href, color }) => {
              const content = (
                <ThemedView style={[styles.menuItem, !href && styles.menuItemDisabled]}>
                  <ThemedView style={[styles.menuIconBox, { backgroundColor: `${color}15` }]}>
                    <FontAwesome name={icon} size={18} color={color} />
                  </ThemedView>
                  <ThemedText type="default" style={styles.menuTitle}>{title}</ThemedText>
                  {href ? (
                    <FontAwesome name="angle-right" size={16} color={theme.textSecondary} />
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">开发中</ThemedText>
                  )}
                </ThemedView>
              );

              return href ? (
                <Link key={title} href={href} asChild>
                  <Pressable style={({ pressed }) => pressed && styles.pressed}>{content}</Pressable>
                </Link>
              ) : (
                <ThemedView key={title}>{content}</ThemedView>
              );
            })}
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.version}>v1.0.0</ThemedText>
          <ThemedView style={{ height: BottomTabInset + Spacing.three }} />
        </ScrollView>
      </SafeAreaView>
      <ThemePickerModal visible={themePickerVisible} onClose={() => setThemePickerVisible(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingTop: Spacing.three },
  header: { gap: Spacing.half },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.four,
    padding: Spacing.four, borderRadius: 24,
  },
  avatarOrbit: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 70, height: 70, borderRadius: 35,
    alignItems: 'center', justifyContent: 'center',
  },
  profileCopy: { flex: 1, minWidth: 0, gap: Spacing.one },
  profileName: { fontSize: 26, lineHeight: 34 },
  identityBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.one, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
  },
  sectionHeader: { paddingTop: Spacing.two },
  menuSection: { borderRadius: 20, overflow: 'hidden' },
  menuItem: {
    minHeight: 64, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingVertical: 12, gap: Spacing.three,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { flex: 1 },
  menuItemDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
  version: { paddingTop: Spacing.three, textAlign: 'center', opacity: 0.5 },
});
