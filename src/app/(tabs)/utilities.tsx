import { FontAwesome } from '@expo/vector-icons';
import { Link, type Href } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TOOLS = [
  { route: '/utilities/random-number' as const, icon: 'random' as const, color: '#208AEF', title: '随机数生成器', desc: '在指定范围内生成随机整数' },
  { route: '/utilities/dice-roll' as const, icon: 'cube' as const, color: '#AF52DE', title: '掷骰子', desc: '1-4 颗骰子，显示结果与合计' },
  { route: '/utilities/coin-flip' as const, icon: 'dot-circle-o' as const, color: '#FF9500', title: '抛硬币', desc: '二选一决定，含正反统计' },
  { route: '/utilities/random-color' as const, icon: 'paint-brush' as const, color: '#34C759', title: '随机颜色', desc: '生成 HEX 颜色与 RGB 值' },
];

export default function UtilitiesScreen() {
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedText type="subtitle">实用工具</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              日常小工具集合
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.toolList}>
            {TOOLS.map((tool) => (
              <Link key={tool.route} href={tool.route as Href} asChild>
                <Pressable>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.toolCard, { borderColor: theme.backgroundSelected }]}
                  >
                    <ThemedView style={[styles.iconBox, { backgroundColor: tool.color + '15' }]}>
                      <FontAwesome name={tool.icon} size={22} color={tool.color} />
                    </ThemedView>
                    <ThemedView style={styles.toolInfo}>
                      <ThemedText type="default" style={styles.toolTitle}>{tool.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {tool.desc}
                      </ThemedText>
                    </ThemedView>
                    <FontAwesome name="angle-right" size={16} color="#C0C0C0" />
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

  toolList: { gap: Spacing.two },
  toolCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: Spacing.two,
    alignItems: 'center', justifyContent: 'center',
  },
  toolInfo: { flex: 1, gap: Spacing.half, padding:10, borderRadius:10 },
  toolTitle: { fontWeight: '600' },
});
