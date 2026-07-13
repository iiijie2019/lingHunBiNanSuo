import { FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type EntryVisibilityOption = {
  id: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof FontAwesome>['name'];
  color: string;
};

type EntryVisibilityModalProps = {
  visible: boolean;
  title: string;
  description: string;
  options: EntryVisibilityOption[];
  hiddenIds: string[];
  onClose: () => void;
  onSave: (hiddenIds: string[]) => void;
};

export function EntryVisibilityModal({
  visible,
  title,
  description,
  options,
  hiddenIds,
  onClose,
  onSave,
}: EntryVisibilityModalProps) {
  const theme = useTheme();
  const validIds = useMemo(() => new Set(options.map((option) => option.id)), [options]);
  const [draftHidden, setDraftHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setDraftHidden(new Set(hiddenIds.filter((id) => validIds.has(id))));
    }
  }, [hiddenIds, validIds, visible]);

  const visibleCount = options.length - draftHidden.size;

  const toggle = (id: string) => {
    setDraftHidden((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else if (options.length - next.size > 1) {
        next.add(id);
      }
      return next;
    });
  };

  const save = () => {
    onSave([...draftHidden]);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="关闭入口设置" onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <ThemedView
            type="backgroundElement"
            style={[styles.sheet, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.titleCopy}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>入口设置</ThemedText>
                <ThemedText type="subtitle" style={styles.title}>{title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">{description}</ThemedText>
              </View>
              <Pressable
                accessibilityLabel="关闭"
                accessibilityRole="button"
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="close" size={17} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.summaryRow}>
              <ThemedText type="smallBold">当前显示 {visibleCount}/{options.length}</ThemedText>
              <Pressable onPress={() => setDraftHidden(new Set())} disabled={draftHidden.size === 0}>
                <ThemedText
                  type="smallBold"
                  style={{ color: theme.primary, opacity: draftHidden.size === 0 ? 0.35 : 1 }}
                >
                  全部显示
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              style={styles.listScroll}
            >
              {options.map((option) => {
                const selected = !draftHidden.has(option.id);
                const isLastVisible = selected && visibleCount === 1;

                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected, disabled: isLastVisible }}
                    key={option.id}
                    onPress={() => toggle(option.id)}
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: selected ? `${option.color}55` : theme.backgroundSelected },
                      selected && { backgroundColor: `${option.color}0D` },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: `${option.color}18` }]}>
                      <FontAwesome name={option.icon} size={19} color={option.color} />
                    </View>
                    <View style={styles.optionCopy}>
                      <ThemedText type="default" style={styles.optionTitle}>{option.title}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {option.description}
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.checkbox,
                        { borderColor: selected ? option.color : theme.textSecondary },
                        selected && { backgroundColor: option.color },
                      ]}
                    >
                      {selected ? <FontAwesome name="check" size={12} color={BrandColors.deepSpace} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
              至少保留一个入口，隐藏不会删除任何记录
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={save}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: theme.primary },
                pressed && styles.savePressed,
              ]}
            >
              <FontAwesome name="check" size={15} color={theme.background} />
              <ThemedText style={[styles.saveText, { color: theme.background }]}>保存显示设置</ThemedText>
            </Pressable>
          </ThemedView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 10, 22, 0.72)',
    padding: Spacing.three,
  },
  safeArea: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    alignSelf: 'center',
  },
  sheet: {
    flexShrink: 1,
    padding: Spacing.four,
    borderRadius: 26,
    borderWidth: 1,
    shadowColor: BrandColors.deepSpace,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  titleCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  list: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  listScroll: {
    flexShrink: 1,
  },
  option: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: 10,
    borderRadius: 17,
    borderWidth: 1,
  },
  optionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  optionTitle: {
    fontWeight: '700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    paddingTop: Spacing.two,
    textAlign: 'center',
    fontSize: 12,
  },
  saveButton: {
    minHeight: 50,
    marginTop: Spacing.three,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  saveText: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  savePressed: {
    opacity: 0.84,
    transform: [{ scale: 0.99 }],
  },
});
