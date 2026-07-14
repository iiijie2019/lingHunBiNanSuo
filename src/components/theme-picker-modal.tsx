import { FontAwesome } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing, ThemePresets, type ThemeId } from '@/constants/theme';
import { useThemeSettings } from '@/contexts/theme-context';
import { useTheme } from '@/hooks/use-theme';

const THEME_IDS = Object.keys(ThemePresets) as ThemeId[];

type ThemePickerModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function ThemePickerModal({ visible, onClose }: ThemePickerModalProps) {
  const theme = useTheme();
  const { themeId, setThemeId } = useThemeSettings();

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="关闭主题选择" onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <ThemedView type="backgroundElement" style={styles.sheet}>
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>外观设置</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>选择主题</ThemedText>
              </View>
              <Pressable
                accessibilityLabel="关闭"
                accessibilityRole="button"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}
              >
                <FontAwesome name="close" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.options}>
              {THEME_IDS.map((id) => {
                const preset = ThemePresets[id];
                const selected = id === themeId;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    key={id}
                    onPress={() => setThemeId(id)}
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: selected ? theme.primary : theme.backgroundSelected },
                      selected && { backgroundColor: `${theme.primary}0D` },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.preview, { backgroundColor: preset.colors.background }]}>
                      <View style={[styles.previewCard, { backgroundColor: preset.colors.backgroundElement }]}>
                        <View style={[styles.previewAccent, { backgroundColor: preset.colors.primary }]} />
                        <View style={[styles.previewLine, { backgroundColor: preset.colors.textSecondary }]} />
                      </View>
                    </View>
                    <View style={styles.optionCopy}>
                      <ThemedText type="default" style={styles.optionTitle}>{preset.label}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{preset.description}</ThemedText>
                    </View>
                    <View
                      style={[
                        styles.radio,
                        { borderColor: selected ? theme.primary : theme.textSecondary },
                        selected && { backgroundColor: theme.primary },
                      ]}
                    >
                      {selected ? <FontAwesome name="check" size={11} color={theme.background} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ThemedView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, justifyContent: 'flex-end', padding: Spacing.three,
    backgroundColor: 'rgba(2, 10, 22, 0.72)',
  },
  safeArea: { width: '100%', maxWidth: 520, alignSelf: 'center' },
  sheet: {
    padding: Spacing.four, borderRadius: 26, borderWidth: 1,
    shadowColor: BrandColors.deepSpace, shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35, shadowRadius: 28, elevation: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  headerCopy: { flex: 1, gap: 3 },
  title: { fontSize: 26, lineHeight: 34 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  options: { gap: Spacing.two, paddingTop: Spacing.four },
  option: {
    minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    padding: 10, borderRadius: 18, borderWidth: 1,
  },
  preview: { width: 58, height: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  previewCard: { width: 38, height: 35, borderRadius: 9, padding: 7, gap: 6 },
  previewAccent: { width: 12, height: 12, borderRadius: 4 },
  previewLine: { width: 24, height: 3, borderRadius: 2, opacity: 0.7 },
  optionCopy: { flex: 1, minWidth: 0, gap: 1 },
  optionTitle: { fontWeight: '700' },
  radio: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
