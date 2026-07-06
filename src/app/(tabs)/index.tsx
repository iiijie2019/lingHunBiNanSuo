import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRandomQuote } from '@/constants/quotes';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { today, useStore } from '@/stores/useStore';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export default function HomeScreen() {
  const { habits, moods } = useStore();
  const now = new Date();
  const todaysDate = today();
  const weekday = WEEKDAY_NAMES[now.getDay()];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;

  const dailyQuote = useMemo(() => getRandomQuote(), []);

  const completedToday = habits.filter((h) => h.completedDates.includes(todaysDate)).length;
  const totalHabits = habits.length;
  const todayMood = moods.find((m) => m.date === todaysDate);
  const recentMoods = moods.slice(0, 7);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 头部 */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerLeft}>
              <ThemedText style={styles.greeting}>👋 你好</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                周{weekday} · {dateStr}
              </ThemedText>
            </ThemedView>
            <Link href="/mood" asChild>
              <Pressable style={styles.moodButton}>
                {todayMood ? (
                  <ThemedText style={styles.headerMood}>{todayMood.mood}</ThemedText>
                ) : (
                  <ThemedView style={styles.addMoodBtn}>
                    <FontAwesome name="plus" size={14} color="#FFFFFF" />
                  </ThemedView>
                )}
              </Pressable>
            </Link>
          </ThemedView>

          {/* 每日金句 */}
          <ThemedView type="backgroundElement" style={styles.quoteCard}>
            <ThemedView style={styles.quoteBar} />
            <ThemedView style={styles.quoteBody}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.quoteText}>
                "{dailyQuote.text}"
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.quoteAuthor}>
                —— {dailyQuote.author}
              </ThemedText>
            </ThemedView>
          </ThemedView>

          {/* 统计卡片 */}
          <ThemedView style={styles.statsRow}>
            <Link href="/habits" asChild>
              <Pressable style={styles.statCardWrapper}>
                <ThemedView type="backgroundElement" style={styles.statCard}>
                  <ThemedView style={[styles.statIconBox, { backgroundColor: '#34C75918' }]}>
                    <FontAwesome name="check-circle" size={22} color="#34C759" />
                  </ThemedView>
                  <ThemedText style={styles.statValue}>
                    {totalHabits > 0 ? `${completedToday}/${totalHabits}` : '—'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">今日打卡</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>

            <Link href="/mood" asChild>
              <Pressable style={styles.statCardWrapper}>
                <ThemedView type="backgroundElement" style={styles.statCard}>
                  <ThemedView style={[styles.statIconBox, { backgroundColor: '#FF6B6B18' }]}>
                    <FontAwesome name="heart" size={22} color="#FF6B6B" />
                  </ThemedView>
                  <ThemedText style={styles.statValue}>
                    {todayMood ? todayMood.mood : '?'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">今日心情</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          </ThemedView>

          {/* 快捷入口 */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary">快捷入口</ThemedText>
          </ThemedView>

          <ThemedView style={styles.quickLinks}>
            <QuickLink href="/habits" icon="check-circle" color="#34C759" label="习惯打卡" />
            <QuickLink href="/mood" icon="smile-o" color="#FF6B6B" label="心情日记" />
            <QuickLink href="/diary" icon="book" color="#AF52DE" label="日记" />
            <QuickLink href="/utilities" icon="wrench" color="#FF9500" label="实用工具" />
            <QuickLink href="/profile" icon="user" color="#208AEF" label="个人中心" />
          </ThemedView>

          {/* 最近心情 */}
          {recentMoods.length > 0 && (
            <>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary">最近心情</ThemedText>
                <Link href="/mood" asChild>
                  <Pressable>
                    <ThemedText type="small" style={styles.viewAll}>查看全部</ThemedText>
                  </Pressable>
                </Link>
              </ThemedView>
              <ThemedView type="backgroundElement" style={styles.moodStrip}>
                {recentMoods.map((m) => (
                  <ThemedView key={m.id} style={styles.moodStripItem}>
                    <ThemedText style={styles.moodStripEmoji}>{m.mood}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {m.date.slice(5)}
                    </ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            </>
          )}

          <ThemedView style={{ height: BottomTabInset + Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// 快捷入口子组件
function QuickLink({ href, icon, color, label }: {
  href: string; icon: any; color: string; label: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable style={styles.quickLink}>
        <ThemedView type="backgroundElement" style={[styles.quickLinkIcon, { borderColor: color + '30' }]}>
          <FontAwesome name={icon} size={22} color={color} />
        </ThemedView>
        <ThemedText type="small">{label}</ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, maxWidth: MaxContentWidth },
  scroll: { gap: Spacing.four, paddingTop: Spacing.two },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.three,
  },
  headerLeft: { gap: Spacing.half },
  greeting: { fontSize: 30, fontWeight: '700', lineHeight: 38 },
  moodButton: { padding: Spacing.one },
  headerMood: { fontSize: 40, lineHeight: 48 },
  addMoodBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#208AEF', alignItems: 'center', justifyContent: 'center',
  },

  // Quote
  quoteCard: {
    flexDirection: 'row', borderRadius: Spacing.three, overflow: 'hidden',
  },
  quoteBar: { width: 4, backgroundColor: '#208AEF' },
  quoteBody: { flex: 1, padding: Spacing.four, gap: Spacing.one },
  quoteText: { lineHeight: 20 },
  quoteAuthor: { opacity: 0.5 },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCardWrapper: { flex: 1 },
  statCard: {
    paddingVertical: Spacing.four, paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.two,
  },
  statIconBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 24, fontWeight: '700', lineHeight: 30 },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.one,
  },
  viewAll: { color: '#208AEF' },

  // Quick links
  quickLinks: { flexDirection: 'row', gap: Spacing.two },
  quickLink: { flex: 1, alignItems: 'center', gap: Spacing.two },
  quickLinkIcon: {
    width: 50, height: 50, borderRadius: 15, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  // Mood strip
  moodStrip: {
    flexDirection: 'row', paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two, borderRadius: Spacing.three,
    justifyContent: 'space-around',
  },
  moodStripItem: { alignItems: 'center', gap: Spacing.half, padding:5, borderRadius: 5, },
  moodStripEmoji: { fontSize: 28, lineHeight: 36 },
});
