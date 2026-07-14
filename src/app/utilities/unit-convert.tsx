import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';
type FontAwesomeName = React.ComponentProps<typeof FontAwesome>['name'];

type UnitInfo = {
  abbr: string;
  full: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
};

type CategoryInfo = {
  key: Category;
  label: string;
  icon: FontAwesomeName;
  fromIndex: number;
  toIndex: number;
};

const ACCENT = BrandColors.cometBlue;

const UNITS: Record<Category, UnitInfo[]> = {
  length: [
    { abbr: 'mm', full: '毫米', toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
    { abbr: 'cm', full: '厘米', toBase: (value) => value / 100, fromBase: (value) => value * 100 },
    { abbr: 'm', full: '米', toBase: (value) => value, fromBase: (value) => value },
    { abbr: 'km', full: '千米', toBase: (value) => value * 1000, fromBase: (value) => value / 1000 },
    { abbr: 'in', full: '英寸', toBase: (value) => value * 0.0254, fromBase: (value) => value / 0.0254 },
    { abbr: 'ft', full: '英尺', toBase: (value) => value * 0.3048, fromBase: (value) => value / 0.3048 },
    { abbr: 'mi', full: '英里', toBase: (value) => value * 1609.344, fromBase: (value) => value / 1609.344 },
  ],
  weight: [
    { abbr: 'mg', full: '毫克', toBase: (value) => value / 1e6, fromBase: (value) => value * 1e6 },
    { abbr: 'g', full: '克', toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
    { abbr: 'kg', full: '千克', toBase: (value) => value, fromBase: (value) => value },
    { abbr: 't', full: '吨', toBase: (value) => value * 1000, fromBase: (value) => value / 1000 },
    { abbr: 'lb', full: '磅', toBase: (value) => value * 0.45359237, fromBase: (value) => value / 0.45359237 },
    { abbr: 'oz', full: '盎司', toBase: (value) => value * 0.028349523125, fromBase: (value) => value / 0.028349523125 },
    { abbr: '斤', full: '市斤', toBase: (value) => value * 0.5, fromBase: (value) => value / 0.5 },
  ],
  temperature: [
    { abbr: '°C', full: '摄氏度', toBase: (value) => value, fromBase: (value) => value },
    { abbr: '°F', full: '华氏度', toBase: (value) => (value - 32) * 5 / 9, fromBase: (value) => value * 9 / 5 + 32 },
    { abbr: 'K', full: '开尔文', toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
  ],
  area: [
    { abbr: 'm²', full: '平方米', toBase: (value) => value, fromBase: (value) => value },
    { abbr: 'km²', full: '平方千米', toBase: (value) => value * 1e6, fromBase: (value) => value / 1e6 },
    { abbr: 'ha', full: '公顷', toBase: (value) => value * 10000, fromBase: (value) => value / 10000 },
    { abbr: '亩', full: '市亩', toBase: (value) => value * 2000 / 3, fromBase: (value) => value * 3 / 2000 },
  ],
  volume: [
    { abbr: 'mL', full: '毫升', toBase: (value) => value / 1000, fromBase: (value) => value * 1000 },
    { abbr: 'L', full: '升', toBase: (value) => value, fromBase: (value) => value },
    { abbr: 'gal', full: '美制加仑', toBase: (value) => value * 3.785411784, fromBase: (value) => value / 3.785411784 },
    { abbr: 'pt', full: '美制品脱', toBase: (value) => value * 0.473176473, fromBase: (value) => value / 0.473176473 },
  ],
  speed: [
    { abbr: 'm/s', full: '米/秒', toBase: (value) => value, fromBase: (value) => value },
    { abbr: 'km/h', full: '公里/时', toBase: (value) => value / 3.6, fromBase: (value) => value * 3.6 },
    { abbr: 'mph', full: '英里/时', toBase: (value) => value * 0.44704, fromBase: (value) => value / 0.44704 },
    { abbr: 'kn', full: '节', toBase: (value) => value * 0.5144444444, fromBase: (value) => value / 0.5144444444 },
  ],
};

const CATEGORIES: CategoryInfo[] = [
  { key: 'length', label: '长度', icon: 'arrows-h', fromIndex: 2, toIndex: 3 },
  { key: 'weight', label: '重量', icon: 'balance-scale', fromIndex: 2, toIndex: 1 },
  { key: 'temperature', label: '温度', icon: 'thermometer-half', fromIndex: 0, toIndex: 1 },
  { key: 'area', label: '面积', icon: 'object-group', fromIndex: 0, toIndex: 3 },
  { key: 'volume', label: '体积', icon: 'flask', fromIndex: 1, toIndex: 0 },
  { key: 'speed', label: '速度', icon: 'tachometer', fromIndex: 1, toIndex: 0 },
];

function formatResult(value: number) {
  if (!Number.isFinite(value)) return '—';
  if (Object.is(value, -0) || value === 0) return '0';

  const absolute = Math.abs(value);
  if (absolute >= 1e12 || absolute < 1e-7) {
    return value.toExponential(6).replace(/\.0+(?=e)/, '').replace(/(\.\d*?)0+(?=e)/, '$1');
  }

  return Number(value.toPrecision(10)).toLocaleString('zh-CN', {
    maximumSignificantDigits: 10,
    useGrouping: false,
  });
}

function formatEditable(value: number) {
  if (!Number.isFinite(value)) return '';
  return Number(value.toPrecision(10)).toString();
}

type UnitPickerProps = {
  label: string;
  units: UnitInfo[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function UnitPicker({ label, units, selectedIndex, onSelect }: UnitPickerProps) {
  const theme = useTheme();

  return (
    <View style={styles.unitPicker}>
      <ThemedText type="smallBold" themeColor="textSecondary">{label}</ThemedText>
      <ScrollView
        horizontal
        contentContainerStyle={styles.unitChipRow}
        showsHorizontalScrollIndicator={false}
      >
        {units.map((unit, index) => {
          const selected = index === selectedIndex;
          return (
            <Pressable
              accessibilityLabel={`${label}：${unit.full}`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={unit.abbr}
              onPress={() => onSelect(index)}
              style={({ pressed }) => [
                styles.unitChip,
                {
                  backgroundColor: selected ? ACCENT : theme.background,
                  borderColor: selected ? ACCENT : theme.backgroundSelected,
                },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText
                style={[styles.unitChipAbbr, selected && styles.unitChipTextSelected]}
              >
                {unit.abbr}
              </ThemedText>
              <ThemedText
                type="small"
                numberOfLines={1}
                style={[styles.unitChipFull, selected && styles.unitChipTextSelected]}
              >
                {unit.full}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function UnitConvertScreen() {
  const theme = useTheme();
  const [category, setCategory] = useState<Category>('length');
  const [fromIndex, setFromIndex] = useState(2);
  const [toIndex, setToIndex] = useState(3);
  const [value, setValue] = useState('1');

  const categoryInfo = CATEGORIES.find((item) => item.key === category) ?? CATEGORIES[0];
  const units = UNITS[category];
  const fromUnit = units[fromIndex];
  const toUnit = units[toIndex];
  const numericValue = Number(value.trim());
  const hasValue = value.trim().length > 0;
  const isValid = hasValue && Number.isFinite(numericValue);

  const rawResult = useMemo(() => {
    if (!isValid) return null;
    return toUnit.fromBase(fromUnit.toBase(numericValue));
  }, [fromUnit, isValid, numericValue, toUnit]);

  const allResults = useMemo(() => {
    if (!isValid) return [];
    const baseValue = fromUnit.toBase(numericValue);
    return units.map((unit, index) => ({
      ...unit,
      index,
      formattedValue: formatResult(unit.fromBase(baseValue)),
    }));
  }, [fromUnit, isValid, numericValue, units]);

  const selectCategory = (nextCategory: Category) => {
    const nextInfo = CATEGORIES.find((item) => item.key === nextCategory) ?? CATEGORIES[0];
    setCategory(nextCategory);
    setFromIndex(nextInfo.fromIndex);
    setToIndex(nextInfo.toIndex);
  };

  const swapUnits = () => {
    if (rawResult !== null) setValue(formatEditable(rawResult));
    setFromIndex(toIndex);
    setToIndex(fromIndex);
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            accessibilityLabel="返回上一页"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => router.dismiss()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement, borderColor: theme.backgroundSelected },
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="angle-left" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>返回</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${ACCENT}20` }]}>
              <FontAwesome name="exchange" size={20} color={ACCENT} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="subtitle" style={styles.headerTitle}>单位换算</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                输入一次，即时查看常用单位结果
              </ThemedText>
            </View>
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.categoryRow}
            showsHorizontalScrollIndicator={false}
          >
            {CATEGORIES.map((item) => {
              const selected = item.key === category;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={item.key}
                  onPress={() => selectCategory(item.key)}
                  style={({ pressed }) => [
                    styles.categoryTab,
                    {
                      backgroundColor: selected ? ACCENT : theme.backgroundElement,
                      borderColor: selected ? ACCENT : theme.backgroundSelected,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <FontAwesome
                    name={item.icon}
                    size={14}
                    color={selected ? BrandColors.deepSpace : theme.textSecondary}
                  />
                  <ThemedText
                    type="smallBold"
                    style={selected ? styles.categoryTextSelected : undefined}
                  >
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          <ThemedView
            type="backgroundElement"
            style={[styles.converterCard, { borderColor: `${ACCENT}42` }]}
          >
            <View style={styles.cardHeading}>
              <View>
                <ThemedText type="smallBold">{categoryInfo.label}换算</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {units.length} 个常用单位
                </ThemedText>
              </View>
              <View style={[styles.liveBadge, { backgroundColor: `${ACCENT}18` }]}>
                <View style={styles.liveDot} />
                <ThemedText type="smallBold" style={styles.liveText}>实时换算</ThemedText>
              </View>
            </View>

            <View
              style={[
                styles.inputPanel,
                { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
              ]}
            >
              <View style={styles.fieldLabelRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">原始数值</ThemedText>
                {value.length > 0 ? (
                  <Pressable
                    accessibilityLabel="清空输入"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => setValue('')}
                    style={({ pressed }) => [styles.clearInputButton, pressed && styles.pressed]}
                  >
                    <FontAwesome name="times-circle" size={15} color={theme.textSecondary} />
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.valueRow}>
                <TextInput
                  accessibilityLabel="要换算的数值"
                  inputMode="decimal"
                  keyboardType="decimal-pad"
                  onChangeText={setValue}
                  placeholder="0"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="done"
                  selectTextOnFocus
                  style={[styles.valueInput, { color: theme.text }]}
                  value={value}
                />
                <View style={[styles.sourceUnitBadge, { backgroundColor: `${ACCENT}18` }]}>
                  <ThemedText style={styles.sourceUnitAbbr}>{fromUnit.abbr}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.sourceUnitFull}>
                    {fromUnit.full}
                  </ThemedText>
                </View>
              </View>
              {hasValue && !isValid ? (
                <View style={styles.errorRow}>
                  <FontAwesome name="exclamation-circle" size={12} color={BrandColors.novaRose} />
                  <ThemedText type="small" style={styles.errorText}>请输入有效数字</ThemedText>
                </View>
              ) : null}
            </View>

            <UnitPicker
              label="从这个单位"
              onSelect={(index) => {
                setFromIndex(index);
                if (index === toIndex) setToIndex(index === units.length - 1 ? 0 : index + 1);
              }}
              selectedIndex={fromIndex}
              units={units}
            />

            <View style={styles.swapRow}>
              <View style={[styles.swapLine, { backgroundColor: theme.backgroundSelected }]} />
              <Pressable
                accessibilityLabel="交换来源和目标单位"
                accessibilityRole="button"
                onPress={swapUnits}
                style={({ pressed }) => [
                  styles.swapButton,
                  { backgroundColor: theme.backgroundElement, borderColor: `${ACCENT}70` },
                  pressed && styles.swapButtonPressed,
                ]}
              >
                <FontAwesome name="exchange" size={16} color={ACCENT} />
              </Pressable>
              <View style={[styles.swapLine, { backgroundColor: theme.backgroundSelected }]} />
            </View>

            <View style={[styles.outputPanel, { backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}30` }]}>
              <View style={styles.outputHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary">换算结果</ThemedText>
                <View style={[styles.targetBadge, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="smallBold" style={{ color: ACCENT }}>{toUnit.abbr}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.targetFull}>
                    {toUnit.full}
                  </ThemedText>
                </View>
              </View>
              <ThemedText
                accessibilityLiveRegion="polite"
                adjustsFontSizeToFit
                minimumFontScale={0.45}
                numberOfLines={1}
                style={[styles.outputValue, { color: isValid ? theme.text : theme.textSecondary }]}
              >
                {rawResult === null ? '—' : formatResult(rawResult)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {isValid ? `${formatResult(numericValue)} ${fromUnit.abbr} = ${formatResult(rawResult ?? 0)} ${toUnit.abbr}` : '输入数值后自动显示结果'}
              </ThemedText>
            </View>

            <UnitPicker
              label="换算为"
              onSelect={(index) => {
                setToIndex(index);
                if (index === fromIndex) setFromIndex(index === 0 ? units.length - 1 : 0);
              }}
              selectedIndex={toIndex}
              units={units}
            />
          </ThemedView>

          <ThemedView
            type="backgroundElement"
            style={[styles.resultsCard, { borderColor: theme.backgroundSelected }]}
          >
            <View style={styles.resultsHeading}>
              <View>
                <ThemedText type="smallBold">全部结果</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">点击任一结果设为目标单位</ThemedText>
              </View>
              <View style={[styles.resultCount, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" themeColor="textSecondary">{allResults.length || units.length}</ThemedText>
              </View>
            </View>

            {allResults.length > 0 ? (
              <View style={styles.resultsList}>
                {allResults.map((result) => {
                  const selected = result.index === toIndex;
                  return (
                    <Pressable
                      accessibilityLabel={`${result.full}：${result.formattedValue} ${result.abbr}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={result.abbr}
                      onPress={() => setToIndex(result.index)}
                      style={({ pressed }) => [
                        styles.resultRow,
                        {
                          backgroundColor: selected ? `${ACCENT}12` : theme.background,
                          borderColor: selected ? `${ACCENT}55` : theme.backgroundSelected,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={[styles.resultIcon, { backgroundColor: selected ? ACCENT : theme.backgroundElement }]}>
                        <ThemedText
                          style={[styles.resultAbbr, selected && styles.resultAbbrSelected]}
                          numberOfLines={1}
                        >
                          {result.abbr}
                        </ThemedText>
                      </View>
                      <View style={styles.resultCopy}>
                        <ThemedText
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                          numberOfLines={1}
                          style={[styles.resultValue, selected && { color: ACCENT }]}
                        >
                          {result.formattedValue}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">{result.full}</ThemedText>
                      </View>
                      <FontAwesome name="angle-right" size={15} color={selected ? ACCENT : theme.textSecondary} />
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyResults}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.background }]}>
                  <FontAwesome name="calculator" size={18} color={theme.textSecondary} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">输入数值后，这里会列出全部换算结果</ThemedText>
              </View>
            )}
          </ThemedView>

          <View style={styles.noteRow}>
            <FontAwesome name="info-circle" size={13} color={BrandColors.meteor} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteText}>
              美制容量单位与英制单位不同，结果最多显示 10 位有效数字
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  backButton: {
    minHeight: 38, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.three, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  headerIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: Spacing.half },
  headerTitle: { fontSize: 30, lineHeight: 38 },
  categoryRow: { gap: Spacing.two, paddingVertical: Spacing.one },
  categoryTab: {
    minHeight: 40, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.three,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 7,
  },
  categoryTextSelected: { color: BrandColors.deepSpace },
  converterCard: {
    borderRadius: 26, padding: Spacing.three, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: {
    minHeight: 28, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10,
    borderRadius: 14, gap: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ACCENT },
  liveText: { color: '#1683C4', fontSize: 12 },
  inputPanel: { borderRadius: 19, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two },
  fieldLabelRow: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  clearInputButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  valueRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  valueInput: {
    flex: 1, minWidth: 0, padding: 0, fontSize: 40, lineHeight: 50, fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  sourceUnitBadge: {
    minWidth: 72, maxWidth: 105, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 14,
  },
  sourceUnitAbbr: { color: '#1683C4', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  sourceUnitFull: { fontSize: 11, lineHeight: 15 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  errorText: { color: BrandColors.novaRose, fontSize: 12 },
  unitPicker: { gap: Spacing.two },
  unitChipRow: { gap: Spacing.two, paddingRight: Spacing.three },
  unitChip: {
    minWidth: 70, minHeight: 54, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.three, paddingVertical: 7, borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unitChipAbbr: { fontSize: 15, lineHeight: 20, fontWeight: '800' },
  unitChipFull: { maxWidth: 86, fontSize: 11, lineHeight: 15 },
  unitChipTextSelected: { color: BrandColors.deepSpace },
  swapRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  swapLine: { flex: 1, height: StyleSheet.hairlineWidth },
  swapButton: {
    width: 42, height: 42, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '90deg' }],
  },
  swapButtonPressed: { opacity: 0.72, transform: [{ rotate: '90deg' }, { scale: 0.94 }] },
  outputPanel: { borderRadius: 20, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  outputHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  targetBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 12, gap: 6,
  },
  targetFull: { fontSize: 11, lineHeight: 15 },
  outputValue: {
    width: '100%', fontSize: 48, lineHeight: 58, fontWeight: '800',
    fontVariant: ['tabular-nums'], letterSpacing: -1,
  },
  resultsCard: {
    borderRadius: 24, padding: Spacing.three, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: {
    minWidth: 30, height: 30, paddingHorizontal: Spacing.two, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  resultsList: { gap: Spacing.two },
  resultRow: {
    minHeight: 68, flexDirection: 'row', alignItems: 'center', padding: Spacing.two,
    paddingRight: Spacing.three, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, gap: Spacing.three,
  },
  resultIcon: {
    width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  resultAbbr: { maxWidth: 48, fontSize: 13, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  resultAbbrSelected: { color: BrandColors.deepSpace },
  resultCopy: { flex: 1, minWidth: 0 },
  resultValue: { fontSize: 21, lineHeight: 27, fontWeight: '700', fontVariant: ['tabular-nums'] },
  emptyResults: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  noteRow: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center',
    paddingHorizontal: Spacing.three, gap: Spacing.two,
  },
  noteText: { flexShrink: 1, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
