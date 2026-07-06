import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACHIEVEMENTS, getUnlocked, CATEGORY_CONFIG, type Achievement } from '@/constants/achievements';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/stores/useStore';

/** Calculate consecutive days from today backwards for habit completion */
function calcStreak(completedDates: Set<string>): number {
  let streak = 0;
  const d = new Date();
  while (true) {
    const key = d.toISOString().slice(0, 10);
    if (completedDates.has(key)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      const todayKey = new Date().toISOString().slice(0, 10);
      if (key === todayKey) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

const MENU_ITEMS = [
  { icon: 'book' as const, title: '日记', href: '/diary' as Href, color: '#AF52DE' },
  { icon: 'database' as const, title: '数据管理', href: '/data' as Href, color: '#FF9500' },
  { icon: 'cog' as const, title: '设置', href: null, color: '#208AEF' },
  { icon: 'question-circle' as const, title: '帮助与反馈', href: null, color: '#34C759' },
  { icon: 'info-circle' as const, title: '关于', href: null, color: '#999' },
];

export default function ProfileScreen() {
  const state = useStore();
  const { habits, moods, diary } = state;

  const totalCompletedDates = useMemo(() => {
    const dates = new Set<string>();
    habits.forEach((h) => h.completedDates.forEach((d) => dates.add(d)));
    return dates;
  }, [habits]);

  const streak = useMemo(() => calcStreak(totalCompletedDates), [totalCompletedDates]);

  const unlocked = useMemo(() => getUnlocked(state), [state]);
  const totalAchievements = ACHIEVEMENTS.length;

  // Group by category, take first 3 per category for compact display
  const grouped = useMemo(() => {
    const map: Record<string, Achievement[]> = {};
    unlocked.forEach((a) => {
      if (!map[a.category]) map[a.category] = [];
      map[a.category].push(a);
    });
    return map;
  }, [unlocked]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 头像区域 */}
          <ThemedView style={styles.avatarSection}>
            <ThemedView type="backgroundElement" style={styles.avatar}>
              <FontAwesome name="user" size={36} color="#208AEF" />
            </ThemedView>
            <ThemedText type="subtitle">灵魂旅人</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {unlocked.length > 0 ? `已解锁 ${unlocked.length}/${totalAchievements} 个成就` : '记录生活，解锁成就'}
            </ThemedText>
          </ThemedView>

          {/* 统计小卡片 */}
          <ThemedView style={styles.statsRow}>
            <ThemedView type="backgroundElement" style={styles.statItem}>
              <ThemedText type="title" style={styles.statNum}>{habits.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">习惯</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.statItem}>
              <ThemedText type="title" style={styles.statNum}>{moods.length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">心情</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.statItem}>
              <ThemedText type="title" style={styles.statNum}>{(diary ?? []).length}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">日记</ThemedText>
            </ThemedView>
            <ThemedView type="backgroundElement" style={styles.statItem}>
              <ThemedText type="title" style={styles.statNum}>{streak}天</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">连续</ThemedText>
            </ThemedView>
          </ThemedView>

          {/* 成就徽章 */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              🏆 成就徽章 ({unlocked.length}/{totalAchievements})
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
                <ThemedView style={styles.menuItem}>
                  <ThemedView style={[styles.menuIconBox, { backgroundColor: color + '15' }]}>
                    <FontAwesome name={icon} size={18} color={color} />
                  </ThemedView>
                  <ThemedText type="default" style={styles.menuTitle}>{title}</ThemedText>
                  <FontAwesome name="angle-right" size={16} color="#999" />
                </ThemedView>
              );

              if (href) {
                return (
                  <Link key={title} href={href} asChild>
                    <Pressable>{inner}</Pressable>
                  </Link>
                );
              }
              return <Pressable key={title}>{inner}</Pressable>;
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
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.two },
  statItem: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  statNum: { fontSize: 22, lineHeight: 28, color: '#208AEF' },

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
  menuSection: { borderRadius: Spacing.three },
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

  version: { paddingBottom: Spacing.four, textAlign: 'center', opacity: 0.5 },
});
