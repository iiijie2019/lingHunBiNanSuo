import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const GAMES = [
  {
    route: '/games/guess-number' as const,
    icon: 'question-circle' as const,
    color: '#208AEF',
    title: '猜数字',
    desc: '1-100 之间猜一个随机数字，看几次能猜中',
    badge: '推理',
  },
  {
    route: '/games/whack-a-mole' as const,
    icon: 'paw' as const,
    color: '#FF6B6B',
    title: '打地鼠',
    desc: '地鼠冒出来时快速点击，combo 越多分越高',
    badge: '手速',
  },
  {
    route: '/games/reaction' as const,
    icon: 'bolt' as const,
    color: '#FF9500',
    title: '反应速度',
    desc: '屏幕变绿时立刻点击，测试你的反应时间',
    badge: '敏捷',
  },
  {
    route: '/games/color-word' as const,
    icon: 'eye' as const,
    color: '#AF52DE',
    title: '颜色判断',
    desc: '说出字的颜色而非字的意思，经典 Stroop 测试',
    badge: '专注',
  },
  {
    route: '/games/math-challenge' as const,
    icon: 'calculator' as const,
    color: '#FF6B6B',
    title: '数学速算',
    desc: '限时回答加减乘除，看看能得多少分',
    badge: '脑力',
  },
];

export default function GamesScreen() {
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
            {GAMES.map((game) => (
              <Link key={game.route} href={game.route as Href} asChild>
                <Pressable style={styles.gameCardWrapper}>
                  <ThemedView type="backgroundElement" style={styles.gameCard}>
                    <ThemedView style={styles.cardTop}>
                      <ThemedView style={[styles.iconBox, { backgroundColor: game.color + '15' }]}>
                        <FontAwesome name={game.icon} size={28} color={game.color} />
                      </ThemedView>
                      <ThemedView style={[styles.badge, { backgroundColor: game.color + '20' }]}>
                        <ThemedText type="small" style={[styles.badgeText, { color: game.color }]}>
                          {game.badge}
                        </ThemedText>
                      </ThemedView>
                    </ThemedView>
                    <ThemedText type="default" style={styles.gameTitle}>{game.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.gameDesc}>
                      {game.desc}
                    </ThemedText>
                  </ThemedView>
                </Pressable>
              </Link>
            ))}
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
  badge: {
    paddingHorizontal: Spacing.two, paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  gameTitle: { fontWeight: '600', marginTop: Spacing.one },
  gameDesc: { lineHeight: 18 },
});
