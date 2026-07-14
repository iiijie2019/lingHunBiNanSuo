import { FontAwesome } from '@expo/vector-icons';
import { Link, router, type Href } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntryVisibilityModal, type EntryVisibilityOption } from '@/components/entry-visibility-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDispatch, useStore } from '@/stores/useStore';

const TOOLS = [
  { route: '/utilities/random-number' as const, icon: 'random' as const, color: BrandColors.cometBlue, title: '随机数', desc: '在指定范围内生成随机整数' },
  { route: '/utilities/dice-roll' as const, icon: 'cube' as const, color: BrandColors.cosmicViolet, title: '掷骰子', desc: '1-4 颗骰子，显示结果与合计' },
  { route: '/utilities/coin-flip' as const, icon: 'dot-circle-o' as const, color: BrandColors.solar, title: '抛硬币', desc: '二选一决定，含正反统计' },
  { route: '/utilities/decision-wheel' as const, icon: 'circle-o-notch' as const, color: BrandColors.novaRose, title: '决策转盘', desc: '输入选项，让命运帮你决定' },
  { route: '/utilities/random-color' as const, icon: 'paint-brush' as const, color: BrandColors.aurora, title: '随机颜色', desc: '生成 HEX 颜色与 RGB 值' },
  { route: '/utilities/unit-convert' as const, icon: 'exchange' as const, color: BrandColors.cometBlue, title: '单位换算', desc: '长度、重量、温度等常用单位换算' },
  { route: '/utilities/exchange-rate' as const, icon: 'money' as const, color: BrandColors.aurora, title: '汇率换算', desc: '获取最新参考汇率并进行货币换算' },
  { route: '/utilities/qr-generator' as const, icon: 'qrcode' as const, color: BrandColors.silver, title: '二维码', desc: '输入文字或链接生成二维码' },
];

const TOOL_VISIBILITY_OPTIONS: EntryVisibilityOption[] = TOOLS.map((tool) => ({
  id: tool.route,
  title: tool.title,
  description: tool.desc,
  icon: tool.icon,
  color: tool.color,
}));

export default function UtilitiesScreen() {
  const theme = useTheme();
  const { entryPreferences } = useStore();
  const dispatch = useDispatch();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const visibleTools = TOOLS.filter((tool) => !entryPreferences.hiddenTools.includes(tool.route));
  const toolRows = Array.from(
    { length: Math.ceil(visibleTools.length / 4) },
    (_, rowIndex) => visibleTools.slice(rowIndex * 4, rowIndex * 4 + 4),
  );

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <Pressable
                accessibilityLabel="返回首页"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
                style={({ pressed }) => [
                  styles.roundButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="angle-left" size={22} color={theme.primary} />
              </Pressable>
              <ThemedView style={styles.headerCopy}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  航行装备 · {visibleTools.length}/{TOOLS.length}
                </ThemedText>
                <ThemedText type="subtitle">探索工具箱</ThemedText>
              </ThemedView>
              <Pressable
                accessibilityLabel="设置装备入口"
                accessibilityRole="button"
                onPress={() => setSettingsVisible(true)}
                style={({ pressed }) => [
                  styles.roundButton,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="sliders" size={18} color={theme.primary} />
              </Pressable>
            </ThemedView>
          </ThemedView>

          <ThemedView style={styles.toolGrid}>
            {toolRows.map((row, rowIndex) => (
              <ThemedView key={row[0]?.route ?? rowIndex} style={styles.toolRow}>
                {row.map((tool) => (
                  <ThemedView key={tool.route} style={styles.toolSlot}>
                    <Link href={tool.route as Href} asChild>
                      <Pressable
                        accessibilityLabel={`打开${tool.title}`}
                        style={({ pressed }) => [styles.toolItem, pressed && styles.pressed]}
                      >
                        <ThemedView
                          type="backgroundElement"
                          style={[styles.toolCard, { borderColor: `${tool.color}32` }]}
                        >
                          <ThemedView style={[styles.iconBox, { backgroundColor: `${tool.color}18` }]}>
                            <FontAwesome name={tool.icon} size={21} color={tool.color} />
                          </ThemedView>
                          <ThemedText type="smallBold" numberOfLines={2} style={styles.toolTitle}>
                            {tool.title}
                          </ThemedText>
                        </ThemedView>
                      </Pressable>
                    </Link>
                  </ThemedView>
                ))}
                {Array.from({ length: 4 - row.length }, (_, emptyIndex) => (
                  <ThemedView
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                    key={`empty-${emptyIndex}`}
                    style={styles.toolSlot}
                  />
                ))}
              </ThemedView>
            ))}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
      <EntryVisibilityModal
        description="选择装备列表中要显示的工具，隐藏后仍可随时恢复"
        hiddenIds={entryPreferences.hiddenTools}
        onClose={() => setSettingsVisible(false)}
        onSave={(entries) => dispatch({ type: 'SET_HIDDEN_ENTRIES', category: 'hiddenTools', entries })}
        options={TOOL_VISIBILITY_OPTIONS}
        title="管理装备入口"
        visible={settingsVisible}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, width: '100%', maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.four, paddingTop: Spacing.three, paddingBottom: Spacing.five },
  header: { paddingBottom: Spacing.two },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  roundButton: {
    width: 42, height: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center',
  },
  toolGrid: {
    width: '100%', gap: Spacing.three,
  },
  toolRow: {
    width: '100%', flexDirection: 'row', gap: Spacing.two,
  },
  toolSlot: {
    flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0,
  },
  toolItem: { width: '100%' },
  toolCard: {
    width: '100%', height: 104, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.one, paddingVertical: Spacing.two,
    borderRadius: 18, gap: Spacing.two, borderWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  toolTitle: { width: '100%', minHeight: 36, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
