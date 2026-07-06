import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Category = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';

interface UnitInfo { abbr: string; full: string; toBase: (v: number) => number; fromBase: (v: number) => number }

const UNITS: Record<Category, UnitInfo[]> = {
  length: [
    { abbr: 'mm', full: '毫米',   toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { abbr: 'cm', full: '厘米',   toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { abbr: 'm',  full: '米',     toBase: (v) => v, fromBase: (v) => v },
    { abbr: 'km', full: '千米',   toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { abbr: 'in', full: '英寸',   toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { abbr: 'ft', full: '英尺',   toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    { abbr: 'mi', full: '英里',   toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
  ],
  weight: [
    { abbr: 'mg',  full: '毫克',   toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
    { abbr: 'g',   full: '克',     toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { abbr: 'kg',  full: '千克',   toBase: (v) => v, fromBase: (v) => v },
    { abbr: 't',   full: '吨',     toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { abbr: 'lb',  full: '磅',     toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { abbr: 'oz',  full: '盎司',   toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
    { abbr: '斤',   full: '市斤',   toBase: (v) => v * 0.5, fromBase: (v) => v / 0.5 },
  ],
  temperature: [
    { abbr: '°C', full: '摄氏度', toBase: (v) => v, fromBase: (v) => v },
    { abbr: '°F', full: '华氏度', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
    { abbr: 'K',  full: '开尔文', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
  area: [
    { abbr: 'm²',  full: '平方米',   toBase: (v) => v, fromBase: (v) => v },
    { abbr: 'km²', full: '平方千米', toBase: (v) => v * 1e6, fromBase: (v) => v / 1e6 },
    { abbr: 'ha',  full: '公顷',     toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    { abbr: '亩',   full: '市亩',     toBase: (v) => v * 666.67, fromBase: (v) => v / 666.67 },
  ],
  volume: [
    { abbr: 'mL',  full: '毫升', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { abbr: 'L',   full: '升',   toBase: (v) => v, fromBase: (v) => v },
    { abbr: 'gal', full: '加仑', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
    { abbr: 'pt',  full: '品脱', toBase: (v) => v * 0.473176, fromBase: (v) => v / 0.473176 },
  ],
  speed: [
    { abbr: 'm/s',  full: '米/秒',   toBase: (v) => v, fromBase: (v) => v },
    { abbr: 'km/h', full: '公里/时', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
    { abbr: 'mph',  full: '英里/时', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
    { abbr: 'kn',   full: '节',      toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
  ],
};

const CATS: { key: Category; label: string }[] = [
  { key: 'length', label: '长度' },
  { key: 'weight', label: '重量' },
  { key: 'temperature', label: '温度' },
  { key: 'area', label: '面积' },
  { key: 'volume', label: '体积' },
  { key: 'speed', label: '速度' },
];

export default function UnitConvertScreen() {
  const isDark = useColorScheme() === 'dark';
  const [category, setCategory] = useState<Category>('length');
  const [fromIdx, setFromIdx] = useState(2);
  const [value, setValue] = useState('1');

  const units = UNITS[category];
  const fromUnit = units[fromIdx];

  // 预计算所有换算结果
  const results = useMemo(() => {
    const n = parseFloat(value);
    if (isNaN(n)) return [] as { abbr: string; full: string; result: string; isSource: boolean }[];
    const base = fromUnit.toBase(n);
    return units.map((u, i) => ({
      abbr: u.abbr,
      full: u.full,
      result: u.fromBase(base).toFixed(6).replace(/\.?0+$/, ''),
      isSource: i === fromIdx,
    }));
  }, [value, fromUnit, units]);

  return (
    <ThemedView style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable style={s.back} onPress={() => router.dismiss()}>
            <ThemedView style={s.backBtn}><FontAwesome name="angle-left" size={18} color="#208AEF" /></ThemedView>
            <ThemedText type="small" style={{ color: '#208AEF' }}>返回</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">单位换算</ThemedText>

          {/* 分类标签 */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
            {CATS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[s.catTab, category === key && s.catTabActive]}
                onPress={() => setCategory(key)}
              >
                <ThemedText type="smallBold" style={category === key ? { color: '#FFF' } : undefined}>
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* ===== 输入区 ===== */}
          <ThemedView type="backgroundElement" style={s.card}>
            {/* 数值 + 当前单位 */}
            <ThemedView style={s.inputRow}>
              <TextInput
                style={[s.input, { color: isDark ? '#FFF' : '#000' }]}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                placeholder="输入数值"
                placeholderTextColor="#999"
              />
              <Pressable style={s.currentUnit}>
                <ThemedText style={s.currentAbbr}>{fromUnit.abbr}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11 }}>{fromUnit.full}</ThemedText>
              </Pressable>
            </ThemedView>

            {/* 单位 chip 选择 */}
            <ThemedView style={s.chips}>
              {units.map((u, i) => (
                <Pressable
                  key={i}
                  style={[s.chip, fromIdx === i && s.chipActive]}
                  onPress={() => setFromIdx(i)}
                >
                  <ThemedText style={[s.chipAbbr, fromIdx === i && { color: '#FFF' }]}>
                    {u.abbr}
                  </ThemedText>
                </Pressable>
              ))}
            </ThemedView>
          </ThemedView>

          {/* ===== 换算结果列表 ===== */}
          {results.length > 0 && (
            <ThemedView type="backgroundElement" style={s.resultCard}>
              <ThemedView style={s.resultHeader}>
                <ThemedView style={s.resultHeaderDot} />
                <ThemedText type="small" themeColor="textSecondary">
                  {value || '0'} <ThemedText style={{ fontWeight: '700', color: '#208AEF' }}>{fromUnit.abbr}</ThemedText> {fromUnit.full} 等于
                </ThemedText>
              </ThemedView>

              <ThemedView style={s.resultList}>
                {results.map((r, i) => (
                  <ThemedView
                    key={i}
                    style={[s.resultRow, r.isSource && s.resultRowSource]}
                  >
                    {/* 左侧：数值 */}
                    <ThemedView style={s.resultValueBox}>
                      <ThemedText
                        style={[s.resultVal, r.isSource && s.resultValSource]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                      >
                        {r.result}
                      </ThemedText>
                    </ThemedView>

                    {/* 中间：分隔线 */}
                    <ThemedView style={s.resultSep} />

                    {/* 右侧：单位信息 */}
                    <ThemedView style={s.resultUnitBox}>
                      <ThemedView style={[s.resultUnitBadge, r.isSource && s.resultUnitBadgeSource]}>
                        <ThemedText style={[s.resultAbbr, r.isSource && { color: '#FFF' }]}>
                          {r.abbr}
                        </ThemedText>
                      </ThemedView>
                      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>
                        {r.full}
                      </ThemedText>
                    </ThemedView>
                  </ThemedView>
                ))}
              </ThemedView>
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safe: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },

  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#208AEF12', alignItems: 'center', justifyContent: 'center' },

  // 分类标签
  catScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  catTab: {
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderRadius: Spacing.three, borderWidth: 1, borderColor: '#C0C0C0',
  },
  catTabActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },

  // 输入卡片
  card: { padding: Spacing.four, borderRadius: Spacing.three },

  // 输入行
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: '#208AEF06', borderRadius: Spacing.three,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
    borderWidth: 2, borderColor: '#208AEF20',
    marginBottom: Spacing.three,
  },
  input: { flex: 1, fontSize: 32, fontWeight: '700', padding: 0 },
  currentUnit: {
    alignItems: 'center', paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two, borderRadius: Spacing.two,
    backgroundColor: '#208AEF15',
  },
  currentAbbr: { fontSize: 18, fontWeight: '700', color: '#208AEF' },

  // 单位 chip
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
    borderRadius: Spacing.three, borderWidth: 1, borderColor: '#C0C0C050',
  },
  chipActive: { backgroundColor: '#208AEF', borderColor: '#208AEF' },
  chipAbbr: { fontSize: 14, fontWeight: '600' },

  // 结果卡片
  resultCard: { padding: Spacing.five, borderRadius: Spacing.four, gap: Spacing.three },

  // 结果头部
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  resultHeaderDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#208AEF' },

  // 结果列表
  resultList: { gap: Spacing.two },

  // 结果行
  resultRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.three,
    borderRadius: Spacing.three, gap: Spacing.three,
    backgroundColor: '#00000002',
  },
  resultRowSource: {
    backgroundColor: '#208AEF10',
  },

  // 左侧数值
  resultValueBox: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  resultVal: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  resultValSource: { color: '#208AEF', fontSize: 24 },

  // 分隔
  resultSep: { width: 1, height: 28, backgroundColor: '#E0E0E040', borderRadius: 1 },

  // 右侧单位
  resultUnitBox: { alignItems: 'center', minWidth: 56, gap: 2 },
  resultUnitBadge: {
    paddingHorizontal: Spacing.three, paddingVertical: Spacing.one,
    borderRadius: Spacing.two, backgroundColor: '#00000006',
  },
  resultUnitBadgeSource: { backgroundColor: '#208AEF' },
  resultAbbr: { fontSize: 15, fontWeight: '700' },
});
