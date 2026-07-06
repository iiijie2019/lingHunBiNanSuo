import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function RandomNumberScreen() {
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [result, setResult] = useState<number | null>(null);

  const generate = () => {
    setResult(Math.floor(Math.random() * (max - min + 1)) + min);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
          <FontAwesome name="angle-left" size={20} color="#208AEF" />
          <ThemedText type="default" style={styles.backLabel}>返回</ThemedText>
        </Pressable>

        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">随机数生成器</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            在指定范围内生成一个随机整数
          </ThemedText>
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          {/* 范围选择 */}
          <ThemedView style={styles.rangeRow}>
            <ThemedView style={styles.rangeBox}>
              <ThemedText type="small" themeColor="textSecondary">最小值</ThemedText>
              <ThemedView style={styles.rangeControl}>
                <Pressable style={styles.stepBtn} onPress={() => setMin((v) => Math.max(0, v - 1))}>
                  <FontAwesome name="minus" size={14} color="#208AEF" />
                </Pressable>
                <ThemedText style={styles.rangeValue}>{min}</ThemedText>
                <Pressable style={styles.stepBtn} onPress={() => setMin((v) => v + 1)}>
                  <FontAwesome name="plus" size={14} color="#208AEF" />
                </Pressable>
              </ThemedView>
            </ThemedView>

            <ThemedView style={styles.rangeBox}>
              <ThemedText type="small" themeColor="textSecondary">最大值</ThemedText>
              <ThemedView style={styles.rangeControl}>
                <Pressable style={styles.stepBtn} onPress={() => setMax((v) => v - 1)}>
                  <FontAwesome name="minus" size={14} color="#208AEF" />
                </Pressable>
                <ThemedText style={styles.rangeValue}>{max}</ThemedText>
                <Pressable style={styles.stepBtn} onPress={() => setMax((v) => v + 1)}>
                  <FontAwesome name="plus" size={14} color="#208AEF" />
                </Pressable>
              </ThemedView>
            </ThemedView>
          </ThemedView>

          <Pressable style={styles.btn} onPress={generate}>
            <FontAwesome name="random" size={18} color="#FFFFFF" />
            <ThemedText style={styles.btnText}>生成随机数</ThemedText>
          </Pressable>

          {result !== null && (
            <ThemedView style={styles.resultBox}>
              <ThemedText type="small" themeColor="textSecondary">结果</ThemedText>
              <ThemedText style={styles.result}>{result}</ThemedText>
            </ThemedView>
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
  backLabel: { color: '#208AEF' },
  header: { paddingBottom: Spacing.four, gap: Spacing.half },

  card: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.five },

  rangeRow: { gap: Spacing.four },
  rangeBox: { gap: Spacing.two },
  rangeControl: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.three,
  },
  stepBtn: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#208AEF30',
  },
  rangeValue: { fontSize: 28, fontWeight: '700', minWidth: 48, textAlign: 'center', lineHeight: 36 },

  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#208AEF', paddingVertical: Spacing.three,
    borderRadius: Spacing.three, gap: Spacing.two,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  resultBox: { alignItems: 'center', gap: Spacing.two, paddingTop: Spacing.two },
  result: { fontSize: 72, fontWeight: '800', color: '#208AEF', lineHeight: 84 },
});
