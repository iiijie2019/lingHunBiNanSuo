import { FontAwesome } from '@expo/vector-icons';
import { Link, router, type Href } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getRandomQuote } from '@/constants/quotes';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { today, useStore } from '@/stores/useStore';

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

export default function HomeScreen() {
  const theme = useTheme();
  const { habits, moods, diary } = useStore();
  const now = new Date();
  const todaysDate = today();
  const weekday = WEEKDAY_NAMES[now.getDay()];
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日`;

  const dailyQuote = useMemo(() => getRandomQuote(), []);

  const completedToday = habits.filter((h) => h.completedDates.includes(todaysDate)).length;
  const totalHabits = habits.length;
  const todayMood = moods.find((m) => m.date === todaysDate);
  const todayLogs = diary.filter((entry) => entry.date === todaysDate);
  const latestTodayLog = todayLogs[0];
  const recentLogs = diary.slice(0, 3);
  const todayJourneyEmoji = latestTodayLog?.moodEmoji ?? todayMood?.mood;

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* 头部 */}
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerLeft}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>流银纪 · 今日航程</ThemedText>
              <ThemedText style={styles.greeting}>你好，时间旅人</ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                周{weekday} · {dateStr}
              </ThemedText>
            </ThemedView>
            <Link href="/diary" asChild>
              <Pressable style={styles.logButton}>
                {todayJourneyEmoji ? (
                  <ThemedText style={styles.headerMood}>{todayJourneyEmoji}</ThemedText>
                ) : (
                  <ThemedView style={[styles.addLogBtn, { backgroundColor: `${BrandColors.cosmicViolet}1C` }]}>
                    <FontAwesome name="book" size={16} color={BrandColors.cosmicViolet} />
                  </ThemedView>
                )}
              </Pressable>
            </Link>
          </ThemedView>

          {/* 每日金句 */}
          <ThemedView type="backgroundElement" style={[styles.quoteCard, { borderColor: theme.backgroundSelected }]}>
            <ThemedView style={[styles.quoteMark, { backgroundColor: `${theme.primary}18` }]}>
              <FontAwesome name="star" size={14} color={theme.primary} />
            </ThemedView>
            <ThemedView style={styles.quoteBody}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.quoteText}>
                “{dailyQuote.text}”
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
                <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: `${BrandColors.aurora}35` }]}>
                  <ThemedView style={[styles.statIconBox, { backgroundColor: `${BrandColors.aurora}18` }]}>
                    <FontAwesome name="check-circle" size={22} color={BrandColors.aurora} />
                  </ThemedView>
                  <ThemedText style={styles.statValue}>
                    {totalHabits > 0 ? `${completedToday}/${totalHabits}` : '—'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">今日打卡</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>

            <Link href="/diary" asChild>
              <Pressable style={styles.statCardWrapper}>
                <ThemedView type="backgroundElement" style={[styles.statCard, { borderColor: `${BrandColors.cosmicViolet}35` }]}>
                  <ThemedView style={[styles.statIconBox, { backgroundColor: `${BrandColors.cosmicViolet}18` }]}>
                    <FontAwesome name="book" size={21} color={BrandColors.cosmicViolet} />
                  </ThemedView>
                  <ThemedText style={styles.statValue}>{todayLogs.length > 0 ? `${todayLogs.length}篇` : '—'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">航行日志</ThemedText>
                </ThemedView>
              </Pressable>
            </Link>
          </ThemedView>

          {/* 快捷入口 */}
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold">探索入口</ThemedText>
          </ThemedView>

          <ThemedView style={styles.quickLinks}>
            <QuickLink
              href="/games"
              icon="gamepad"
              color={BrandColors.novaRose}
              label="挑战"
            />
            <QuickLink
              href="/utilities"
              icon="wrench"
              color={BrandColors.solar}
              label="工具"
            />
            <QuickLink
              href="/data"
              icon="database"
              color={BrandColors.cosmicViolet}
              label="档案"
            />
            <QuickLink
              href="/profile"
              icon="rocket"
              color={BrandColors.cometBlue}
              label="旅程"
            />
          </ThemedView>

          {/* 最近日志 */}
          {recentLogs.length > 0 && (
            <>
              <ThemedView style={styles.sectionHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary">最近航行日志</ThemedText>
                <Link href="/diary" asChild>
                  <Pressable>
                    <ThemedText type="small" style={[styles.viewAll, { color: theme.primary }]}>查看全部</ThemedText>
                  </Pressable>
                </Link>
              </ThemedView>
              <Link href="/diary" asChild>
                <Pressable style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView type="backgroundElement" style={styles.logList}>
                    {recentLogs.map((entry, index) => (
                      <ThemedView
                        key={entry.id}
                        style={[styles.logItem, index < recentLogs.length - 1 && { borderBottomColor: theme.backgroundSelected }]}
                      >
                        <ThemedView style={[styles.logIcon, { backgroundColor: `${BrandColors.cosmicViolet}16` }]}>
                          <ThemedText style={styles.logEmoji}>{entry.moodEmoji ?? '✦'}</ThemedText>
                        </ThemedView>
                        <ThemedView style={styles.logCopy}>
                          <ThemedText type="smallBold" numberOfLines={1}>{entry.title}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">{entry.date.slice(5)}</ThemedText>
                        </ThemedView>
                        <FontAwesome name="angle-right" size={15} color={theme.textSecondary} />
                      </ThemedView>
                    ))}
                  </ThemedView>
                </Pressable>
              </Link>
            </>
          )}

          <ThemedView style={{ height: BottomTabInset + Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function QuickLink({ href, icon, color, label }: {
  href: Href;
  icon: ComponentProps<typeof FontAwesome>['name'];
  color: string;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={`打开${label}`}
      accessibilityRole="link"
      onPress={() => router.push(href)}
      style={({ pressed }) => [styles.quickLink, pressed && styles.pressed]}
    >
      <ThemedView
        type="backgroundElement"
        style={[styles.quickLinkCard, { borderColor: `${color}36` }]}
      >
        <ThemedView style={[styles.quickLinkIcon, { backgroundColor: `${color}16` }]}>
          <FontAwesome name={icon} size={18} color={color} />
        </ThemedView>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.quickLinkTitle}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
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
  greeting: { fontSize: 30, fontWeight: '700', lineHeight: 38, letterSpacing: 0.5 },
  logButton: { padding: Spacing.one },
  headerMood: { fontSize: 40, lineHeight: 48 },
  addLogBtn: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },

  // Quote
  quoteCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth, paddingLeft: Spacing.three,
  },
  quoteMark: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quoteBody: { flex: 1, padding: Spacing.four, gap: Spacing.one },
  quoteText: { lineHeight: 20 },
  quoteAuthor: { opacity: 0.5 },

  // Stats
  statsRow: { flexDirection: 'row', gap: Spacing.three },
  statCardWrapper: { flex: 1 },
  statCard: {
    paddingVertical: Spacing.four, paddingHorizontal: Spacing.three,
    borderRadius: 20, alignItems: 'center', gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
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
  viewAll: { fontWeight: '700' },

  // Quick links
  quickLinks: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
  },
  quickLink: {
    flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, aspectRatio: 1,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  quickLinkCard: {
    flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.one, padding: Spacing.one, borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quickLinkIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLinkTitle: { width: '100%', fontSize: 11, lineHeight: 14, textAlign: 'center' },

  // Recent logs
  logList: { borderRadius: 18, overflow: 'hidden' },
  logItem: {
    minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingHorizontal: Spacing.three, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent',
  },
  logIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  logEmoji: { fontSize: 20, lineHeight: 26 },
  logCopy: { flex: 1, minWidth: 0, gap: 1 },
});
