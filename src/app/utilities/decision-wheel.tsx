import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const COLORS = ['#FF6B6B', '#FF9500', '#34C759', '#208AEF', '#AF52DE', '#FF3B80', '#00C7BE', '#FF8C00', '#1E90FF', '#FFD700', '#FF4500', '#8B4513'];

const WHEEL_SIZE = 300;
const R = WHEEL_SIZE / 2;
const CX = R, CY = R;

interface Prize { name: string; pct: number }

const DEFAULTS: Prize[] = [
  { name: '一等奖', pct: 10 },
  { name: '二等奖', pct: 20 },
  { name: '三等奖', pct: 30 },
  { name: '参与奖', pct: 40 },
];

export default function DecisionWheelScreen() {
  // ---- 状态 ----
  const [phase, setPhase] = useState<'input' | 'wheel' | 'result'>('input');
  const [prizes, setPrizes] = useState<Prize[]>([...DEFAULTS]);
  const [nameInp, setNameInp] = useState('');
  const [pctInp, setPctInp] = useState('');
  const [resultIdx, setResultIdx] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const spinValue = useRef(new Animated.Value(0)).current;
  const spinRef = useRef(0); // accumulated rotation in degrees

  const totalPct = prizes.reduce((s, p) => s + p.pct, 0);

  // ---- 添加奖项 ----
  const addPrize = () => {
    const name = nameInp.trim();
    const pct = parseInt(pctInp, 10);
    if (!name || isNaN(pct) || pct < 1 || pct > 100) return;
    if (totalPct + pct > 100) return;
    if (prizes.length >= 12) return;
    setPrizes([...prizes, { name, pct }]);
    setNameInp('');
    setPctInp('');
  };

  // ---- 删除奖项 ----
  const removePrize = (i: number) => setPrizes(prizes.filter((_, idx) => idx !== i));

  // ---- 进入转盘 ----
  const gotoWheel = () => {
    if (prizes.length < 2 || totalPct !== 100) return;
    spinValue.setValue(0);
    spinRef.current = 0;
    setResultIdx(null);
    setPhase('wheel');
  };

  // ---- 旋转 ----
  const spin = useCallback(() => {
    if (spinning || prizes.length < 2) return;
    setSpinning(true);
    setResultIdx(null);

    // 加权随机：按占比选目标
    const rand = Math.random() * 100;
    let cum = 0, target = 0;
    for (let i = 0; i < prizes.length; i++) {
      cum += prizes[i].pct;
      if (rand < cum) { target = i; break; }
    }

    // 计算目标扇形中心角度（从顶部顺时针）
    let startAngle = 0;
    for (let i = 0; i < target; i++) startAngle += (prizes[i].pct / 100) * 360;
    const segDeg = (prizes[target].pct / 100) * 360;
    const centerDeg = startAngle + segDeg / 2;

    // 旋转量 = N圈 + 让中心对准顶部指针(360°位置)
    const laps = 5 + Math.floor(Math.random() * 3);
    const delta = laps * 360 + (360 - centerDeg);

    Animated.timing(spinValue, {
      toValue: spinRef.current + delta,
      duration: 4000 + Math.random() * 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      spinRef.current = (spinRef.current + delta) % 360;
      spinValue.setValue(spinRef.current);
      setResultIdx(target);
      setSpinning(false);
      setHistory((h) => [prizes[target].name, ...h].slice(0, 8));
    });
  }, [spinning, prizes]);

  // ---- 构建 SVG 扇形 ----
  const segments: { d: string; color: string; label: string; tx: number; ty: number; rot: number }[] = [];
  let angle = 0; // 从顶部 12 点开始，顺时针累计

  prizes.forEach((p) => {
    const deg = (p.pct / 100) * 360;
    const a1 = (angle - 90) * Math.PI / 180;        // SVG 坐标：0° = 3点钟
    const a2 = (angle + deg - 90) * Math.PI / 180;
    angle += deg;

    const x1 = CX + R * Math.cos(a1);
    const y1 = CY + R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY + R * Math.sin(a2);
    const large = deg > 180 ? 1 : 0;
    const d = `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large} 1 ${x2},${y2} Z`;

    const midDeg = (angle - deg / 2); // 扇形中心角度（从顶部顺时针）
    const midRad = (midDeg - 90) * Math.PI / 180;
    const tr = R * 0.55; // 文字距圆心距离
    const tx = CX + tr * Math.cos(midRad);
    const ty = CY + tr * Math.sin(midRad);

    segments.push({
      d, color: COLORS[segments.length % COLORS.length],
      label: p.name, tx, ty,
      rot: midDeg - 90, // SVG text 旋转角
    });
  });

  const rotation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // ===== RENDER =====
  return (
    <ThemedView style={s.container}>
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* 顶部栏 */}
          <Pressable style={s.back} onPress={() => router.dismiss()}>
            <ThemedView style={s.backBtn}><FontAwesome name="angle-left" size={18} color="#FF9500" /></ThemedView>
            <ThemedText type="small" style={s.backLabel}>返回</ThemedText>
          </Pressable>
          <ThemedView style={s.titleRow}>
            <ThemedText type="subtitle">转盘抽奖</ThemedText>
            {phase === 'wheel' && prizes.length > 0 && (
              <ThemedText type="small" themeColor="textSecondary">{prizes.length} 个奖项</ThemedText>
            )}
          </ThemedView>

          {/* ========== 输入阶段 ========== */}
          {phase === 'input' && (
            <>
              {/* 占比条形图 */}
              <ThemedView type="backgroundElement" style={s.barCard}>
                <ThemedView style={s.bar}>
                  {prizes.map((p, i) => (
                    <View key={i} style={{ flex: p.pct, backgroundColor: COLORS[i % COLORS.length], height: 10, marginHorizontal: 1 }} />
                  ))}
                  {totalPct < 100 && <View style={{ flex: 100 - totalPct, backgroundColor: '#E0E0E020', height: 10 }} />}
                </ThemedView>
                <ThemedView style={s.barInfo}>
                  <ThemedText type="small" themeColor="textSecondary">已分配</ThemedText>
                  <ThemedText style={s.barPct}>{totalPct}%</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">/ 100%</ThemedText>
                </ThemedView>
              </ThemedView>

              {/* 奖品列表 */}
              <ThemedView type="backgroundElement" style={s.list}>
                {prizes.map((p, i) => (
                  <ThemedView key={i} style={s.row}>
                    <View style={[s.dot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <ThemedText style={s.rowName}>{p.name}</ThemedText>
                    <ThemedText style={s.rowPct}>{p.pct}%</ThemedText>
                    <Pressable onPress={() => removePrize(i)} hitSlop={8}>
                      <FontAwesome name="times-circle" size={18} color="#FF3B3040" />
                    </Pressable>
                  </ThemedView>
                ))}
                {/* 添加 */}
                <ThemedView style={s.addRow}>
                  <TextInput style={s.inpName} placeholder="奖项名" placeholderTextColor="#999" value={nameInp} onChangeText={setNameInp} maxLength={10} />
                  <View style={s.inpPctWrap}>
                    <TextInput style={s.inpPct} placeholder="占比" placeholderTextColor="#999" value={pctInp} onChangeText={setPctInp} keyboardType="numeric" maxLength={3} onSubmitEditing={addPrize} />
                    <ThemedText type="small" themeColor="textSecondary">%</ThemedText>
                  </View>
                  <Pressable style={s.addBtn} onPress={addPrize}><FontAwesome name="plus" size={14} color="#FFF" /></Pressable>
                </ThemedView>
                <Pressable style={s.reset} onPress={() => { setPrizes([...DEFAULTS]); setNameInp(''); setPctInp(''); }}>
                  <ThemedText type="small" style={{ color: '#208AEF' }}>恢复默认</ThemedText>
                </Pressable>
              </ThemedView>

              {/* 确定按钮 */}
              <Pressable style={[s.btn, (prizes.length < 2 || totalPct !== 100) && s.btnOff]} onPress={gotoWheel} disabled={prizes.length < 2 || totalPct !== 100}>
                <ThemedText style={s.btnText}>
                  {totalPct < 100 ? `还需 ${100 - totalPct}%` : totalPct > 100 ? `超出 ${totalPct - 100}%` : `确定 · ${prizes.length} 个奖项`}
                </ThemedText>
              </Pressable>
            </>
          )}

          {/* ========== 转盘 + 结果阶段 ========== */}
          {(phase === 'wheel' || phase === 'result') && (
            <>
              {/* 指针 + 转盘 */}
              <View style={s.wheelWrap}>
                {/* 指针 */}
                <View style={s.pointer}>
                  <View style={s.pointerInner} />
                </View>
                {/* 旋转层 */}
                <Animated.View style={[s.wheelBox, { transform: [{ rotate: rotation }] }]}>
                  <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
                    {/* 扇形 */}
                    {segments.map((seg, i) => (
                      <Path key={i} d={seg.d} fill={seg.color} stroke="#FFF" strokeWidth={1.5} />
                    ))}
                    {/* 文字 */}
                    {segments.map((seg, i) => (
                      <SvgText
                        key={`t${i}`}
                        x={seg.tx} y={seg.ty}
                        fill="#FFF" fontSize={12} fontWeight="bold"
                        textAnchor="middle" alignmentBaseline="middle"
                        transform={`rotate(${seg.rot}, ${seg.tx}, ${seg.ty})`}
                      >
                        {seg.label.length > 6 ? seg.label.slice(0, 5) + '…' : seg.label}
                      </SvgText>
                    ))}
                    {/* 中心 */}
                    <Circle cx={CX} cy={CY} r={22} fill="#FFF" stroke="#E0E0E0" strokeWidth={3} />
                    <Circle cx={CX} cy={CY} r={10} fill="#FF9500" />
                  </Svg>
                </Animated.View>
              </View>

              {/* 图例 */}
              <View style={s.legend}>
                {prizes.map((p, i) => (
                  <View key={i} style={s.legendItem}>
                    <View style={[s.legendDot, { backgroundColor: COLORS[i % COLORS.length] }]} />
                    <ThemedText type="small" numberOfLines={1}>{p.name}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary"> {p.pct}%</ThemedText>
                  </View>
                ))}
              </View>

              {/* 按钮区 */}
              {!spinning && resultIdx !== null ? (
                /* ---- 结果展示 ---- */
                <ThemedView type="backgroundElement" style={s.result}>
                  <ThemedText type="small" themeColor="textSecondary">恭喜中奖</ThemedText>
                  <ThemedText style={s.resultEmoji}>🎉</ThemedText>
                  <ThemedText style={s.resultName}>{prizes[resultIdx].name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">概率 {prizes[resultIdx].pct}%</ThemedText>
                  <ThemedView style={s.resultBtns}>
                    <Pressable style={s.btnAgain} onPress={spin}>
                      <FontAwesome name="refresh" size={16} color="#FFF" />
                      <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>再抽一次</ThemedText>
                    </Pressable>
                    <Pressable style={s.btnEdit} onPress={() => setPhase('input')}>
                      <ThemedText type="small" style={{ color: '#208AEF' }}>编辑奖项</ThemedText>
                    </Pressable>
                  </ThemedView>
                </ThemedView>
              ) : (
                /* ---- 旋转按钮 ---- */
                <Pressable style={[s.btnSpin, spinning && { opacity: 0.6 }]} onPress={spin} disabled={spinning}>
                  <FontAwesome name={spinning ? 'spinner' : 'refresh'} size={20} color="#FFF" />
                  <ThemedText style={s.btnSpinText}>{spinning ? '抽奖中...' : '开始抽奖'}</ThemedText>
                </Pressable>
              )}
            </>
          )}

          {/* 抽奖记录 */}
          {history.length > 0 && (
            <ThemedView type="backgroundElement" style={s.historyCard}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={{ marginBottom: Spacing.one }}>📋 抽奖记录</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.two }}>
                {history.map((h, i) => (
                  <ThemedView key={i} style={s.histTag}><ThemedText type="small" style={{ color: '#FF9500', fontWeight: '600' }}>{h}</ThemedText></ThemedView>
                ))}
              </ScrollView>
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// ===== Styles =====
const s = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safe: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },

  // Header
  back: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FF950012', alignItems: 'center', justifyContent: 'center' },
  backLabel: { color: '#FF9500' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },

  // Bar
  barCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden' },
  barInfo: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  barPct: { fontWeight: '700', color: '#FF9500' },

  // Prize list
  list: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
  rowName: { flex: 1, fontSize: 15 },
  rowPct: { fontWeight: '700', color: '#FF9500', width: 36, textAlign: 'right' },
  addRow: { flexDirection: 'row', gap: Spacing.two, paddingTop: 4 },
  inpName: { flex: 2, fontSize: 14, backgroundColor: '#FFF', paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.one, borderWidth: 1, borderColor: '#C0C0C0', color: '#000' },
  inpPctWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: Spacing.one, borderWidth: 1, borderColor: '#C0C0C0', paddingHorizontal: Spacing.one },
  inpPct: { flex: 1, fontSize: 14, paddingVertical: Spacing.one, textAlign: 'center', color: '#000' },
  addBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FF9500', alignItems: 'center', justifyContent: 'center' },
  reset: { alignItems: 'center', paddingTop: 4 },

  // Confirm
  btn: { backgroundColor: '#FF9500', paddingVertical: Spacing.three, borderRadius: Spacing.three, alignItems: 'center' },
  btnOff: { opacity: 0.4 },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Wheel
  wheelWrap: { alignItems: 'center', paddingVertical: Spacing.two },
  pointer: { zIndex: 10, marginBottom: -12, alignItems: 'center' },
  pointerInner: {
    width: 0, height: 0,
    borderLeftWidth: 14, borderRightWidth: 14,
    borderTopWidth: 24,
    borderTopColor: '#FF3B30',
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
  },
  wheelBox: {
    width: WHEEL_SIZE, height: WHEEL_SIZE,
    borderRadius: R, overflow: 'hidden',
    borderWidth: 4, borderColor: '#E0E0E030',
  },

  // Legend
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, justifyContent: 'center', paddingHorizontal: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },

  // Spin button
  btnSpin: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FF9500', paddingVertical: 14, borderRadius: Spacing.three, gap: Spacing.two,
    shadowColor: '#FF9500', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnSpinText: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Result
  result: { padding: Spacing.five, borderRadius: Spacing.three, alignItems: 'center', gap: Spacing.one },
  resultEmoji: { fontSize: 48, lineHeight: 56 },
  resultName: { fontSize: 26, fontWeight: '800', color: '#FF9500' },
  resultBtns: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two, width: '100%' },
  btnAgain: { flex: 1, flexDirection: 'row', gap: Spacing.two, backgroundColor: '#FF9500', paddingVertical: Spacing.three, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  btnEdit: { flex: 1, paddingVertical: Spacing.three, borderRadius: Spacing.three, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C0C0C0' },

  // History
  historyCard: { padding: Spacing.four, borderRadius: Spacing.three },
  histTag: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: Spacing.two, backgroundColor: '#FF950010', borderWidth: 1, borderColor: '#FF950020' },
});
