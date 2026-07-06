import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useStore, type GameRecord } from '@/stores/useStore';

const GAMES = [
  {
    route: '/games/guess-number' as const,
    gameKey: 'guessNumber' as const,
    icon: 'question-circle' as const,
    color: '#208AEF',
    title: '猜数字',
    desc: '1-100 之间猜一个随机数字，看几次能猜中',
    badge: '推理',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最佳 ${r.best} 次` : '',
  },
  {
    route: '/games/whack-a-mole' as const,
    gameKey: 'whackAMole' as const,
    icon: 'paw' as const,
    color: '#FF6B6B',
    title: '打地鼠',
    desc: '地鼠冒出来时快速点击，combo 越多分越高',
    badge: '手速',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 分` : '',
  },
  {
    route: '/games/reaction' as const,
    gameKey: 'reaction' as const,
    icon: 'bolt' as const,
    color: '#FF9500',
    title: '反应速度',
    desc: '屏幕变绿时立刻点击，测试你的反应时间',
    badge: '敏捷',
    bestLabel: (r: GameRecord) => r.best < 9999 ? `最快 ${r.best}ms` : '',
  },
  {
    route: '/games/color-word' as const,
    gameKey: 'colorWord' as const,
    icon: 'eye' as const,
    color: '#AF52DE',
    title: '颜色判断',
    desc: '说出字的颜色而非字的意思，经典 Stroop 测试',
    badge: '专注',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
  },
  {
    route: '/games/math-challenge' as const,
    gameKey: 'mathChallenge' as const,
    icon: 'calculator' as const,
    color: '#FF6B6B',
    title: '数学速算',
    desc: '限时回答加减乘除，看看能得多少分',
    badge: '脑力',
    bestLabel: (r: GameRecord) => r.games > 0 ? `最高 ${r.best} 题` : '',
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
              const record = gameRecords[game.gameKey];
              const bestText = game.bestLabel(record);

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
