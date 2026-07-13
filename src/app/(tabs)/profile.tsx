import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACHIEVEMENTS, getUnlocked, CATEGORY_CONFIG } from '@/constants/achievements';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { today, useStore } from '@/stores/useStore';
import { shiftLocalDateKey } from '@/utils/local-date';

/** Calculate consecutive days from today backwards for habit completion */
function calcStreak(completedDates: Set<string>): number {
  let streak = 0;
  let key = today();
  if (!completedDates.has(key)) key = shiftLocalDateKey(key, -1);
  while (completedDates.has(key)) {
    streak++;
    key = shiftLocalDateKey(key, -1);
  }
  return streak;
}

const MENU_ITEMS = [
  { icon: 'book' as const, title: '日记', href: '/diary' as Href, color: BrandColors.cosmicViolet },
  { icon: 'database' as const, title: '数据管理', href: '/data' as Href, color: BrandColors.solar },
  { icon: 'cog' as const, title: '设置', href: null, color: BrandColors.cometBlue },
  { icon: 'question-circle' as const, title: '帮助与反馈', href: null, color: BrandColors.aurora },
  { icon: 'info-circle' as const, title: '关于', href: null, color: '#999' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const state = useStore();
  const { habits, diary } = state;

  const totalCompletedDates = useMemo(() => {
    const dates = new Set<string>();
    habits.forEach((h) => h.completedDates.forEach((d) => dates.add(d)));
    return dates;
  }, [habits]);

  const streak = useMemo(() => calcStreak(totalCompletedDates), [totalCompletedDates]);

  const unlocked = useMemo(() => getUnlocked(state), [state]);
  const totalAchievements = ACHIEVEMENTS.length;

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 头像区域 */}
          <ThemedView style={styles.avatarSection}>
            <ThemedView style={[styles.avatarOrbit, { borderColor: `${theme.primary}30` }]}>
              <ThemedView type="backgroundElement" style={[styles.avatar, { borderColor: `${theme.primary}55` }]}>
                <FontAwesome name="rocket" size={32} color={theme.primary} />
              </ThemedView>
            </ThemedView>
            <ThemedText type="subtitle">时间旅人</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {unlocked.length > 0 ? `星图进度 ${unlocked.length}/${totalAchievements} · 继续探索` : '从今天出发，记录属于你的星图'}
            </ThemedText>
          </ThemedView>

          {/* 统计小卡片 */}
          <ThemedView style={styles.statsRow}>
            <ThemedView type="backgroundElement" style={[styles.statItem, { borderColor: `${BrandColors.aurora}30` }]}>
              <ThemedText type="title" style={[styles.statNum, { color: BrandColors.aurora }]}>{habits.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">习惯</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={[styles.statItem, { borderColor: `${BrandColors.novaRose}30` }]}>
              <ThemedText type="title" style={[styles.statNum, { color: BrandColors.novaRose }]}>{unlocked.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">勋章</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={[styles.statItem, { borderColor: `${BrandColors.cosmicViolet}30` }]}>
              <ThemedText type="title" style={[styles.statNum, { color: BrandColors.cosmicViolet }]}>{(diary ?? []).length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">日志</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={[styles.statItem, { borderColor: `${BrandColors.solar}30` }]}>
              <ThemedText type="title" style={[styles.statNum, { color: BrandColors.solar }]}>{streak}天</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">连续</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* 成就徽章 */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ✦ 探索勋章 ({unlocked.length}/{totalAchievements})
            </ThemedText>
          </ThemedView>

          {Object.keys(CATEGORY_CONFIG).map((cat) => {
            const catInfo = CATEGORY_CONFIG[cat as keyof typeof CATEGORY_CONFIG];
            const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat);
            if (catAchievements.length === 0) return null;
            return (
              <ThemedView key={cat} style={styles.achievementCategory}>
                <ThemedText type="smallBold" style={styles.catLabel}>
                  {catInfo.emoji} {catInfo.label}
                </ThemedText>
                <ThemedView style={styles.badgesRow}>
                  {catAchievements.map((a) => {
                    const isUnlocked = unlocked.some((u) => u.id === a.id);
                    return (
                      <ThemedView
                        key={a.id}
                        type={isUnlocked ? 'backgroundElement' : undefined}
                        style={[styles.badge, !isUnlocked && styles.badgeLocked]}
                      >
                        <ThemedText style={styles.badgeEmoji}>
                          {isUnlocked ? a.emoji : '🔒'}
                        </ThemedText>
                        <ThemedText
                          type="small"
                          themeColor={isUnlocked ? undefined : 'textSecondary'}
                          style={[styles.badgeTitle, !isUnlocked && styles.badgeTitleLocked]}
                          numberOfLines={1}
                        >
                          {a.title}
                        </ThemedText>
                      </ThemedView>
                    );
                  })}
                </ThemedView>
              </ThemedView>
            );
          })}

          {/* 菜单 */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">功能</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.menuSection}>
            {MENU_ITEMS.map(({ icon, title, href, color }) => {
              const inner = (
                <ThemedView key={title} style={[styles.menuItem, !href && styles.menuItemDisabled]}>
                  <ThemedView style={[styles.menuIconBox, { backgroundColor: color + '15' }]}>
                    <FontAwesome name={icon} size={18} color={color} />
                  </ThemedView>
                  <ThemedText type="default" style={styles.menuTitle}>{title}</ThemedText>
                  {href ? (
                    <FontAwesome name="angle-right" size={16} color="#999" />
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">开发中</ThemedText>
                  )}
                </ThemedView>
              );

              if (href) {
                return (
                  <Link key={title} href={href} asChild>
                    <Pressable>{inner}</Pressable>
                  </Link>
                );
              }
              return inner;
            })}
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
            v1.0.0
          </ThemedText>

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },

  // Avatar
  avatarSection: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.five },
  avatarOrbit: {
    width: 106, height: 106, borderRadius: 53, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.two,
    borderRadius: Spacing.three, borderWidth: StyleSheet.hairlineWidth,
  },
  statNum: { fontSize: 22, lineHeight: 28 },

  // Section
  sectionHeader: { paddingTop: Spacing.two },

  // Achievements
  achievementCategory: { gap: Spacing.two },
  catLabel: { paddingLeft: Spacing.one },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  badge: {
    width: '31%', paddingVertical: Spacing.two, paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two, alignItems: 'center', gap: 2,
  },
  badgeLocked: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#E0E0E030', borderStyle: 'dashed' },
  badgeEmoji: { fontSize: 28, lineHeight: 36 },
  badgeTitle: { fontSize: 11, textAlign: 'center' },
  badgeTitleLocked: { opacity: 0.4 },

  // Menu
  menuSection: { borderRadius: 20, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  menuIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  menuTitle: { flex: 1 },
  menuItemDisabled: { opacity: 0.55 },

  version: { paddingBottom: Spacing.four, textAlign: 'center', opacity: 0.5 },
});
