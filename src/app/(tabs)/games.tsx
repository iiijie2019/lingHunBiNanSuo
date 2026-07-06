import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useStore } from '@/stores/useStore';

interface GameRecord { best: number; games: number; extra1: number; extra2: number; lastPlayed: string | null; }

const GAMES = [
  {
    route: '/games/guess-number' as const,
    gameKey: 'guessNumber' as const,
    icon: 'question-circle' as const,
    color: '#208AEF',
    title: '猜数字',
    desc: '1-100 之间猜一个随机数字',
    badge: '推理',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最佳 ${r.best} 次` : '',
  },
  {
    route: '/games/whack-a-mole' as const,
    gameKey: 'whackAMole' as const,
    icon: 'paw' as const,
    color: '#FF6B6B',
    title: '打地鼠',
    desc: '地鼠冒出时快速点击得分',
    badge: '手速',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 分` : '',
  },
  {
    route: '/games/reaction' as const,
    gameKey: 'reaction' as const,
    icon: 'bolt' as const,
    color: '#FF9500',
    title: '反应速度',
    desc: '屏幕变绿时立刻点击测试反应',
    badge: '敏捷',
    bestLabel: (r: GameRecord) => r.best < 9999 ? `最快 ${r.best}ms` : '',
  },
  {
    route: '/games/memory-card' as const,
    gameKey: 'memoryCard' as const,
    icon: 'clone' as const,
    color: '#34C759',
    title: '记忆翻牌',
    desc: '翻开两张牌，找到相同图案',
    badge: '记忆',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 分` : '',
  },
  {
    route: '/games/gomoku' as const,
    gameKey: 'gomoku' as const,
    icon: 'circle-thin' as const,
    color: '#FF9500',
    title: '五子棋',
    desc: '经典五子棋，对战简单 AI',
    badge: '棋类',
    bestLabel: () => '',
  },
  {
    route: '/games/idiom-chain' as const,
    gameKey: 'idiomChain' as const,
    icon: 'font' as const,
    color: '#AF52DE',
    title: '成语接龙',
    desc: '尾字接龙，和AI一决高下',
    badge: '文字',
    bestLabel: () => '',
  },
  {
    route: '/games/color-word' as const,
    gameKey: 'colorWord' as const,
    icon: 'eye' as const,
    color: '#AF52DE',
    title: '颜色判断',
    desc: '字的颜色和意思，你能分清吗',
    badge: '专注',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
  },
  {
    route: '/games/math-challenge' as const,
    gameKey: 'mathChallenge' as const,
    icon: 'calculator' as const,
    color: '#FF6B6B',
    title: '数学速算',
    desc: '限时回答加减乘除得高分',
    badge: '脑力',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
  },
  {
    route: '/games/maze' as const,
    gameKey: 'maze' as const,
    icon: 'map' as const,
    color: '#34C759',
    title: '走迷宫',
    desc: '随机生成迷宫，找出口',
    badge: '解谜',
    bestLabel: () => '',
  },
];

export default function GamesScreen() {
  const { gameRecords } = useStore();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">小游戏</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              轻松有趣的小游戏合集
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.grid}>
            {GAMES.map((game) => {
              const record = (gameRecords as any)[game.gameKey] as GameRecord | undefined;
              const bestText = game.bestLabel(record ?? { best: 0, games: 0, extra1: 0, extra2: 0, lastPlayed: null });

              return (
                <Link key={game.route} href={game.route as Href} asChild>
                  <Pressable style={styles.gameCardWrapper}>
                    <ThemedView type="backgroundElement" style={styles.gameCard}>
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
                    </ThemedView>
                  </Pressable>
                </Link>
              );
            })}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { paddingVertical: Spacing.three, gap: Spacing.half },

  grid: { gap: Spacing.three },
  gameCardWrapper: { flex: 1 },
  gameCard: { padding: 10, borderRadius: 10, gap: Spacing.two },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',padding: 10,borderRadius: 10,
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
  gameTitle: { fontWeight: '600', marginTop: Spacing.one },
  gameDesc: { lineHeight: 18 },
});
