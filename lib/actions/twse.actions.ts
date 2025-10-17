'use server';

import { cache } from 'react';

import { extractTaiwanStockCode } from '@/lib/utils';

const TWSE_BASE_URL = 'https://openapi.twse.com.tw/v1';
const TWSE_REQUEST_HEADERS: Record<string, string> = {
    'User-Agent': 'Lazybacktest/1.0 (+https://lazybacktest.com)',
    Accept: 'application/json',
};

type FetchOptions = {
    searchParams?: Record<string, string>;
    revalidate?: number;
    cacheMode?: RequestCache;
};

const fetchTwseJSON = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
    const url = new URL(`${TWSE_BASE_URL}/${path.replace(/^\//, '')}`);
    const params = { response: 'json', ...options.searchParams };
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, value);
        }
    });

    const init: RequestInit & { next?: { revalidate?: number } } = {
        headers: TWSE_REQUEST_HEADERS,
        cache: options.cacheMode ?? (options.revalidate ? 'force-cache' : 'no-store'),
    };

    if (options.revalidate) {
        init.next = { revalidate: options.revalidate };
    }

    const res = await fetch(url.toString(), init);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`TWSE fetch failed ${res.status}: ${text}`);
    }

    return (await res.json()) as T;
};

type TwseDailyRecord = {
    Date: string;
    Volume: string;
    Open: string;
    High: string;
    Low: string;
    Close: string;
};

type TwseDailyResponse = TwseDailyRecord[];

const parseTwseNumber = (value?: string | number | null): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }

    const sanitized = value.replace(/,/g, '').replace(/--/g, '').trim();
    if (!sanitized) return undefined;

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : undefined;
};

const parseTwseDate = (value?: string): number | undefined => {
    if (!value) return undefined;
    const sanitized = value.replace(/\s+/g, '');
    const parts = sanitized.split(/[\/\-]/);
    if (parts.length !== 3) return undefined;

    const [yearPart, monthPart, dayPart] = parts;
    const year = Number.parseInt(yearPart, 10);
    const month = Number.parseInt(monthPart, 10);
    const day = Number.parseInt(dayPart, 10);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return undefined;
    }

    const resolvedYear = year < 1911 ? year + 1911 : year;
    const date = new Date(Date.UTC(resolvedYear, month - 1, day, 0, 0, 0));
    return Number.isFinite(date.valueOf()) ? Math.floor(date.getTime() / 1000) : undefined;
};

const fetchMonthlyDailyRecords = async (stockCode: string, dateParam: string) => {
    const data = await fetchTwseJSON<TwseDailyResponse>('exchangeReport/STOCK_DAY', {
        searchParams: { stockNo: stockCode, date: dateParam },
        revalidate: 900,
    });

    return Array.isArray(data) ? data : [];
};

const uniqueCandles = (candles: CandleDatum[]): CandleDatum[] => {
    const seen = new Set<number>();
    const result: CandleDatum[] = [];

    for (const candle of candles) {
        if (seen.has(candle.time)) continue;
        seen.add(candle.time);
        result.push(candle);
    }

    return result;
};

const toCandleDatum = (record: TwseDailyRecord): CandleDatum | undefined => {
    const time = parseTwseDate(record.Date);
    const open = parseTwseNumber(record.Open);
    const high = parseTwseNumber(record.High);
    const low = parseTwseNumber(record.Low);
    const close = parseTwseNumber(record.Close);
    const volume = parseTwseNumber(record.Volume);

    if (
        time === undefined ||
        open === undefined ||
        high === undefined ||
        low === undefined ||
        close === undefined
    ) {
        return undefined;
    }

    return {
        time,
        open,
        high,
        low,
        close,
        volume: volume !== undefined ? volume : undefined,
    } satisfies CandleDatum;
};

export const getTaiwanStockCandles = async (
    symbol: string,
    options: { count?: number; to?: number } = {},
): Promise<StockCandlesResult> => {
    const stockCode = extractTaiwanStockCode(symbol);
    if (!stockCode) {
        return { candles: [], reason: 'invalid-symbol' };
    }

    try {
        const targetCount = Math.max(options.count ?? 240, 60);
        const toTimestamp = options.to ?? Math.floor(Date.now() / 1000);
        const toDate = new Date(toTimestamp * 1000);
        const monthsToFetch = 18;
        const collected: CandleDatum[] = [];

        for (let offset = 0; offset < monthsToFetch && collected.length < targetCount * 2; offset++) {
            const cursor = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - offset, 1));
            const dateParam = `${cursor.getUTCFullYear()}${String(cursor.getUTCMonth() + 1).padStart(2, '0')}01`;
            const records = await fetchMonthlyDailyRecords(stockCode, dateParam);

            for (const record of records) {
                const candle = toCandleDatum(record);
                if (!candle) continue;
                collected.push(candle);
            }
        }

        const normalized = uniqueCandles(collected)
            .filter((candle) => candle.time <= toTimestamp)
            .sort((a, b) => a.time - b.time);

        if (normalized.length === 0) {
            return { candles: [], reason: 'no-data' };
        }

        const trimmed = normalized.slice(-targetCount);
        return { candles: trimmed };
    } catch (error) {
        console.error('getTaiwanStockCandles error:', error);
        const message = error instanceof Error ? error.message : '';
        if (message.includes('429')) {
            return { candles: [], reason: 'rate-limit' };
        }
        return { candles: [], reason: 'network-error' };
    }
};

type TwseRealtimeRecord = {
    Code: string;
    Name?: string;
    TradeVolume?: string;
    OpeningPrice?: string;
    HighestPrice?: string;
    LowestPrice?: string;
    ClosingPrice?: string;
    Change?: string;
    ChangeRate?: string;
    TradeTime?: string;
    LastUpdatedTime?: string;
};

type TwseRealtimeResponse = TwseRealtimeRecord[];

const fetchRealtimeSnapshot = async () => {
    try {
        const data = await fetchTwseJSON<TwseRealtimeResponse>('stock/twt48u', { revalidate: 30 });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('fetchRealtimeSnapshot error:', error);
        return [];
    }
};

const parseTwseTimestamp = (value?: string): number | undefined => {
    if (!value) return undefined;
    const sanitized = value.replace(/\s+/g, ' ').trim();
    const date = new Date(`${sanitized.replace(/\//g, '-')} GMT+08:00`);
    return Number.isFinite(date.valueOf()) ? Math.floor(date.getTime() / 1000) : undefined;
};

export const getTaiwanRealtimeQuote = async (symbol: string): Promise<QuoteData | null> => {
    const stockCode = extractTaiwanStockCode(symbol);
    if (!stockCode) {
        return null;
    }

    const records = await fetchRealtimeSnapshot();
    const record = records.find((entry) => entry.Code === stockCode);
    if (!record) {
        return null;
    }

    const close = parseTwseNumber(record.ClosingPrice);
    const open = parseTwseNumber(record.OpeningPrice);
    const high = parseTwseNumber(record.HighestPrice);
    const low = parseTwseNumber(record.LowestPrice);
    const change = parseTwseNumber(record.Change);
    const changeRate = parseTwseNumber(record.ChangeRate);
    const timestamp = parseTwseTimestamp(record.TradeTime ?? record.LastUpdatedTime);

    const previousClose = close !== undefined && change !== undefined ? close - change : undefined;
    const percent =
        changeRate !== undefined
            ? changeRate
            : change !== undefined && previousClose !== undefined && previousClose !== 0
              ? (change / previousClose) * 100
              : undefined;

    return {
        c: close,
        o: open,
        h: high,
        l: low,
        pc: previousClose,
        dp: percent,
        t: timestamp,
    };
};

type TwseCompanyRecord = {
    公司代號?: string;
    公司名稱?: string;
    公司簡稱?: string;
    外國企業註冊地國?: string;
    產業類別?: string;
    網址?: string;
    上市日期?: string;
};

type TwseCompanyDirectory = TwseCompanyRecord[];

const fetchCompanyDirectory = cache(async (): Promise<TwseCompanyDirectory> => {
    try {
        return await fetchTwseJSON<TwseCompanyDirectory>('opendata/t187ap03_L', { revalidate: 43_200 });
    } catch (error) {
        console.error('fetchCompanyDirectory error:', error);
        return [];
    }
});

const normalizeWebsite = (value?: string) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
};

const convertRocDate = (value?: string) => {
    if (!value) return undefined;
    const parts = value.replace(/\s+/g, '').split(/[\/\-]/);
    if (parts.length !== 3) return undefined;
    const [rocYear, month, day] = parts.map((part) => Number.parseInt(part, 10));
    if (!Number.isFinite(rocYear) || !Number.isFinite(month) || !Number.isFinite(day)) {
        return undefined;
    }
    const year = (rocYear > 1911 ? rocYear : rocYear + 1911).toString().padStart(4, '0');
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getTaiwanCompanyProfile = async (symbol: string): Promise<ProfileData | null> => {
    const stockCode = extractTaiwanStockCode(symbol);
    if (!stockCode) {
        return null;
    }

    const directory = await fetchCompanyDirectory();
    const record = directory.find((entry) => entry.公司代號 === stockCode);

    if (!record) {
        return {
            name: stockCode,
            ticker: `${stockCode}.TW`,
            exchange: 'TWSE',
            currency: 'TWD',
        };
    }

    const country = record.外國企業註冊地國?.trim();

    return {
        name: record.公司名稱?.trim() || record.公司簡稱?.trim() || stockCode,
        ticker: `${stockCode}.TW`,
        exchange: 'TWSE',
        currency: 'TWD',
        country: country && country !== '台灣' ? country : '台灣',
        ipo: convertRocDate(record.上市日期),
        finnhubIndustry: record.產業類別?.trim() || undefined,
        weburl: normalizeWebsite(record.網址),
    };
};

export const getTaiwanSnapshotBundle = async (symbol: string) => {
    const [profile, quote, candles] = await Promise.all([
        getTaiwanCompanyProfile(symbol),
        getTaiwanRealtimeQuote(symbol),
        getTaiwanStockCandles(symbol, { count: 240 }),
    ]);

    return {
        profile,
        quote,
        candles: candles.candles,
        candleIssue: candles.reason,
    };
};
