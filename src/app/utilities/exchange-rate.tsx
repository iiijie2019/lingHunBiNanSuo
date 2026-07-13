import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoSpinner } from '@/components/logo-spinner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BrandColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  fetchLatestExchangeRate,
  getCachedExchangeRate,
  type ExchangeRate,
} from '@/services/exchange-rates';

type Currency = {
  code: string;
  name: string;
  symbol: string;
};

const CURRENCIES: Currency[] = [
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'AUD', name: '澳元', symbol: 'A$' },
  { code: 'CAD', name: '加元', symbol: 'C$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'Fr' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'NZD', name: '新西兰元', symbol: 'NZ$' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'MXN', name: '墨西哥比索', symbol: 'Mex$' },
  { code: 'AED', name: '阿联酋迪拉姆', symbol: 'د.إ' },
];

type CurrencySide = 'base' | 'quote';
function formatValue(value: number, maximumFractionDigits = 4) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function ExchangeRateScreen() {
  const theme = useTheme();
  const requestVersion = useRef(0);
  const [amount, setAmount] = useState('100');
  const [base, setBase] = useState('CNY');
  const [quote, setQuote] = useState('USD');
  const [rate, setRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currencySide, setCurrencySide] = useState<CurrencySide | null>(null);

  const baseCurrency = CURRENCIES.find((currency) => currency.code === base) ?? CURRENCIES[0];
  const quoteCurrency = CURRENCIES.find((currency) => currency.code === quote) ?? CURRENCIES[1];
  const numericAmount = Number(amount.replace(',', '.'));
  const converted = rate && Number.isFinite(numericAmount) && numericAmount >= 0
    ? numericAmount * rate.rate
    : null;

  const loadRate = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);

    const cached = await getCachedExchangeRate(base, quote);
    if (version !== requestVersion.current) return;
    if (cached) {
      setRate(cached);
    } else {
      setRate(null);
    }

    try {
      const latest = await fetchLatestExchangeRate(base, quote);
      if (version !== requestVersion.current) return;
      setRate(latest);
    } catch (requestError) {
      if (version !== requestVersion.current) return;
      setError(requestError instanceof Error ? requestError.message : '无法获取最新汇率');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [base, quote]);

  useEffect(() => {
    void loadRate();
  }, [loadRate]);

  const chooseCurrency = (code: string) => {
    if (currencySide === 'base') {
      if (code === quote) setQuote(base);
      setBase(code);
    } else if (currencySide === 'quote') {
      if (code === base) setBase(quote);
      setQuote(code);
    }
    setCurrencySide(null);
  };

  const swapCurrencies = () => {
    setBase(quote);
    setQuote(base);
  };

  return (
    <ThemedView cosmic style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityLabel="返回上一页"
            accessibilityRole="button"
            onPress={() => router.dismiss()}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}
          >
            <FontAwesome name="angle-left" size={18} color={theme.primary} />
            <ThemedText type="smallBold" style={{ color: theme.primary }}>返回</ThemedText>
          </Pressable>

          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: `${BrandColors.aurora}18` }]}>
              <FontAwesome name="exchange" size={20} color={BrandColors.aurora} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="smallBold" style={{ color: BrandColors.aurora }}>在线金融工具</ThemedText>
              <ThemedText type="subtitle" style={styles.title}>汇率换算</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                联网获取最新发布的央行参考汇率
              </ThemedText>
            </View>
          </View>

          <ThemedView type="backgroundElement" style={styles.converterCard}>
            <ThemedText type="smallBold">换算金额</ThemedText>
            <View style={[styles.amountInput, { backgroundColor: theme.background, borderColor: theme.backgroundSelected }]}>
              <ThemedText style={[styles.amountSymbol, { color: theme.primary }]}>{baseCurrency.symbol}</ThemedText>
              <TextInput
                accessibilityLabel="需要换算的金额"
                keyboardType="decimal-pad"
                maxLength={18}
                onChangeText={(value) => setAmount(value.replace(/[^0-9.,]/g, ''))}
                placeholder="0"
                placeholderTextColor={theme.textSecondary}
                selectTextOnFocus
                style={[styles.amountText, { color: theme.text }]}
                value={amount}
              />
              <ThemedText type="smallBold" themeColor="textSecondary">{base}</ThemedText>
            </View>

            <View style={styles.currencyRow}>
              <CurrencyButton
                currency={baseCurrency}
                label="从"
                onPress={() => setCurrencySide('base')}
              />
              <Pressable
                accessibilityLabel="交换币种"
                accessibilityRole="button"
                onPress={swapCurrencies}
                style={({ pressed }) => [
                  styles.swapButton,
                  { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` },
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="exchange" size={16} color={theme.primary} />
              </Pressable>
              <CurrencyButton
                currency={quoteCurrency}
                label="到"
                onPress={() => setCurrencySide('quote')}
              />
            </View>
          </ThemedView>

          <ThemedView
            type="backgroundElement"
            style={[styles.resultCard, { borderColor: rate ? `${BrandColors.cometBlue}50` : theme.backgroundSelected }]}
          >
            <View style={styles.resultHeader}>
              <ThemedText type="smallBold" themeColor="textSecondary">换算结果</ThemedText>
            </View>

            <ThemedText
              adjustsFontSizeToFit
              minimumFontScale={0.45}
              numberOfLines={1}
              style={[styles.resultValue, { color: theme.primary }]}
            >
              {converted === null ? '—' : `${quoteCurrency.symbol}${formatValue(converted)}`}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.rateText}>
              {rate ? `1 ${base} ≈ ${formatValue(rate.rate, 6)} ${quote}` : '正在等待汇率数据'}
            </ThemedText>

            {rate ? (
              <View style={styles.metaRow}>
                <FontAwesome name="clock-o" size={13} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary">
                  获取时间 {formatTime(rate.fetchedAt)}
                </ThemedText>
              </View>
            ) : null}

            {error ? (
              <View style={[styles.errorBox, { backgroundColor: `${BrandColors.novaRose}12` }]}>
                <FontAwesome name="wifi" size={14} color={BrandColors.novaRose} />
                <ThemedText type="small" style={[styles.errorText, { color: BrandColors.novaRose }]}>
                  {rate ? `更新失败：${error}` : error}
                </ThemedText>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={() => void loadRate()}
              style={({ pressed }) => [
                styles.refreshButton,
                { backgroundColor: `${theme.primary}16`, borderColor: `${theme.primary}38` },
                pressed && styles.pressed,
                loading && styles.disabled,
              ]}
            >
              {loading ? (
                <LogoSpinner size={20} duration={800} />
              ) : (
                <FontAwesome name="refresh" size={15} color={theme.primary} />
              )}
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {loading ? '正在获取最新汇率…' : '刷新汇率'}
              </ThemedText>
            </Pressable>
          </ThemedView>

          <View style={styles.notice}>
            <FontAwesome name="info-circle" size={13} color={BrandColors.meteor} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.noticeText}>
              数据来自 Frankfurter 汇总的央行参考汇率，通常按发布日更新，仅供日常换算，不代表交易成交价。
            </ThemedText>
          </View>
        </ScrollView>
      </SafeAreaView>

      <CurrencyPickerModal
        onClose={() => setCurrencySide(null)}
        onSelect={chooseCurrency}
        selectedCode={currencySide === 'base' ? base : quote}
        visible={currencySide !== null}
      />
    </ThemedView>
  );
}

function CurrencyButton({ currency, label, onPress }: {
  currency: Currency;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel={`${label}币种：${currency.name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.currencyButton,
        { backgroundColor: theme.background, borderColor: theme.backgroundSelected },
        pressed && styles.pressed,
      ]}
    >
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText style={styles.currencyCode}>{currency.code}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>{currency.name}</ThemedText>
      <FontAwesome name="angle-down" size={14} color={theme.primary} />
    </Pressable>
  );
}

function CurrencyPickerModal({ visible, selectedCode, onClose, onSelect }: {
  visible: boolean;
  selectedCode: string;
  onClose: () => void;
  onSelect: (code: string) => void;
}) {
  const theme = useTheme();
  const options = useMemo(() => CURRENCIES, []);

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top', 'bottom']} style={styles.modalSafeArea}>
          <ThemedView type="backgroundElement" style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>货币坐标</ThemedText>
                <ThemedText type="subtitle" style={styles.modalTitle}>选择币种</ThemedText>
              </View>
              <Pressable
                accessibilityLabel="关闭币种选择"
                onPress={onClose}
                style={[styles.modalClose, { backgroundColor: theme.backgroundSelected }]}
              >
                <FontAwesome name="close" size={16} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.currencyList}
              showsVerticalScrollIndicator={false}
              style={styles.currencyScroll}
            >
              {options.map((currency) => {
                const selected = currency.code === selectedCode;
                return (
                  <Pressable
                    key={currency.code}
                    onPress={() => onSelect(currency.code)}
                    style={({ pressed }) => [
                      styles.currencyOption,
                      { borderColor: selected ? theme.primary : theme.backgroundSelected },
                      selected && { backgroundColor: `${theme.primary}12` },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={[styles.currencySymbol, { backgroundColor: `${theme.primary}12` }]}>
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>{currency.symbol}</ThemedText>
                    </View>
                    <View style={styles.currencyOptionCopy}>
                      <ThemedText type="smallBold">{currency.code}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{currency.name}</ThemedText>
                    </View>
                    {selected ? <FontAwesome name="check-circle" size={18} color={theme.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    width: '100%', maxWidth: 560, alignSelf: 'center',
    paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.five,
  },
  backButton: {
    minHeight: 36, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 12, borderRadius: 18,
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.55 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    paddingTop: Spacing.four, paddingBottom: Spacing.four,
  },
  headerIcon: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 28, lineHeight: 38 },
  converterCard: { padding: Spacing.three, borderRadius: 22, gap: Spacing.three },
  amountInput: {
    minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    paddingHorizontal: Spacing.three, borderRadius: 17, borderWidth: 1,
  },
  amountSymbol: { fontSize: 20, fontWeight: '700' },
  amountText: {
    flex: 1, minWidth: 0, fontSize: 30, fontWeight: '700', paddingVertical: Spacing.two,
    fontVariant: ['tabular-nums'],
  },
  currencyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  currencyButton: {
    flex: 1, minWidth: 0, minHeight: 112, alignItems: 'center', justifyContent: 'center',
    gap: 3, padding: Spacing.two, borderRadius: 17, borderWidth: 1,
  },
  currencyCode: { fontSize: 23, lineHeight: 30, fontWeight: '800', letterSpacing: 1 },
  swapButton: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  resultCard: {
    marginTop: Spacing.three, padding: Spacing.four, borderRadius: 22, borderWidth: 1,
    alignItems: 'center', gap: Spacing.two,
  },
  resultHeader: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
  },
  resultValue: {
    width: '100%', fontSize: 54, lineHeight: 66, fontWeight: '800',
    textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  rateText: { textAlign: 'center' },
  metaRow: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  errorBox: {
    width: '100%', flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    padding: 10, borderRadius: 12,
  },
  errorText: { flex: 1, lineHeight: 18 },
  refreshButton: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.two, paddingHorizontal: Spacing.four, borderRadius: 14, borderWidth: 1,
    marginTop: Spacing.one,
  },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two,
    paddingHorizontal: Spacing.two, paddingTop: Spacing.three,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18 },
  modalOverlay: {
    flex: 1, justifyContent: 'center', padding: Spacing.three,
    backgroundColor: 'rgba(2, 10, 22, 0.74)',
  },
  modalSafeArea: { width: '100%', maxWidth: 500, maxHeight: '90%', alignSelf: 'center' },
  modalSheet: { flexShrink: 1, padding: Spacing.four, borderRadius: 26 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingBottom: Spacing.three,
  },
  modalTitle: { fontSize: 26, lineHeight: 34 },
  modalClose: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  currencyList: { gap: Spacing.two, paddingBottom: Spacing.two },
  currencyScroll: { flexShrink: 1 },
  currencyOption: {
    minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    padding: 9, borderRadius: 16, borderWidth: 1,
  },
  currencySymbol: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  currencyOptionCopy: { flex: 1, gap: 1 },
});
