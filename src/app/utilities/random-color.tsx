import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function RandomColorScreen() {
  const [color, setColor] = useState('#208AEF');
  const [history, setHistory] = useState<string[]>(['#208AEF']);

  const generate = () => {
    const hex = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    setColor(hex);
    setHistory((h) => [hex, ...h].slice(0, 12));
  };

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const isLight = (r * 299 + g * 587 + b * 114) / 1000 > 150;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <FontAwesome name="angle-left" size={20} color="#34C759" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">随机颜色</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            点击色块生成随机颜色
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          {/* 色块 */}
          <Pressable onPress={generate} style={styles.colorTouch}>
            <ThemedView style={[styles.colorBlock, { backgroundColor: color }]}>
              <ThemedText style={[
                styles.colorHex,
                { color: isLight ? '#000000' : '#FFFFFF' },
              ]}>
                {color}
              </ThemedText>
            </ThemedView>
          </Pressable>

          {/* 颜色信息 */}
          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <ThemedView style={styles.infoRow}>
              <ThemedText type="small" themeColor="textSecondary">HEX</ThemedText>
              <ThemedText type="code" style={styles.infoValue}>{color}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.divider} />
            <ThemedView style={styles.infoRow}>
              <ThemedText type="small" themeColor="textSecondary">RGB</ThemedText>
              <ThemedText type="code" style={styles.infoValue}>
                ({r}, {g}, {b})
              </ThemedText>
            </ThemedView>
          </ThemedView>

          <Pressable style={[styles.btn, { backgroundColor: '#34C759' }]} onPress={generate}>
            <FontAwesome name="paint-brush" size={18} color="#FFFFFF" />
            <ThemedText style={styles.btnText}>换一个颜色</ThemedText>
          </Pressable>

          {/* 历史 */}
          {history.length > 1 && (
            <>
              <ThemedText type="small" themeColor="textSecondary">最近生成</ThemedText>
              <ThemedView style={styles.historyRow}>
                {history.slice(1).map((c, i) => (
                  <Pressable key={i} onPress={() => setColor(c)}>
                    <ThemedView style={[styles.historyDot, { backgroundColor: c }]} />
                  </Pressable>
                ))}
              </ThemedView>
            </>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingVertical: Spacing.two, alignSelf: 'flex-start',
  },
  backLabel: { color: '#34C759' },
  header: { paddingBottom: Spacing.four, gap: Spacing.half },

  card: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.four },

  colorTouch: { borderRadius: Spacing.three, overflow: 'hidden' },
  colorBlock: {
    height: 170, borderRadius: Spacing.three,
    alignItems: 'center', justifyContent: 'center',
  },
  colorHex: { fontSize: 26, fontWeight: '800', fontFamily: 'monospace' },

  infoCard: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  infoValue: { fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#E0E0E0' },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  historyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  historyDot: {
    width: 30, height: 30, borderRadius: 8,
    borderWidth: 2, borderColor: '#FFFFFF',
  },
});
