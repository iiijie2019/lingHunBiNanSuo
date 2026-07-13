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
import { useDispatch, useStore } from '@/stores/useStore';

const TOOLS = [
  { route: '/utilities/random-number' as const, icon: 'random' as const, color: BrandColors.cometBlue, title: '随机数生成器', desc: '在指定范围内生成随机整数' },
  { route: '/utilities/dice-roll' as const, icon: 'cube' as const, color: BrandColors.cosmicViolet, title: '掷骰子', desc: '1-4 颗骰子，显示结果与合计' },
  { route: '/utilities/coin-flip' as const, icon: 'dot-circle-o' as const, color: BrandColors.solar, title: '抛硬币', desc: '二选一决定，含正反统计' },
  { route: '/utilities/decision-wheel' as const, icon: 'circle-o-notch' as const, color: BrandColors.novaRose, title: '决策转盘', desc: '输入选项，让命运帮你决定' },
  { route: '/utilities/random-color' as const, icon: 'paint-brush' as const, color: BrandColors.aurora, title: '随机颜色', desc: '生成 HEX 颜色与 RGB 值' },
  { route: '/utilities/unit-convert' as const, icon: 'exchange' as const, color: BrandColors.cometBlue, title: '单位换算', desc: '长度、重量、温度等常用单位换算' },
  { route: '/utilities/exchange-rate' as const, icon: 'money' as const, color: BrandColors.aurora, title: '汇率换算', desc: '获取最新参考汇率并进行货币换算' },
  { route: '/utilities/qr-generator' as const, icon: 'qrcode' as const, color: BrandColors.silver, title: '二维码生成', desc: '输入文字或链接生成二维码' },
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

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <ThemedView style={styles.headerTop}>
              <ThemedView style={styles.headerCopy}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  航行装备 · 显示 {visibleTools.length}/{TOOLS.length} 项
                </ThemedText>
                <ThemedText type="subtitle">探索工具箱</ThemedText>
              </ThemedView>
              <Pressable
                accessibilityLabel="设置装备入口"
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
              为日常选择、计算与创作提供一点助推力
            </ThemedText>
          </ThemedView>

          <ThemedView style={styles.toolList}>
            {visibleTools.map((tool) => (
              <Link key={tool.route} href={tool.route as Href} asChild>
                <Pressable style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView
                    type="backgroundElement"
                    style={[styles.toolCard, { borderColor: `${tool.color}32` }]}
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
                    <ThemedView style={[styles.openButton, { backgroundColor: `${tool.color}16` }]}>
                      <FontAwesome name="angle-right" size={16} color={tool.color} />
                    </ThemedView>
                  </ThemedView>
                </Pressable>
              </Link>
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
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { paddingTop: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.half },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headerCopy: { flex: 1, gap: Spacing.half },
  settingsButton: {
    width: 42, height: 42, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },

  toolList: { gap: Spacing.two },
  toolCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 20,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 50, height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  toolInfo: { flex: 1, gap: Spacing.half },
  toolTitle: { fontWeight: '700' },
  openButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
