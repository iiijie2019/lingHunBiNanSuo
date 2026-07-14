import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntryVisibilityModal, type EntryVisibilityOption } from '@/components/entry-visibility-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore, type GameRecord, type GameRecords } from '@/stores/useStore';

type GameItem = {
  route: Href;
  gameKey: keyof GameRecords | null;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  title: string;
  desc: string;
  badge: string;
  bestLabel?: (record: GameRecord) => string;
};

const GAMES: GameItem[] = [
  {
    route: '/games/guess-number' as const,
    gameKey: 'guessNumber' as const,
    icon: 'question-circle' as const,
    color: BrandColors.cometBlue,
    title: '猜数字',
    desc: '1-100 之间猜一个随机数字',
    badge: '推理',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最佳 ${r.best} 次` : '',
  },
  {
    route: '/games/whack-a-mole' as const,
    gameKey: 'whackAMole' as const,
    icon: 'paw' as const,
    color: BrandColors.novaRose,
    title: '打地鼠',
    desc: '地鼠冒出时快速点击得分',
    badge: '手速',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 分` : '',
  },
  {
    route: '/games/reaction' as const,
    gameKey: 'reaction' as const,
    icon: 'bolt' as const,
    color: BrandColors.solar,
    title: '反应速度',
    desc: '屏幕变绿时立刻点击测试反应',
    badge: '敏捷',
    bestLabel: (r: GameRecord) => r.best < 9999 ? `最快 ${r.best}ms` : '',
  },
  {
    route: '/games/memory-card' as const,
    gameKey: 'memoryCard' as const,
    icon: 'clone' as const,
    color: BrandColors.aurora,
    title: '记忆翻牌',
    desc: '翻开两张牌，找到相同图案',
    badge: '记忆',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 分` : '',
  },
  {
    route: '/games/gomoku' as const,
    gameKey: null,
    icon: 'circle-thin' as const,
    color: BrandColors.solar,
    title: '五子棋',
    desc: '经典五子棋，对战简单 AI',
    badge: '棋类',
  },
  {
    route: '/games/color-word' as const,
    gameKey: 'colorWord' as const,
    icon: 'eye' as const,
    color: BrandColors.cosmicViolet,
    title: '颜色判断',
    desc: '字的颜色和意思，你能分清吗',
    badge: '专注',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
  },
  {
    route: '/games/math-challenge' as const,
    gameKey: 'mathChallenge' as const,
    icon: 'calculator' as const,
    color: BrandColors.novaRose,
    title: '数学速算',
    desc: '限时回答加减乘除得高分',
    badge: '脑力',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
  },
  {
    route: '/games/maze' as const,
    gameKey: null,
    icon: 'map' as const,
    color: BrandColors.aurora,
    title: '星路迷航',
    desc: '穿越随机星域，寻找跃迁出口',
    badge: '解谜',
  },
];

const GAME_VISIBILITY_OPTIONS: EntryVisibilityOption[] = GAMES.map((game) => ({
  id: String(game.route),
  title: game.title,
  description: game.desc,
  icon: game.icon,
  color: game.color,
}));

export default function GamesScreen() {
  const theme = useTheme();
  const { gameRecords, entryPreferences } = useStore();
  const dispatch = useDispatch();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const visibleGames = GAMES.filter((game) => !entryPreferences.hiddenGames.includes(String(game.route)));

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <ThemedView style={styles.headerCopy}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  娱乐星区 · 显示 {visibleGames.length}/{GAMES.length} 项挑战
                </ThemedText>
                <ThemedText type="subtitle">探索者训练舱</ThemedText>
              </ThemedView>
              <Pressable
                accessibilityLabel="设置挑战入口"
                accessibilityRole="button"
                onPress={() => setSettingsVisible(true)}
                style={({ pressed }) => [
                  styles.settingsButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="sliders" size={18} color={theme.primary} />
              </Pressable>
            </ThemedView>
            <ThemedText type="small" themeColor="textSecondary">
              锻炼反应、记忆与推理，刷新你的航行纪录
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.grid}>
            {visibleGames.map((game) => {
              const record = game.gameKey ? gameRecords[game.gameKey] : undefined;
              const bestText = record && game.bestLabel ? game.bestLabel(record) : '';

              return (
                <Link key={String(game.route)} href={game.route} asChild>
                  <Pressable style={({ pressed }) => [styles.gameCardWrapper, pressed && styles.pressed]}>
                    <ThemedView type="backgroundElement" style={[styles.gameCard, { borderColor: `${game.color}35` }]}>
                      <ThemedView style={styles.cardTop}>
                        <ThemedView style={[styles.iconBox, { backgroundColor: game.color + '15' }]}>
                          <FontAwesome name={game.icon} size={28} color={game.color} />
                        </ThemedView>
                        <ThemedView style={styles.cardTopRight}>
                          <ThemedView style={[styles.badge, { backgroundColor: game.color + '20' }]}>
                            <ThemedText type="small" style={[styles.badgeText, { color: game.color }]}>
                              {game.badge}
                            </ThemedText>
                          </ThemedView>
                          {bestText !== '' && (
                            <ThemedView style={styles.bestBadge}>
                              <ThemedText type="small" style={styles.bestBadgeText}>
                                🏆 {bestText}
                              </ThemedText>
                            </ThemedView>
                          )}
                        </ThemedView>
                      </ThemedView>
                      <ThemedText type="default" style={styles.gameTitle}>{game.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={styles.gameDesc}>
                        {game.desc}
                      </ThemedText>
                      <ThemedView style={styles.launchRow}>
                        <ThemedText type="smallBold" style={{ color: game.color }}>开始探索</ThemedText>
                        <FontAwesome name="angle-right" size={16} color={game.color} />
                      </ThemedView>
                    </ThemedView>
                  </Pressable>
                </Link>
              );
            })}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
      <EntryVisibilityModal
        description="选择训练舱中要显示的游戏，成绩记录不会受到影响"
        hiddenIds={entryPreferences.hiddenGames}
        onClose={() => setSettingsVisible(false)}
        onSave={(entries) => dispatch({ type: 'SET_HIDDEN_ENTRIES', category: 'hiddenGames', entries })}
        options={GAME_VISIBILITY_OPTIONS}
        title="管理挑战入口"
        visible={settingsVisible}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { paddingTop: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.half },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headerCopy: { flex: 1, gap: Spacing.half },
  settingsButton: {
    width: 42, height: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },

  grid: { gap: Spacing.three },
  gameCardWrapper: { flex: 1 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  gameCard: {
    padding: Spacing.three, borderRadius: 22, gap: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTopRight: { alignItems: 'flex-end', gap: Spacing.one },
  badge: {
    paddingHorizontal: Spacing.two, paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  bestBadge: {
    paddingHorizontal: Spacing.two, paddingVertical: 2,
    borderRadius: 10, backgroundColor: '#FF950015',
  },
  bestBadgeText: { fontSize: 12, color: '#FF9500' },
  gameTitle: { fontWeight: '700', marginTop: Spacing.one, fontSize: 18 },
  gameDesc: { lineHeight: 18 },
  launchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
});
