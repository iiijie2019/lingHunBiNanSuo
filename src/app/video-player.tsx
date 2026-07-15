import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { VideoPlayerWindow, useVideoPlayerOverlay } from '@/plugins/video-player';

const DEMO_VIDEO_SOURCE = 'https://static.rsjia.com/resources/tcm_static/suling-app/testVideo.mp4';

export default function VideoPlayerDemoScreen() {
  const theme = useTheme();
  const player = useVideoPlayerOverlay();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const startDemo = () => {
    player.open({
      source: DEMO_VIDEO_SOURCE,
      title: '视频播放器演示',
    });
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.header}>
            <Pressable accessibilityLabel="返回首页" onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <FontAwesome color={theme.text} name="angle-left" size={22} />
            </Pressable>
            <ThemedView style={styles.headerCopy}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>全局播放模块</ThemedText>
              <ThemedText style={styles.title}>视频播放器测试</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedView type="backgroundElement" style={[styles.heroCard, { borderColor: `${theme.primary}42` }]}>
            <ThemedView style={[styles.heroIcon, { backgroundColor: `${theme.primary}1C` }]}>
              <FontAwesome color={theme.primary} name="play-circle" size={34} />
            </ThemedView>
            <ThemedView style={styles.heroCopy}>
              <ThemedText type="subtitle">一次播放，跨页可见</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.heroDescription}>
                这是网络示例视频，不会加入 APK。开始后会先在当前页面播放；可切换全屏或转为可拖动的小窗。
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <VideoPlayerWindow />

          <Pressable
            accessibilityLabel="开始播放示例视频"
            accessibilityRole="button"
            onPress={startDemo}
            style={({ pressed }) => [styles.playDemoButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}
          >
            <FontAwesome color={theme.background} name="play" size={16} />
            <ThemedText type="smallBold" style={{ color: theme.background }}>
              {player.mode === 'window' ? '重新播放示例视频' : '播放示例视频'}
            </ThemedText>
          </Pressable>

          {player.active ? (
            <ThemedView type="backgroundElement" style={[styles.statusCard, { borderColor: theme.backgroundSelected }]}>
              <ThemedView style={[styles.statusIcon, { backgroundColor: `${BrandColors.aurora}1C` }]}>
                <FontAwesome color={BrandColors.aurora} name={player.isPlaying ? 'volume-up' : 'pause'} size={15} />
              </ThemedView>
              <ThemedView style={styles.statusCopy}>
                <ThemedText type="smallBold" numberOfLines={1}>{player.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {player.mode === 'window'
                    ? '正在当前页面播放'
                    : player.mode === 'mini'
                      ? '小窗正在全局显示'
                      : '播放器正在全屏显示'}
                </ThemedText>
              </ThemedView>
              {player.mode === 'mini' ? (
                <Pressable accessibilityLabel="全屏播放" onPress={player.expand}>
                  <ThemedText type="smallBold" style={{ color: theme.primary }}>全屏播放</ThemedText>
                </Pressable>
              ) : null}
            </ThemedView>
          ) : null}

          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="smallBold">已接入的能力</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">深空深色主题</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={[styles.featureList, { borderColor: theme.backgroundSelected }]}>
            <FeatureRow icon="sliders" title="播放进度" detail="可点击或拖动进度条定位" color={theme.primary} />
            <FeatureRow icon="undo" title="十秒快退 / 快进" detail="保留精确的播放位置" color={BrandColors.cosmicViolet} />
            <FeatureRow icon="arrows-alt" title="沉浸全屏" detail="在竖屏和横屏之间即时切换" color={BrandColors.aurora} />
            <FeatureRow icon="arrows" title="全局可拖动小窗" detail="仅保留暂停、关闭与全屏操作" color={BrandColors.solar} last />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function FeatureRow({
  icon,
  title,
  detail,
  color,
  last = false,
}: {
  icon: ComponentProps<typeof FontAwesome>['name'];
  title: string;
  detail: string;
  color: string;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <ThemedView style={[styles.featureRow, !last && { borderBottomColor: theme.backgroundSelected }]}>
      <ThemedView style={[styles.featureIcon, { backgroundColor: `${color}1A` }]}>
        <FontAwesome color={color} name={icon} size={16} />
      </ThemedView>
      <ThemedView style={styles.featureCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">{detail}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.four, paddingTop: Spacing.two, paddingBottom: Spacing.five },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 27, fontWeight: '700', lineHeight: 34 },
  heroCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  heroIcon: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { gap: Spacing.two },
  heroDescription: { lineHeight: 21 },
  playDemoButton: {
    minHeight: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  statusCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  statusIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusCopy: { flex: 1, minWidth: 0, gap: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Spacing.one },
  featureList: { borderRadius: 20, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  featureRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  featureIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureCopy: { flex: 1, minWidth: 0, gap: 2 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.97 }] },
});
