import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://api.frankfurter.dev/v2';
const CACHE_KEY = '@liuyinji_exchange_rate_cache_v1';
const REQUEST_TIMEOUT = 10000;

export type ExchangeRate = {
  base: string;
  quote: string;
  rate: number;
  date: string;
  fetchedAt: string;
};

type RateResponse = {
  base?: unknown;
  quote?: unknown;
  rate?: unknown;
  date?: unknown;
  message?: unknown;
};

function pairKey(base: string, quote: string) {
  return `${base}_${quote}`;
}

function isExchangeRate(value: unknown): value is ExchangeRate {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<ExchangeRate>;
  return typeof candidate.base === 'string'
    && typeof candidate.quote === 'string'
    && typeof candidate.rate === 'number'
    && Number.isFinite(candidate.rate)
    && candidate.rate > 0
    && typeof candidate.date === 'string'
    && typeof candidate.fetchedAt === 'string';
}

async function readCache(): Promise<Record<string, ExchangeRate>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, ExchangeRate] => isExchangeRate(entry[1])),
    );
  } catch {
    return {};
  }
}

export async function getCachedExchangeRate(base: string, quote: string): Promise<ExchangeRate | null> {
  const cache = await readCache();
  const direct = cache[pairKey(base, quote)];
  if (direct) return direct;

  const reverse = cache[pairKey(quote, base)];
  if (!reverse) return null;
  return {
    base,
    quote,
    rate: 1 / reverse.rate,
    date: reverse.date,
    fetchedAt: reverse.fetchedAt,
  };
}

async function cacheExchangeRate(rate: ExchangeRate): Promise<void> {
  try {
    const cache = await readCache();
    cache[pairKey(rate.base, rate.quote)] = rate;
    cache[pairKey(rate.quote, rate.base)] = {
      base: rate.quote,
      quote: rate.base,
      rate: 1 / rate.rate,
      date: rate.date,
      fetchedAt: rate.fetchedAt,
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('[exchange-rates] Failed to cache rate:', error);
  }
}

export async function fetchLatestExchangeRate(base: string, quote: string): Promise<ExchangeRate> {
  if (base === quote) {
    return {
      base,
      quote,
      rate: 1,
      date: new Date().toISOString().slice(0, 10),
      fetchedAt: new Date().toISOString(),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const response = await fetch(
      `${API_BASE_URL}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
      { headers: { Accept: 'application/json' }, signal: controller.signal },
    );
    const data = await response.json() as RateResponse;

    if (!response.ok) {
      throw new Error(typeof data.message === 'string' ? data.message : `请求失败（${response.status}）`);
    }
    if (data.base !== base || data.quote !== quote || typeof data.rate !== 'number'
      || !Number.isFinite(data.rate) || data.rate <= 0 || typeof data.date !== 'string') {
      throw new Error('汇率服务返回了无法识别的数据');
    }

    const rate: ExchangeRate = {
      base,
      quote,
      rate: data.rate,
      date: data.date,
      fetchedAt: new Date().toISOString(),
    };
    await cacheExchangeRate(rate);
    return rate;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('汇率请求超时，请稍后重试');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
