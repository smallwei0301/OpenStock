'use server';

import { cache } from 'react';

import { extractTaiwanStockCode } from '@/lib/utils';

const TWSE_BASE_URL = 'https://openapi.twse.com.tw/v1';
const TWSE_LEGACY_BASE_URL = 'https://www.twse.com.tw';
const TWSE_REQUEST_TIMEOUT_MS = 2500;
const TWSE_SNAPSHOT_TIMEOUT_MS = 6000;
const TWSE_REQUEST_HEADERS: Record<string, string> = {
    'User-Agent': 'Lazybacktest/1.0 (+https://lazybacktest.com)',
    Accept: 'application/json',
    'Accept-Language': 'zh-TW,zh;q=0.9',
    Referer: 'https://lazybacktest.com/',
};

const FUGLE_BASE_URL = 'https://api.fugle.tw/realtime/v0.3';
const FUGLE_REQUEST_TIMEOUT_MS = 2500;
const FUGLE_REQUEST_HEADERS: Record<string, string> = {
    'User-Agent': 'Lazybacktest/1.0 (+https://lazybacktest.com)',
    Accept: 'application/json',
};

const TRADINGVIEW_SYMBOL_BASE_URL = 'https://www.tradingview.com/symbols';
const TRADINGVIEW_SCAN_URL = 'https://scanner.tradingview.com/taiwan/scan';
const TRADINGVIEW_REQUEST_TIMEOUT_MS = 3000;
const TRADINGVIEW_REQUEST_HEADERS: Record<string, string> = {
    'User-Agent': 'Lazybacktest/1.0 (+https://lazybacktest.com)',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
    Origin: 'https://www.tradingview.com',
    Referer: 'https://www.tradingview.com/',
};

class TwseFetchError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'TwseFetchError';
        this.status = status;
    }
}

class FugleFetchError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'FugleFetchError';
        this.status = status;
    }
}

class TradingViewFetchError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'TradingViewFetchError';
        this.status = status;
    }
}

type FetchOptions = {
    searchParams?: Record<string, string>;
    revalidate?: number;
    cacheMode?: RequestCache;
    includeResponseParam?: boolean;
};

const isAbortError = (error: unknown): boolean =>
    !!error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError';

type FugleQuoteResponse = {
    data?: {
        quote?: {
            priceInformation?: Record<string, unknown>;
            price?: Record<string, unknown>;
            change?: Record<string, unknown>;
            [key: string]: unknown;
        } | null;
        meta?: Record<string, unknown> | null;
        info?: Record<string, unknown> | null;
    } | null;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined => {
    if (!value || typeof value !== 'object') {
        return undefined;
    }
    return value as Record<string, unknown>;
};

const TRADINGVIEW_SCAN_COLUMNS = [
    'close',
    'open',
    'high',
    'low',
    'volume',
    'change',
    'change_abs',
    'change_percent',
] as const;

const TRADINGVIEW_SCAN_COLUMN_INDEX: Record<(typeof TRADINGVIEW_SCAN_COLUMNS)[number], number> =
    TRADINGVIEW_SCAN_COLUMNS.reduce(
        (acc, column, index) => {
            acc[column] = index;
            return acc;
        },
        {} as Record<(typeof TRADINGVIEW_SCAN_COLUMNS)[number], number>,
    );

const parseTradingViewNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string') {
        const sanitized = value.replace(/,/g, '').trim();
        if (!sanitized) {
            return undefined;
        }
        const parsed = Number.parseFloat(sanitized);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const parseTradingViewTimestamp = (value: unknown): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        const seconds = value > 10_000_000_000 ? Math.floor(value / 1000) : Math.floor(value);
        return Number.isFinite(seconds) ? seconds : undefined;
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return undefined;
        const numeric = Number.parseFloat(trimmed);
        if (Number.isFinite(numeric)) {
            const seconds = numeric > 10_000_000_000 ? Math.floor(numeric / 1000) : Math.floor(numeric);
            return Number.isFinite(seconds) ? seconds : undefined;
        }
        const normalized = trimmed.replace(/\//g, '-');
        const millis = Date.parse(/\d{4}-\d{2}-\d{2}T/.test(normalized) ? normalized : `${normalized} GMT+08:00`);
        if (!Number.isNaN(millis)) {
            return Math.floor(millis / 1000);
        }
    }
    return undefined;
};

const normalizeTradingViewSymbol = (value: string): string =>
    value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/－|﹣|–|—/g, '-')
        .replace(/::+/g, ':');

const buildTradingViewSymbolVariants = (stockCode: string): Set<string> => {
    const normalizedCode = stockCode.trim().toUpperCase();
    return new Set([
        `TWSE:${normalizedCode}`,
        `TWSE-${normalizedCode}`,
        `TWSE.${normalizedCode}`,
        `${normalizedCode}.TW`,
        `${normalizedCode}-TW`,
        `${normalizedCode}`,
    ]);
};

const TRADINGVIEW_SYMBOL_KEYS = [
    'symbol',
    'symbolId',
    'symbol_id',
    'symbolName',
    'symbol_name',
    'symbolFull',
    'symbol_full',
    'ticker',
    'tickerId',
    'ticker_id',
    'shortName',
    'short_name',
    'name',
    'code',
    'proName',
    'pro_name',
    'id',
] as const;

const pickTradingViewNumberFromSources = (
    sources: (Record<string, unknown> | undefined)[],
    keys: readonly string[],
): number | undefined => {
    for (const source of sources) {
        if (!source) continue;
        for (const key of keys) {
            const parsed = parseTradingViewNumber(source[key]);
            if (parsed !== undefined) {
                return parsed;
            }
        }
    }
    return undefined;
};

const pickTradingViewTimestampFromSources = (
    sources: (Record<string, unknown> | undefined)[],
    keys: readonly string[],
): number | undefined => {
    for (const source of sources) {
        if (!source) continue;
        for (const key of keys) {
            const parsed = parseTradingViewTimestamp(source[key]);
            if (parsed !== undefined) {
                return parsed;
            }
        }
    }
    return undefined;
};

const TRADINGVIEW_CLOSE_KEYS = [
    'lp',
    'lastPrice',
    'last_price',
    'last',
    'close',
    'closePrice',
    'close_price',
    'price',
    'value',
    'c',
] as const;

const TRADINGVIEW_OPEN_KEYS = ['open', 'openPrice', 'open_price', 'o'] as const;
const TRADINGVIEW_HIGH_KEYS = ['high', 'highPrice', 'high_price', 'h'] as const;
const TRADINGVIEW_LOW_KEYS = ['low', 'lowPrice', 'low_price', 'l'] as const;
const TRADINGVIEW_PREV_CLOSE_KEYS = [
    'prev',
    'prevClose',
    'prev_close',
    'previousClose',
    'previous_close',
    'pc',
    'reference',
    'referencePrice',
    'ref',
    'yesterdayClose',
    'yesterday_close',
] as const;
const TRADINGVIEW_CHANGE_KEYS = [
    'change',
    'change_abs',
    'ch',
    'diff',
    'delta',
    'last_change',
    'price_change',
] as const;
const TRADINGVIEW_PERCENT_KEYS = [
    'change_percent',
    'chp',
    'percent',
    'last_change_percent',
    'changeRate',
    'change_rate',
] as const;
const TRADINGVIEW_TIMESTAMP_KEYS = [
    'lp_time',
    'time',
    'timestamp',
    'updated',
    'update_time',
    'last_update_time',
    'lastUpdated',
    'last_updated',
    'lastTradeTime',
    'tradeTime',
    'trade_time',
    'lasttime',
    'lastTimestamp',
    't',
] as const;

const gatherTradingViewSources = (record: Record<string, unknown>): Record<string, unknown>[] => {
    const sources: Record<string, unknown>[] = [record];
    for (const value of Object.values(record)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        sources.push(value as Record<string, unknown>);
    }
    return sources;
};

const extractQuoteFromTradingViewRecord = (
    record: Record<string, unknown>,
    targetSymbols: Set<string>,
): QuoteData | null => {
    const symbolValues: string[] = [];
    for (const key of TRADINGVIEW_SYMBOL_KEYS) {
        const value = record[key];
        if (typeof value === 'string' && value.trim()) {
            symbolValues.push(value);
        }
    }

    if (
        symbolValues.length === 0 ||
        !symbolValues.some((raw) => {
            const normalized = normalizeTradingViewSymbol(raw);
            return targetSymbols.has(normalized) || targetSymbols.has(normalized.replace(/-/g, ':'));
        })
    ) {
        return null;
    }

    const sources = gatherTradingViewSources(record);
    const close = pickTradingViewNumberFromSources(sources, TRADINGVIEW_CLOSE_KEYS);
    const open = pickTradingViewNumberFromSources(sources, TRADINGVIEW_OPEN_KEYS);
    const high = pickTradingViewNumberFromSources(sources, TRADINGVIEW_HIGH_KEYS);
    const low = pickTradingViewNumberFromSources(sources, TRADINGVIEW_LOW_KEYS);
    let previousClose = pickTradingViewNumberFromSources(sources, TRADINGVIEW_PREV_CLOSE_KEYS);
    const change = pickTradingViewNumberFromSources(sources, TRADINGVIEW_CHANGE_KEYS);
    let percent = pickTradingViewNumberFromSources(sources, TRADINGVIEW_PERCENT_KEYS);
    const timestamp = pickTradingViewTimestampFromSources(sources, TRADINGVIEW_TIMESTAMP_KEYS);

    if (previousClose === undefined && change !== undefined && close !== undefined) {
        previousClose = close - change;
    }

    if (
        percent === undefined &&
        change !== undefined &&
        previousClose !== undefined &&
        previousClose !== 0
    ) {
        percent = (change / previousClose) * 100;
    }

    if (
        previousClose === undefined &&
        close !== undefined &&
        percent !== undefined &&
        percent > -100
    ) {
        const denominator = 1 + percent / 100;
        if (denominator !== 0) {
            previousClose = close / denominator;
        }
    }

    if (close === undefined && open === undefined && high === undefined && low === undefined) {
        return null;
    }

    return {
        c: close,
        o: open,
        h: high,
        l: low,
        pc: previousClose,
        dp: percent,
        t: timestamp,
    } satisfies QuoteData;
};

const extractQuoteFromTradingViewState = (state: unknown, stockCode: string): QuoteData | null => {
    if (!state || typeof state !== 'object') {
        return null;
    }

    const targetSymbols = buildTradingViewSymbolVariants(stockCode);
    const visited = new Set<object>();
    const queue: unknown[] = [state];

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || typeof current !== 'object') {
            continue;
        }

        if (visited.has(current as object)) {
            continue;
        }
        visited.add(current as object);

        if (Array.isArray(current)) {
            for (const value of current) {
                queue.push(value);
            }
            continue;
        }

        const record = current as Record<string, unknown>;
        const quote = extractQuoteFromTradingViewRecord(record, targetSymbols);
        if (quote) {
            return quote;
        }

        for (const value of Object.values(record)) {
            queue.push(value);
        }
    }

    return null;
};

const parseFugleNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === 'string') {
        const sanitized = value.replace(/,/g, '').trim();
        if (!sanitized) return undefined;
        const parsed = Number.parseFloat(sanitized);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
};

const pickFugleNumber = (source: Record<string, unknown> | undefined | null, keys: string[]): number | undefined => {
    if (!source) return undefined;
    for (const key of keys) {
        const parsed = parseFugleNumber(source[key]);
        if (parsed !== undefined) {
            return parsed;
        }
    }
    return undefined;
};

const pickFugleNumberFromSources = (
    sources: (Record<string, unknown> | undefined | null)[],
    keys: string[],
): number | undefined => {
    for (const source of sources) {
        const parsed = pickFugleNumber(source, keys);
        if (parsed !== undefined) {
            return parsed;
        }
    }
    return undefined;
};

const parseFugleTimestamp = (
    meta: Record<string, unknown> | undefined | null,
    quote: Record<string, unknown> | undefined | null = undefined,
    info: Record<string, unknown> | undefined | null = undefined,
): number | undefined => {
    const metaRecord = (asRecord(meta) ?? {}) as Record<string, unknown>;
    const infoRecord = asRecord(info);
    const quoteRecord = asRecord(quote);
    const tradeRecord = asRecord(quoteRecord?.['trade']);

    const directCandidate =
        metaRecord.lastUpdatedAt ??
        metaRecord.lastUpdateAt ??
        metaRecord.lastUpdated ??
        metaRecord.lastUpdateTime ??
        metaRecord.lastUpdatedTime ??
        infoRecord?.lastUpdatedAt ??
        infoRecord?.lastUpdateAt ??
        infoRecord?.lastUpdated ??
        infoRecord?.lastUpdateTime ??
        infoRecord?.lastUpdatedTime ??
        null;

    const resolveFromValue = (value: unknown): number | undefined => {
        if (value === undefined || value === null) return undefined;
        if (typeof value === 'number') {
            const millis = value > 10_000_000_000 ? value : value * 1000;
            return Number.isFinite(millis) ? Math.floor(millis / 1000) : undefined;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (!trimmed) return undefined;
            const hasTimezone = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(trimmed);
            const normalized = trimmed.replace(/\//g, '-');
            const candidate = hasTimezone ? normalized : `${normalized} GMT+08:00`;
            const millis = Date.parse(candidate);
            if (!Number.isNaN(millis)) {
                return Math.floor(millis / 1000);
            }
        }
        return undefined;
    };

    const resolvedDirect = resolveFromValue(directCandidate);
    if (resolvedDirect !== undefined) {
        return resolvedDirect;
    }

    const additionalCandidates: unknown[] = [];
    const pushCandidate = (value: unknown) => {
        if (value !== undefined && value !== null) {
            additionalCandidates.push(value);
        }
    };

    [metaRecord.timestamp, metaRecord.t].forEach(pushCandidate);
    const pushFields = (source: Record<string, unknown> | undefined, keys: string[]) => {
        if (!source) return;
        keys.forEach((key) => pushCandidate(source[key]));
    };
    pushFields(infoRecord, ['timestamp', 't', 'time', 'lastTradeTime', 'lastUpdatedTime']);
    pushFields(quoteRecord, [
        'lastUpdatedAt',
        'lastUpdateAt',
        'lastUpdated',
        'lastUpdatedTime',
        'lastUpdateTime',
        'timestamp',
        't',
    ]);
    pushFields(tradeRecord, ['timestamp', 't', 'time', 'at']);

    for (const candidate of additionalCandidates) {
        const resolved = resolveFromValue(candidate);
        if (resolved !== undefined) {
            return resolved;
        }
    }

    const resolveFromDateParts = (dateValue: unknown, timeValue: unknown): number | undefined => {
        if (typeof dateValue !== 'string') {
            return undefined;
        }

        const sanitizedDate = dateValue.replace(/\//g, '-').trim();
        if (!sanitizedDate) {
            return undefined;
        }

        const timeString = typeof timeValue === 'string' && timeValue.trim() ? timeValue.trim() : '15:00:00';
        const candidate = `${sanitizedDate}T${timeString}`;
        const hasTimezone = /[zZ]|[+\-]\d{2}:?\d{2}$/.test(candidate);
        const millis = Date.parse(hasTimezone ? candidate : `${candidate} GMT+08:00`);
        if (!Number.isNaN(millis)) {
            return Math.floor(millis / 1000);
        }
        return undefined;
    };

    const dateValue =
        metaRecord.date ??
        infoRecord?.date ??
        quoteRecord?.['date'] ??
        quoteRecord?.['Date'] ??
        quoteRecord?.['tradeDate'] ??
        quoteRecord?.['TradeDate'] ??
        quoteRecord?.['lastTradeDate'] ??
        quoteRecord?.['day'] ??
        tradeRecord?.['date'] ??
        tradeRecord?.['tradeDate'];
    const timeValue =
        metaRecord.time ??
        metaRecord.lastTradeTime ??
        metaRecord.lastUpdatedTime ??
        infoRecord?.['time'] ??
        infoRecord?.['lastTradeTime'] ??
        infoRecord?.['lastUpdatedTime'] ??
        quoteRecord?.['time'] ??
        quoteRecord?.['Time'] ??
        quoteRecord?.['tradeTime'] ??
        quoteRecord?.['TradeTime'] ??
        quoteRecord?.['lastTradeTime'] ??
        quoteRecord?.['updatedTime'] ??
        tradeRecord?.['time'] ??
        tradeRecord?.['t'] ??
        tradeRecord?.['at'];
    const resolvedFromParts = resolveFromDateParts(dateValue, timeValue);
    if (resolvedFromParts !== undefined) {
        return resolvedFromParts;
    }

    return undefined;
};

const toQuoteDataFromFugle = (payload: FugleQuoteResponse | null | undefined): QuoteData | null => {
    if (!payload?.data?.quote) {
        return null;
    }

    const rawQuote = payload.data.quote as
        | (Record<string, unknown> & {
              priceInformation?: Record<string, unknown> | null;
              price?: Record<string, unknown> | null;
              change?: Record<string, unknown> | null;
              trade?: Record<string, unknown> | null;
              trial?: Record<string, unknown> | null;
              order?: Record<string, unknown> | null;
          })
        | null
        | undefined;

    const infoBlock = payload.data.info ?? undefined;
    const priceInfo = rawQuote?.priceInformation ?? undefined;
    const priceBlock = rawQuote?.price ?? undefined;
    const changeInfo = rawQuote?.change ?? undefined;
    const tradeInfo = rawQuote?.trade ?? undefined;
    const trialInfo = rawQuote?.trial ?? undefined;
    const orderInfo = rawQuote?.order ?? undefined;

    const priceSources = [tradeInfo, priceInfo, priceBlock, rawQuote, trialInfo, orderInfo].map(asRecord);
    const changeSources = [changeInfo, tradeInfo, priceInfo, priceBlock, rawQuote, trialInfo, orderInfo].map(asRecord);

    const close = pickFugleNumberFromSources(priceSources, [
        'lastTradedPrice',
        'lastPrice',
        'price',
        'close',
        'closePrice',
        'closingPrice',
        'latestPrice',
        'tradePrice',
        'currentPrice',
        'last',
        'ClosePrice',
        'LatestPrice',
        'Close',
    ]);
    const open = pickFugleNumberFromSources(priceSources, ['openPrice', 'openingPrice', 'open', 'Open', 'OpenPrice']);
    const high = pickFugleNumberFromSources(priceSources, ['highPrice', 'highestPrice', 'high', 'High', 'HighPrice']);
    const low = pickFugleNumberFromSources(priceSources, ['lowPrice', 'lowestPrice', 'low', 'Low', 'LowPrice']);
    const previousClose = pickFugleNumberFromSources(priceSources, [
        'referencePrice',
        'reference',
        'previousClosePrice',
        'yesterdayClosePrice',
        'prevClose',
        'preClose',
        'lastClosePrice',
        'Reference',
    ]);
    const change = pickFugleNumberFromSources(changeSources, ['priceChange', 'changePrice', 'price', 'change', 'difference']);
    let percent = pickFugleNumberFromSources(changeSources, [
        'percent',
        'percentChange',
        'changeRate',
        'priceChangePercent',
        'changePercent',
        'percentage',
    ]);

    if (percent === undefined && change !== undefined && previousClose !== undefined && previousClose !== 0) {
        percent = (change / previousClose) * 100;
    }

    if (
        close === undefined &&
        open === undefined &&
        high === undefined &&
        low === undefined &&
        previousClose === undefined
    ) {
        return null;
    }

    const timestamp =
        parseFugleTimestamp(payload.data?.meta, rawQuote ?? undefined, infoBlock ?? undefined) ??
        Math.floor(Date.now() / 1000);

    return {
        c: close,
        o: open,
        h: high,
        l: low,
        pc: previousClose,
        dp: percent,
        t: timestamp,
    } satisfies QuoteData;
};

const withTimeoutFallback = async <T>(promise: Promise<T>, fallback: T, timeoutMs: number): Promise<T> => {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<T>((resolve) => {
        timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('withTimeoutFallback error:', error);
        }
        return fallback;
    } finally {
        if (timeoutHandle) {
            clearTimeout(timeoutHandle);
        }
        promise.catch(() => undefined);
    }
};

const fetchTwseJSON = async <T>(path: string, options: FetchOptions = {}): Promise<T> => {
    const url = new URL(`${TWSE_BASE_URL}/${path.replace(/^\//, '')}`);
    const params =
        options.includeResponseParam === false ? { ...options.searchParams } : { response: 'json', ...options.searchParams };
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

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (controller) {
        timeout = setTimeout(() => controller.abort(), TWSE_REQUEST_TIMEOUT_MS);
        init.signal = controller.signal;
    }

    try {
        const res = await fetch(url.toString(), init);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new TwseFetchError(`TWSE fetch failed ${res.status}: ${text}`, res.status);
        }

        return (await res.json()) as T;
    } catch (error) {
        if (error instanceof TwseFetchError) {
            throw error;
        }

        if (isAbortError(error)) {
            throw new TwseFetchError(`TWSE fetch timeout after ${TWSE_REQUEST_TIMEOUT_MS}ms`, 408);
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TwseFetchError(`TWSE fetch network error: ${message}`, 503);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
};

type TradingViewScanResponse = {
    data?: { s?: string; d?: unknown[] }[];
};

const fetchTradingViewQuoteFromScanner = async (stockCode: string): Promise<QuoteData | null> => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const symbol = `TWSE:${stockCode.toUpperCase()}`;

    const init: RequestInit = {
        method: 'POST',
        headers: {
            ...TRADINGVIEW_REQUEST_HEADERS,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        body: JSON.stringify({
            symbols: { tickers: [symbol], query: { types: [] } },
            columns: TRADINGVIEW_SCAN_COLUMNS,
        }),
    };

    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (controller) {
        timeout = setTimeout(() => controller.abort(), TRADINGVIEW_REQUEST_TIMEOUT_MS);
        init.signal = controller.signal;
    }

    try {
        const res = await fetch(TRADINGVIEW_SCAN_URL, init);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new TradingViewFetchError(`TradingView scan failed ${res.status}: ${text}`, res.status);
        }

        const payload = (await res.json()) as TradingViewScanResponse;
        if (!payload?.data || !Array.isArray(payload.data)) {
            return null;
        }

        const entry = payload.data.find((item) => typeof item?.s === 'string' && item.s.toUpperCase() === symbol);
        if (!entry || !Array.isArray(entry.d)) {
            return null;
        }

        const values = entry.d;
        const getColumnValue = (column: (typeof TRADINGVIEW_SCAN_COLUMNS)[number]) => {
            const index = TRADINGVIEW_SCAN_COLUMN_INDEX[column];
            if (index === undefined || index < 0 || index >= values.length) {
                return undefined;
            }
            return values[index];
        };

        const close = parseTradingViewNumber(getColumnValue('close'));
        const open = parseTradingViewNumber(getColumnValue('open'));
        const high = parseTradingViewNumber(getColumnValue('high'));
        const low = parseTradingViewNumber(getColumnValue('low'));
        const change = parseTradingViewNumber(getColumnValue('change'));
        const absoluteChange = parseTradingViewNumber(getColumnValue('change_abs'));
        let percent = parseTradingViewNumber(getColumnValue('change_percent'));
        let previousClose: number | undefined;

        if (close !== undefined && absoluteChange !== undefined) {
            previousClose = close - absoluteChange;
        } else if (close !== undefined && change !== undefined) {
            previousClose = close - change;
        }

        if (
            percent === undefined &&
            change !== undefined &&
            previousClose !== undefined &&
            previousClose !== 0
        ) {
            percent = (change / previousClose) * 100;
        }

        if (
            previousClose === undefined &&
            close !== undefined &&
            percent !== undefined &&
            percent > -100
        ) {
            const denominator = 1 + percent / 100;
            if (denominator !== 0) {
                previousClose = close / denominator;
            }
        }

        if (close === undefined && open === undefined && high === undefined && low === undefined) {
            return null;
        }

        return {
            c: close,
            o: open,
            h: high,
            l: low,
            pc: previousClose,
            dp: percent,
            t: Math.floor(Date.now() / 1000),
        } satisfies QuoteData;
    } catch (error) {
        if (error instanceof TradingViewFetchError) {
            throw error;
        }

        if (isAbortError(error)) {
            throw new TradingViewFetchError(
                `TradingView scan timeout after ${TRADINGVIEW_REQUEST_TIMEOUT_MS}ms`,
                408,
            );
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TradingViewFetchError(`TradingView scan network error: ${message}`, 503);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
};

const extractTradingViewStateFromHtml = (html: string): unknown => {
    const marker = 'window.__PRELOADED_STATE__=';
    const startIndex = html.indexOf(marker);
    if (startIndex === -1) {
        return null;
    }

    const jsonStart = startIndex + marker.length;
    const endIndex = html.indexOf('</script>', jsonStart);
    if (endIndex === -1) {
        return null;
    }

    let jsonText = html.slice(jsonStart, endIndex).trim();
    if (jsonText.endsWith(';')) {
        jsonText = jsonText.slice(0, -1);
    }

    try {
        return JSON.parse(jsonText);
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Failed to parse TradingView preloaded state:', error);
        }
        return null;
    }
};

const fetchTradingViewQuoteFromHtml = async (stockCode: string): Promise<QuoteData | null> => {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const url = `${TRADINGVIEW_SYMBOL_BASE_URL}/TWSE-${stockCode}/`;
    const init: RequestInit = {
        headers: TRADINGVIEW_REQUEST_HEADERS,
        cache: 'no-store',
    };

    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (controller) {
        timeout = setTimeout(() => controller.abort(), TRADINGVIEW_REQUEST_TIMEOUT_MS);
        init.signal = controller.signal;
    }

    try {
        const res = await fetch(url, init);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new TradingViewFetchError(`TradingView page fetch failed ${res.status}: ${text}`, res.status);
        }

        const html = await res.text();
        const state = extractTradingViewStateFromHtml(html);
        if (!state) {
            return null;
        }

        return extractQuoteFromTradingViewState(state, stockCode);
    } catch (error) {
        if (error instanceof TradingViewFetchError) {
            throw error;
        }

        if (isAbortError(error)) {
            throw new TradingViewFetchError(
                `TradingView page fetch timeout after ${TRADINGVIEW_REQUEST_TIMEOUT_MS}ms`,
                408,
            );
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TradingViewFetchError(`TradingView page fetch network error: ${message}`, 503);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
};

const fetchTradingViewQuote = async (stockCode: string): Promise<QuoteData | null> => {
    try {
        const scanQuote = await fetchTradingViewQuoteFromScanner(stockCode);
        if (scanQuote) {
            return scanQuote;
        }
    } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('fetchTradingViewQuoteFromScanner error:', { stockCode, error });
        }
    }

    try {
        return await fetchTradingViewQuoteFromHtml(stockCode);
    } catch (error) {
        if (error instanceof TradingViewFetchError) {
            throw error;
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TradingViewFetchError(`TradingView fetch failed: ${message}`);
    }
};

const fetchFugleRealtimeQuote = async (stockCode: string): Promise<QuoteData | null> => {
    const apiKey = process.env.fugle_api_key;
    if (!apiKey) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('Fugle API key is not configured (fugle_api_key).');
        }
        return null;
    }

    const url = new URL(`${FUGLE_BASE_URL}/intraday/quote`);
    url.searchParams.set('symbolId', stockCode);
    url.searchParams.set('apiToken', apiKey);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    const init: RequestInit = {
        headers: FUGLE_REQUEST_HEADERS,
        cache: 'no-store',
    };

    let timeout: ReturnType<typeof setTimeout> | undefined;
    if (controller) {
        timeout = setTimeout(() => controller.abort(), FUGLE_REQUEST_TIMEOUT_MS);
        init.signal = controller.signal;
    }

    try {
        const res = await fetch(url.toString(), init);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new FugleFetchError(`Fugle fetch failed ${res.status}: ${text}`, res.status);
        }

        const payload = (await res.json()) as FugleQuoteResponse;
        return toQuoteDataFromFugle(payload);
    } catch (error) {
        if (error instanceof FugleFetchError) {
            throw error;
        }
        if (isAbortError(error)) {
            throw new FugleFetchError(`Fugle fetch timeout after ${FUGLE_REQUEST_TIMEOUT_MS}ms`, 408);
        }
        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new FugleFetchError(`Fugle fetch network error: ${message}`, 503);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
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

const PLACEHOLDER_PATTERN = /^(?:[-–—﹣－─‒―]+|N\/?A|na|x|\u00d7|休市|暫停|除權息)$/i;

const toHalfWidth = (input: string): string =>
    input
        .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
        .replace(/　/g, ' ');

const parseTwseNumber = (value?: string | number | null): number | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }

    const normalized = toHalfWidth(value.replace(/,/g, '').trim());
    if (!normalized) return undefined;
    if (PLACEHOLDER_PATTERN.test(normalized)) {
        return undefined;
    }

    if (!/[0-9]/.test(normalized)) {
        return undefined;
    }

    const numericCandidate = normalized.replace(/[^\d+\-\.eE]/g, '');
    if (!numericCandidate) {
        return undefined;
    }

    const parsed = Number.parseFloat(numericCandidate);
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

type TwseLegacyDailyResponse = {
    stat?: string;
    data?: string[][];
    fields?: string[];
};

const normalizeLegacyRecord = (fields: string[] | undefined, row: string[]): TwseDailyRecord | undefined => {
    if (!Array.isArray(row) || row.length === 0) return undefined;

    const safeGet = (index: number | undefined, fallbackIndex?: number) => {
        if (index !== undefined && index >= 0 && index < row.length) {
            return row[index];
        }
        if (fallbackIndex !== undefined && fallbackIndex >= 0 && fallbackIndex < row.length) {
            return row[fallbackIndex];
        }
        return undefined;
    };

    const resolveIndex = (label: string, defaultIndex: number) => {
        if (Array.isArray(fields)) {
            const index = fields.indexOf(label);
            if (index >= 0) {
                return index;
            }
        }
        return defaultIndex;
    };

    const date = safeGet(resolveIndex('日期', 0), 0);
    const volume = safeGet(resolveIndex('成交股數', 1), 1);
    const open = safeGet(resolveIndex('開盤價', 3), 3);
    const high = safeGet(resolveIndex('最高價', 4), 4);
    const low = safeGet(resolveIndex('最低價', 5), 5);
    const close = safeGet(resolveIndex('收盤價', 6), 6);

    if (!date) return undefined;

    return {
        Date: date,
        Volume: volume ?? '',
        Open: open ?? '',
        High: high ?? '',
        Low: low ?? '',
        Close: close ?? '',
    } satisfies TwseDailyRecord;
};

const fetchLegacyMonthlyDailyRecords = async (stockCode: string, dateParam: string) => {
    const url = new URL(`${TWSE_LEGACY_BASE_URL}/exchangeReport/STOCK_DAY`);
    url.searchParams.set('response', 'json');
    url.searchParams.set('date', dateParam);
    url.searchParams.set('stockNo', stockCode);

    const init: RequestInit = { headers: TWSE_REQUEST_HEADERS, cache: 'no-store' };
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (controller) {
        timeout = setTimeout(() => controller.abort(), TWSE_REQUEST_TIMEOUT_MS);
        init.signal = controller.signal;
    }

    try {
        const res = await fetch(url.toString(), init);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new TwseFetchError(`TWSE legacy fetch failed ${res.status}: ${text}`, res.status);
        }

        const payload = (await res.json()) as TwseLegacyDailyResponse;
        if (!payload || payload.stat !== 'OK' || !Array.isArray(payload.data)) {
            return [];
        }

        const fields = Array.isArray(payload.fields) ? payload.fields : undefined;
        const records: TwseDailyRecord[] = [];
        for (const row of payload.data) {
            const record = normalizeLegacyRecord(fields, row);
            if (record) {
                records.push(record);
            }
        }

        return records;
    } catch (error) {
        if (error instanceof TwseFetchError) {
            throw error;
        }

        if (isAbortError(error)) {
            throw new TwseFetchError(`TWSE legacy fetch timeout after ${TWSE_REQUEST_TIMEOUT_MS}ms`, 408);
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        throw new TwseFetchError(`TWSE legacy fetch network error: ${message}`, 503);
    } finally {
        if (timeout) {
            clearTimeout(timeout);
        }
    }
};

const fetchMonthlyDailyRecords = async (stockCode: string, dateParam: string) => {
    try {
        const data = await fetchTwseJSON<TwseDailyResponse>('exchangeReport/STOCK_DAY', {
            searchParams: { stockNo: stockCode, date: dateParam },
            revalidate: 900,
        });

        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (error instanceof TwseFetchError) {
            if (error.status === 429) {
                throw error;
            }

            if (error.status === 404 || error.status === 400) {
                return [];
            }
        }

        try {
            return await fetchLegacyMonthlyDailyRecords(stockCode, dateParam);
        } catch (legacyError) {
            if (legacyError instanceof TwseFetchError && legacyError.status === 429) {
                throw legacyError;
            }
            throw legacyError instanceof Error ? legacyError : new Error('TWSE legacy fetch failed');
        }
    }
};

const MAX_MONTHS_TO_FETCH = 18;
const MONTHLY_FETCH_BATCH_SIZE = 3;
const CANDLE_BUFFER_RATIO = 1.25;
const CANDLE_BUFFER_MIN_EXTRA = 60;

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
        const desiredCandleCount = Math.max(
            Math.floor(targetCount * CANDLE_BUFFER_RATIO),
            targetCount + CANDLE_BUFFER_MIN_EXTRA,
        );
        const toTimestamp = options.to ?? Math.floor(Date.now() / 1000);
        const toDate = new Date(toTimestamp * 1000);
        const collected: CandleDatum[] = [];
        let encounteredNetworkIssue = false;
        let consecutiveNetworkFailures = 0;
        const MAX_CONSECUTIVE_NETWORK_FAILURES = 1;
        const monthParams: string[] = [];

        for (let offset = 0; offset < MAX_MONTHS_TO_FETCH; offset++) {
            const cursor = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth() - offset, 1));
            const dateParam = `${cursor.getUTCFullYear()}${String(cursor.getUTCMonth() + 1).padStart(2, '0')}01`;
            monthParams.push(dateParam);
        }

        for (
            let index = 0;
            index < monthParams.length && collected.length < desiredCandleCount;
            index += MONTHLY_FETCH_BATCH_SIZE
        ) {
            const batch = monthParams.slice(index, index + MONTHLY_FETCH_BATCH_SIZE);
            const results = await Promise.allSettled(
                batch.map((dateParam) => fetchMonthlyDailyRecords(stockCode, dateParam)),
            );

            let batchNetworkFailures = 0;
            let batchRecordedSuccess = false;

            for (let resultIndex = 0; resultIndex < results.length; resultIndex++) {
                const outcome = results[resultIndex];
                const dateParam = batch[resultIndex];

                if (outcome.status === 'fulfilled') {
                    const records = outcome.value;
                    if (records.length > 0) {
                        batchRecordedSuccess = true;
                        consecutiveNetworkFailures = 0;

                        for (const record of records) {
                            const candle = toCandleDatum(record);
                            if (!candle) continue;
                            collected.push(candle);
                        }
                    }
                    continue;
                }

                const error = outcome.reason;

                if (error instanceof TwseFetchError) {
                    if (error.status === 429) {
                        return { candles: [], reason: 'rate-limit' };
                    }

                    if (error.status === 404 || error.status === 400) {
                        continue;
                    }
                }

                encounteredNetworkIssue = true;
                batchNetworkFailures += 1;

                if (process.env.NODE_ENV !== 'production') {
                    console.warn('fetchMonthlyDailyRecords error:', {
                        stockCode,
                        dateParam,
                        error,
                    });
                }
            }

            if (batchNetworkFailures === batch.length) {
                consecutiveNetworkFailures += 1;
            } else if (batchRecordedSuccess) {
                consecutiveNetworkFailures = 0;
            }

            if (consecutiveNetworkFailures >= MAX_CONSECUTIVE_NETWORK_FAILURES) {
                break;
            }
        }

        const normalized = uniqueCandles(collected)
            .filter((candle) => candle.time <= toTimestamp)
            .sort((a, b) => a.time - b.time);

        if (normalized.length === 0) {
            return { candles: [], reason: encounteredNetworkIssue ? 'network-error' : 'no-data' };
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
        if (error instanceof TwseFetchError) {
            throw error;
        }
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

const parseTwseDateTimeParts = (datePart?: string, timePart?: string): number | undefined => {
    if (!timePart) return undefined;
    let normalizedTime = timePart.trim();
    if (!normalizedTime) return undefined;

    if (/^\d{6}$/.test(normalizedTime)) {
        normalizedTime = `${normalizedTime.slice(0, 2)}:${normalizedTime.slice(2, 4)}:${normalizedTime.slice(4, 6)}`;
    } else if (/^\d{4}$/.test(normalizedTime)) {
        normalizedTime = `${normalizedTime.slice(0, 2)}:${normalizedTime.slice(2, 4)}:00`;
    } else if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
        normalizedTime = `${normalizedTime}:00`;
    }

    let isoDate: string | undefined;
    if (datePart) {
        const digits = datePart.replace(/[^0-9]/g, '');
        if (digits.length === 8) {
            isoDate = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
        }
    }

    if (!isoDate) {
        try {
            isoDate = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Taipei',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(new Date());
        } catch (error) {
            console.error('parseTwseDateTimeParts fallback date error:', error);
            const now = new Date();
            isoDate = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
        }
    }

    const candidate = `${isoDate}T${normalizedTime}+08:00`;
    const millis = Date.parse(candidate);
    if (Number.isNaN(millis)) {
        return undefined;
    }

    return Math.floor(millis / 1000);
};

type TwseSymbolRealtimeRecord = {
    c?: string;
    n?: string;
    z?: string;
    o?: string;
    h?: string;
    l?: string;
    y?: string;
    v?: string;
    tv?: string;
    t?: string;
    ts?: string;
    d?: string;
    tlong?: string | number;
    ch?: string;
    ex?: string;
    a?: string;
    b?: string;
    p?: string;
    pc?: string;
    u?: string;
    w?: string;
    m?: string;
    s?: string;
    i?: string;
    g?: string;
    f?: string;
    ip?: string;
};

type TwseSymbolRealtimePayload = {
    msgArray?: TwseSymbolRealtimeRecord[];
    data?: TwseSymbolRealtimeRecord[];
};

type TwseRealtimeAnyRecord = TwseRealtimeRecord | TwseSymbolRealtimeRecord;

const fetchRealtimeBySymbol = async (stockCode: string): Promise<TwseRealtimeAnyRecord | null> => {
    try {
        const payload = await fetchTwseJSON<TwseSymbolRealtimePayload | TwseSymbolRealtimeRecord[] | null>(
            'stock/api/getStockInfo.jsp',
            {
                searchParams: { stockNo: stockCode, response: 'json', json: '1', delay: '0' },
                cacheMode: 'no-store',
                includeResponseParam: false,
            },
        );

        if (!payload) return null;

        if (Array.isArray(payload)) {
            const directMatch = payload.find((entry) => {
                const value = (entry as TwseSymbolRealtimeRecord).c ?? (entry as TwseRealtimeRecord).Code;
                if (!value) return false;
                return value.replace(/\.TW$/i, '') === stockCode;
            });
            return (directMatch as TwseRealtimeAnyRecord | undefined) ?? null;
        }

        const candidates = Array.isArray(payload.msgArray)
            ? payload.msgArray
            : Array.isArray(payload.data)
              ? payload.data
              : [];

        const record = candidates.find((entry) => {
            const value = entry.c ?? (entry as TwseRealtimeRecord).Code;
            if (!value) return false;
            return value.replace(/\.TW$/i, '') === stockCode;
        });

        return (record as TwseRealtimeAnyRecord | undefined) ?? null;
    } catch (error) {
        if (error instanceof TwseFetchError) {
            throw error;
        }
        console.error('fetchRealtimeBySymbol error:', error);
        return null;
    }
};

const extractRecordValue = (record: TwseRealtimeAnyRecord, keys: string[]): string | number | undefined => {
    const source = record as Record<string, unknown>;
    for (const key of keys) {
        const value = source[key];
        if (value === undefined || value === null || value === '') continue;
        if (typeof value === 'string' || typeof value === 'number') {
            return value;
        }
    }
    return undefined;
};

const extractRecordString = (record: TwseRealtimeAnyRecord, keys: string[]): string | undefined => {
    const value = extractRecordValue(record, keys);
    if (value === undefined) return undefined;
    return typeof value === 'string' ? value : value.toString();
};

const toQuoteDataFromRealtimeRecord = (record: TwseRealtimeAnyRecord | null | undefined): QuoteData | null => {
    if (!record) return null;

    const close = parseTwseNumber(
        extractRecordValue(record, ['ClosingPrice', 'z', 'Price', 'TradePrice', 'Close', 'close', 'ClosePrice', 'closePrice']),
    );
    const open = parseTwseNumber(
        extractRecordValue(record, ['OpeningPrice', 'o', 'OpenPrice', 'Open', 'open', 'Opening', 'openingPrice']),
    );
    const high = parseTwseNumber(
        extractRecordValue(record, ['HighestPrice', 'h', 'HighPrice', 'High', 'high', 'highPrice']),
    );
    const low = parseTwseNumber(
        extractRecordValue(record, ['LowestPrice', 'l', 'LowPrice', 'Low', 'low', 'lowPrice']),
    );
    const change = parseTwseNumber(
        extractRecordValue(record, ['Change', 'PriceChange', 'diff', 'change', 'Chg', 'PriceDiff', 'priceChange']),
    );
    const changeRate = parseTwseNumber(
        extractRecordValue(record, ['ChangeRate', 'PriceChangeRate', 'p', 'pct', 'percent', 'ChangePercent', 'changePercent']),
    );
    const previousClose = parseTwseNumber(
        extractRecordValue(record, ['PreviousClose', 'y', 'ReferencePrice', 'pc', 'prevClose', 'PreviousPrice']),
    );

    const tlong = parseTwseNumber(extractRecordValue(record, ['tlong', 'timestamp', 'tLong']));
    let timestamp = tlong !== undefined ? Math.floor(tlong / 1000) : undefined;

    if (!timestamp) {
        const ts = extractRecordString(record, ['ts', 'TradeTime', 'LastUpdatedTime', 'time', 'Time']);
        timestamp = parseTwseTimestamp(ts);
    }

    if (!timestamp) {
        const tradeTime = extractRecordString(record, ['t', 'time', 'TradeTime']);
        const tradeDate = extractRecordString(record, ['d', 'date']);
        timestamp = parseTwseDateTimeParts(tradeDate, tradeTime);
    }

    const resolvedPreviousClose =
        previousClose !== undefined
            ? previousClose
            : close !== undefined && change !== undefined
              ? close - change
              : undefined;

    const resolvedChange =
        change !== undefined
            ? change
            : close !== undefined && resolvedPreviousClose !== undefined
              ? close - resolvedPreviousClose
              : undefined;

    const resolvedPercent =
        changeRate !== undefined
            ? changeRate
            : resolvedChange !== undefined && resolvedPreviousClose !== undefined && resolvedPreviousClose !== 0
              ? (resolvedChange / resolvedPreviousClose) * 100
              : undefined;

    if (
        close === undefined &&
        open === undefined &&
        high === undefined &&
        low === undefined &&
        resolvedPreviousClose === undefined
    ) {
        return null;
    }

    return {
        c: close,
        o: open,
        h: high,
        l: low,
        pc: resolvedPreviousClose,
        dp: resolvedPercent,
        t: timestamp,
    } satisfies QuoteData;
};

const hasCompleteSnapshot = (quote: QuoteData | null) => {
    if (!quote) return false;
    const required: (keyof QuoteData)[] = ['c', 'o', 'h', 'l', 'pc'];
    return required.every((key) => {
        const value = quote[key];
        return typeof value === 'number' && Number.isFinite(value);
    });
};

const mergeQuoteData = (...quotes: (QuoteData | null | undefined)[]): QuoteData | null => {
    const merged: Partial<QuoteData> = {};
    let hasCoreValue = false;
    let latestTimestamp: number | undefined;

    const assignIfMissing = (key: keyof QuoteData, value: number | undefined, trackCore = false) => {
        if (value === undefined || !Number.isFinite(value)) {
            return;
        }
        if (key === 't') {
            latestTimestamp = latestTimestamp === undefined ? value : Math.max(latestTimestamp, value);
            return;
        }
        if (merged[key] === undefined) {
            merged[key] = value;
            if (trackCore) {
                hasCoreValue = true;
            }
        }
    };

    for (const quote of quotes) {
        if (!quote) continue;
        assignIfMissing('c', quote.c, true);
        assignIfMissing('o', quote.o, true);
        assignIfMissing('h', quote.h, true);
        assignIfMissing('l', quote.l, true);
        assignIfMissing('pc', quote.pc, true);
        if (quote.dp !== undefined && Number.isFinite(quote.dp) && merged.dp === undefined) {
            merged.dp = quote.dp;
        }
        assignIfMissing('t', quote.t);
    }

    if (latestTimestamp !== undefined) {
        merged.t = latestTimestamp;
    }

    if (merged.dp === undefined && merged.c !== undefined && merged.pc !== undefined && merged.pc !== 0) {
        merged.dp = ((merged.c - merged.pc) / merged.pc) * 100;
    }

    return hasCoreValue ? (merged as QuoteData) : null;
};

const createQuoteFromCandles = (candles: CandleDatum[] | null | undefined): QuoteData | null => {
    if (!Array.isArray(candles) || candles.length === 0) {
        return null;
    }

    const validCandles = candles
        .filter((candle) =>
            candle &&
            Number.isFinite(candle.time) &&
            Number.isFinite(candle.open) &&
            Number.isFinite(candle.high) &&
            Number.isFinite(candle.low) &&
            Number.isFinite(candle.close),
        )
        .sort((a, b) => a.time - b.time);

    if (validCandles.length === 0) {
        return null;
    }

    const latest = validCandles[validCandles.length - 1];
    const previous = [...validCandles]
        .slice(0, -1)
        .reverse()
        .find((entry) => Number.isFinite(entry.close));

    const fallback: QuoteData = {
        c: latest.close,
        o: latest.open,
        h: latest.high,
        l: latest.low,
        pc: previous?.close ?? latest.close,
        t: latest.time,
    };

    if (
        fallback.dp === undefined &&
        fallback.c !== undefined &&
        Number.isFinite(fallback.c) &&
        fallback.pc !== undefined &&
        Number.isFinite(fallback.pc) &&
        fallback.pc !== 0
    ) {
        fallback.dp = ((fallback.c - fallback.pc) / fallback.pc) * 100;
    }

    return fallback;
};

const enrichQuoteWithCandles = (quote: QuoteData | null, candles: CandleDatum[] | null | undefined): QuoteData | null => {
    const candleQuote = createQuoteFromCandles(candles);
    if (!candleQuote) {
        return quote;
    }

    const merged = mergeQuoteData(quote, candleQuote);
    return merged ?? quote ?? candleQuote;
};

export const getTaiwanRealtimeQuote = async (symbol: string): Promise<QuoteData | null> => {
    const stockCode = extractTaiwanStockCode(symbol);
    if (!stockCode) {
        return null;
    }

    let quote: QuoteData | null = null;

    const incorporateQuote = (candidate: QuoteData | null) => {
        if (!candidate) return false;
        const merged = mergeQuoteData(candidate, quote);
        if (merged) {
            quote = merged;
        }
        return hasCompleteSnapshot(quote);
    };

    try {
        const tradingViewQuote = await fetchTradingViewQuote(stockCode);
        if (incorporateQuote(tradingViewQuote)) {
            return quote;
        }
    } catch (error) {
        if (error instanceof TradingViewFetchError) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('fetchTradingViewQuote TradingViewFetchError:', { stockCode, error });
            }
        } else {
            console.error('fetchTradingViewQuote unexpected error:', error);
        }
    }

    try {
        const fugleQuote = await fetchFugleRealtimeQuote(stockCode);
        if (incorporateQuote(fugleQuote)) {
            return quote;
        }
    } catch (error) {
        if (error instanceof FugleFetchError) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('fetchFugleRealtimeQuote FugleFetchError:', { stockCode, error });
            }
        } else {
            console.error('fetchFugleRealtimeQuote unexpected error:', error);
        }
    }

    try {
        const records = await fetchRealtimeSnapshot();
        const twseQuote = toQuoteDataFromRealtimeRecord(records.find((entry) => entry.Code === stockCode));
        if (incorporateQuote(twseQuote)) {
            return quote;
        }
    } catch (error) {
        if (error instanceof TwseFetchError) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('fetchRealtimeSnapshot TwseFetchError:', { stockCode, error });
            }
        }
        if (!(error instanceof TwseFetchError)) {
            console.error('fetchRealtimeSnapshot unexpected error:', error);
        }
    }

    try {
        const fallbackRecord = await fetchRealtimeBySymbol(stockCode);
        const fallbackQuote = toQuoteDataFromRealtimeRecord(fallbackRecord);
        if (incorporateQuote(fallbackQuote)) {
            return quote;
        }
    } catch (error) {
        if (error instanceof TwseFetchError) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('fetchRealtimeBySymbol TwseFetchError:', { stockCode, error });
            }
        } else {
            console.error('fetchRealtimeBySymbol unexpected error:', error);
        }
    }

    return quote;
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
    const [profile, quote, candleResult] = await Promise.all([
        withTimeoutFallback(getTaiwanCompanyProfile(symbol), null, TWSE_SNAPSHOT_TIMEOUT_MS),
        withTimeoutFallback(getTaiwanRealtimeQuote(symbol), null, TWSE_SNAPSHOT_TIMEOUT_MS),
        withTimeoutFallback(
            getTaiwanStockCandles(symbol, { count: 240 }),
            { candles: [], reason: 'network-error' },
            TWSE_SNAPSHOT_TIMEOUT_MS,
        ),
    ]);

    return {
        profile,
        quote: enrichQuoteWithCandles(quote, candleResult.candles),
        candles: candleResult.candles,
        candleIssue: candleResult.reason,
    };
};
