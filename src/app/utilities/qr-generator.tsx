import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function QRGeneratorScreen() {
  const [text, setText] = useState('');
  const [qrValue, setQrValue] = useState('');

  const generate = () => {
    const t = text.trim();
    if (!t) return;
    setQrValue(t);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Pressable style={styles.backRow} onPress={() => router.dismiss()}>
            <ThemedView style={styles.backBtn}><FontAwesome name="angle-left" size={18} color="#000" /></ThemedView>
            <ThemedText type="small">返回</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">二维码生成</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">输入文本或链接，生成二维码</ThemedText>

          <ThemedView type="backgroundElement" style={styles.inputCard}>
            <TextInput
              style={styles.textInput}
              placeholder="输入文字或网址..."
              placeholderTextColor="#999"
              value={text}
              onChangeText={setText}
              onSubmitEditing={generate}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Pressable style={styles.genBtn} onPress={generate}>
              <FontAwesome name="qrcode" size={18} color="#FFF" />
              <ThemedText style={{ color: '#FFF', fontWeight: '600' }}>生成二维码</ThemedText>
            </Pressable>
          </ThemedView>

          {qrValue !== '' && (
            <ThemedView type="backgroundElement" style={styles.qrCard}>
              <View style={styles.qrWrap}>
                <QRCode value={qrValue} size={250} backgroundColor="#FFFFFF" color="#000000" />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.two }}>
                截图或分享给他人扫码
              </ThemedText>
            </ThemedView>
          )}

          <ThemedView style={{ height: Spacing.six }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: 500, paddingHorizontal: Spacing.four },
  scroll: { gap: Spacing.three, paddingBottom: Spacing.six },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.two, alignSelf: 'flex-start' },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#00000008', alignItems: 'center', justifyContent: 'center' },

  inputCard: { padding: Spacing.four, borderRadius: Spacing.three, gap: Spacing.three },
  textInput: { fontSize: 16, minHeight: 70, padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1, borderColor: '#C0C0C0', color: '#000' },
  genBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', paddingVertical: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },

  qrCard: { padding: Spacing.five, borderRadius: Spacing.three, alignItems: 'center' },
  qrWrap: { padding: Spacing.two, backgroundColor: '#FFF', borderRadius: Spacing.two },
});
