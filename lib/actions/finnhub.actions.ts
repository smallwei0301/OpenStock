'use server';

import {
    getDateRange,
    validateArticle,
    formatArticle,
    formatMarketCapValue,
    formatPrice,
    mapFinnhubSymbolToTradingView,
    isTaiwanEquitySymbol,
} from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';
import { WatchlistItem } from '@/database/models/watchlist.model';
import { getTaiwanStockCandles } from '@/lib/actions/twse.actions';

type FinnhubProfileResponse = {
    name?: string;
    ticker?: string;
    exchange?: string;
};

type FinnhubCandleResponse = {
    c?: number[];
    o?: number[];
    h?: number[];
    l?: number[];
    v?: number[];
    t?: number[];
    s?: 'ok' | 'no_data';
};

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

class FinnhubFetchError extends Error {
    status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.name = 'FinnhubFetchError';
        this.status = status;
    }
}

const resolveFinnhubToken = () =>
    (process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '').trim();

export async function isFinnhubConfigured(): Promise<boolean> {
    return resolveFinnhubToken().length > 0;
}

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
    const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
        ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
        : { cache: 'no-store' };

    const res = await fetch(url, options);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new FinnhubFetchError(`Fetch failed ${res.status}: ${text}`, res.status);
    }
    return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
    try {
        const range = getDateRange(5);
        const token = resolveFinnhubToken();
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }
        const cleanSymbols = (symbols || [])
            .map((s) => s?.trim().toUpperCase())
            .filter((s): s is string => Boolean(s));

        const maxArticles = 6;

        // If we have symbols, try to fetch company news per symbol and round-robin select
        if (cleanSymbols.length > 0) {
            const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

            await Promise.all(
                cleanSymbols.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
                        const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
                        perSymbolArticles[sym] = (articles || []).filter(validateArticle);
                    } catch (e) {
                        console.error('Error fetching company news for', sym, e);
                        perSymbolArticles[sym] = [];
                    }
                })
            );

            const collected: MarketNewsArticle[] = [];
            // Round-robin up to 6 picks
            for (let round = 0; round < maxArticles; round++) {
                for (let i = 0; i < cleanSymbols.length; i++) {
                    const sym = cleanSymbols[i];
                    const list = perSymbolArticles[sym] || [];
                    if (list.length === 0) continue;
                    const article = list.shift();
                    if (!article || !validateArticle(article)) continue;
                    collected.push(formatArticle(article, true, sym, round));
                    if (collected.length >= maxArticles) break;
                }
                if (collected.length >= maxArticles) break;
            }

            if (collected.length > 0) {
                // Sort by datetime desc
                collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
                return collected.slice(0, maxArticles);
            }
            // If none collected, fall through to general news
        }

        // General market news fallback or when no symbols provided
        const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
        const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

        const seen = new Set<string>();
        const unique: RawNewsArticle[] = [];
        for (const art of general || []) {
            if (!validateArticle(art)) continue;
            const key = `${art.id}-${art.url}-${art.headline}`;
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(art);
            if (unique.length >= 20) break; // cap early before final slicing
        }

        const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
        return formatted;
    } catch (err) {
        console.error('getNews error:', err);
        throw new Error('Failed to fetch news');
    }
}

const RESOLUTION_IN_SECONDS: Record<string, number> = {
    '1': 60,
    '5': 300,
    '15': 900,
    '30': 1_800,
    '60': 3_600,
    D: 86_400,
    W: 604_800,
    M: 2_592_000,
};

export type CandleResolution = keyof typeof RESOLUTION_IN_SECONDS;

const resolveResolutionSeconds = (resolution: CandleResolution) => RESOLUTION_IN_SECONDS[resolution] ?? RESOLUTION_IN_SECONDS.D;

type CandleOptions = {
    resolution?: CandleResolution;
    count?: number;
    to?: number;
};

const CANDLE_BACKOFF_STEPS = 3;

const toCandles = (data?: FinnhubCandleResponse): CandleDatum[] => {
    if (!data || data.s !== 'ok' || !Array.isArray(data.t) || data.t.length === 0) {
        return [];
    }

    const { c = [], o = [], h = [], l = [], v = [], t = [] } = data;

    return t
        .map((time, index) => {
            const close = c[index];
            const open = o[index] ?? close;
            const high = h[index] ?? Math.max(open ?? close ?? 0, close ?? open ?? 0);
            const low = l[index] ?? Math.min(open ?? close ?? 0, close ?? open ?? 0);
            const volume = v[index];

            if (!Number.isFinite(time) || !Number.isFinite(close ?? open ?? high ?? low)) {
                return undefined;
            }

            const fallback = typeof close === 'number' ? close : typeof open === 'number' ? open : 0;

            return {
                time,
                close: typeof close === 'number' ? close : fallback,
                open: typeof open === 'number' ? open : fallback,
                high: typeof high === 'number' ? high : fallback,
                low: typeof low === 'number' ? low : fallback,
                volume: typeof volume === 'number' && volume >= 0 ? volume : undefined,
            } satisfies CandleDatum;
        })
        .filter((entry): entry is CandleDatum => Boolean(entry))
        .sort((a, b) => a.time - b.time);
};

const buildSymbolCandidates = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    const candidates = new Set<string>();
    if (normalized) {
        candidates.add(normalized);
        const mapped = mapFinnhubSymbolToTradingView(normalized);
        if (mapped && mapped !== normalized) {
            candidates.add(mapped);
        }

        const match = normalized.match(/^([A-Z0-9\-]+)\.([A-Z0-9]+)$/);
        if (match) {
            const [, base] = match;
            if (base) {
                candidates.add(base);
            }
        }
    }

    return Array.from(candidates);
};

type CandleFetchStatus = 'ok' | 'no_data' | 'rate_limit' | 'permission_denied' | 'error';

const fetchCandlesWithRange = async (
    symbol: string,
    resolution: CandleResolution,
    from: number,
    to: number,
    token: string,
): Promise<{ candles: CandleDatum[]; status: CandleFetchStatus }> => {
    if (!Number.isFinite(from) || !Number.isFinite(to) || from >= to) {
        return { candles: [], status: 'error' };
    }

    const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${encodeURIComponent(
        resolution,
    )}&from=${Math.max(0, Math.floor(from))}&to=${Math.floor(to)}&adjusted=true&token=${token}`;

    try {
        const data = await fetchJSON<FinnhubCandleResponse>(url, 600);
        if (data?.s === 'no_data') {
            return { candles: [], status: 'no_data' };
        }
        const candles = toCandles(data);
        return { candles, status: candles.length > 0 ? 'ok' : 'no_data' };
    } catch (error) {
        if (error instanceof FinnhubFetchError) {
            if (error.status === 429) {
                return { candles: [], status: 'rate_limit' };
            }
            if (error.status === 401 || error.status === 403) {
                return { candles: [], status: 'permission_denied' };
            }
        }
        if (process.env.NODE_ENV !== 'production') {
            console.warn('getStockCandles attempt failed:', { symbol, resolution, from, to, error });
        }
        return { candles: [], status: 'error' };
    }
};

export async function getStockCandles(symbol: string, options: CandleOptions = {}): Promise<StockCandlesResult> {
    try {
        const normalizedSymbol = symbol?.trim().toUpperCase();
        if (!normalizedSymbol) {
            return { candles: [], reason: 'invalid-symbol' };
        }

        if (isTaiwanEquitySymbol(normalizedSymbol)) {
            return getTaiwanStockCandles(normalizedSymbol, options);
        }

        const token = resolveFinnhubToken();
        if (!token) {
            return { candles: [], reason: 'not-configured' };
        }

        const resolution: CandleResolution = options.resolution ?? 'D';
        const resolutionSeconds = resolveResolutionSeconds(resolution);
        const requestedCount = Math.max(options.count ?? 180, 1);
        const baseTo = options.to ?? Math.floor(Date.now() / 1000);

        const symbolCandidates = buildSymbolCandidates(normalizedSymbol);
        const countCandidates = [
            requestedCount,
            Math.max(Math.floor(requestedCount * 0.75), 60),
            Math.max(Math.floor(requestedCount * 0.5), 30),
        ];
        const backoffSteps = Array.from({ length: CANDLE_BACKOFF_STEPS }, (_, index) => index * resolutionSeconds);

        let fallbackReason: CandleDataIssue | undefined;

        for (const candidate of symbolCandidates) {
            for (const countOption of countCandidates) {
                for (const backoff of backoffSteps) {
                    const to = baseTo - backoff;
                    const from = to - resolutionSeconds * countOption;
                    const { candles, status } = await fetchCandlesWithRange(
                        candidate,
                        resolution,
                        from,
                        to,
                        token,
                    );
                    if (candles.length > 0) {
                        return { candles };
                    }

                    if (status === 'rate_limit') {
                        return { candles: [], reason: 'rate-limit' };
                    }

                    if (status === 'permission_denied') {
                        return { candles: [], reason: 'permission-denied' };
                    }

                    if (status === 'error' && fallbackReason !== 'rate-limit') {
                        fallbackReason = 'network-error';
                    } else if (!fallbackReason && status === 'no_data') {
                        fallbackReason = 'no-data';
                    }
                }
            }
        }

        console.warn('getStockCandles exhausted all fallback attempts for symbol:', normalizedSymbol);
        return { candles: [], reason: fallbackReason ?? 'no-data' };
    } catch (err) {
        console.error('getStockCandles error:', err);
        if (err instanceof FinnhubFetchError && (err.status === 401 || err.status === 403)) {
            return { candles: [], reason: 'permission-denied' };
        }
        return { candles: [], reason: 'network-error' };
    }
}

export const searchStocks = cache(async (
    query?: string,
    watchlistSymbols: string[] = [],
): Promise<StockWithWatchlistStatus[]> => {
    try {
        const token = resolveFinnhubToken();
        if (!token) {
            // If no token, log and return empty to avoid throwing per requirements
            console.error('Error in stock search:', new Error('FINNHUB API key is not configured'));
            return [];
        }

        const trimmed = typeof query === 'string' ? query.trim() : '';

        let results: FinnhubSearchResult[] = [];

        const watchlistSet = new Set(
            Array.from(new Set(watchlistSymbols)).map((symbol) => symbol.trim().toUpperCase()).filter(Boolean),
        );

        const profileExchangeMap = new Map<string, string | undefined>();

        if (!trimmed) {
            // Fetch top 10 popular symbols' profiles
            const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
            const profiles = await Promise.all(
                top.map(async (sym) => {
                    try {
                        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
                        // Revalidate every hour
                        const profile = await fetchJSON<FinnhubProfileResponse>(url, 3600);
                        return { sym: sym.toUpperCase(), profile };
                    } catch (e) {
                        console.error('Error fetching profile2 for', sym, e);
                        return { sym: sym.toUpperCase(), profile: null };
                    }
                })
            );

            results = profiles
                .map(({ sym, profile }) => {
                    const symbol = sym.toUpperCase();
                    const name: string | undefined = profile?.name || profile?.ticker || undefined;
                    const exchange: string | undefined = profile?.exchange || undefined;
                    if (!name) return undefined;
                    profileExchangeMap.set(symbol, exchange);
                    const r: FinnhubSearchResult = {
                        symbol,
                        description: name,
                        displaySymbol: symbol,
                        type: 'Common Stock',
                    };
                    return r;
                })
                .filter((x): x is FinnhubSearchResult => Boolean(x));
        } else {
            const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
            const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
            results = Array.isArray(data?.result) ? data.result : [];
        }

        const mapped: StockWithWatchlistStatus[] = results
            .map((r) => {
                const upper = (r.symbol || '').toUpperCase();
                const name = r.description || upper;
                const exchangeFromDisplay = r.displaySymbol || undefined;
                const exchangeFromProfile = profileExchangeMap.get(upper);
                const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
                const type = r.type || 'Stock';
                const item: StockWithWatchlistStatus = {
                    symbol: upper,
                    name,
                    exchange,
                    type,
                    isInWatchlist: watchlistSet.has(upper),
                };
                return item;
            })
            .slice(0, 15);

        return mapped;
    } catch (err) {
        console.error('Error in stock search:', err);
        return [];
    }
});

export async function getQuote(symbol: string): Promise<QuoteData | null> {
    try {
        const token = resolveFinnhubToken();
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }

        const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const quote = await fetchJSON<QuoteData>(url, 60);
        return quote ?? null;
    } catch (err) {
        console.error('getQuote error:', err);
        return null;
    }
}

export async function getCompanyProfile(symbol: string): Promise<ProfileData | null> {
    try {
        const token = resolveFinnhubToken();
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }

        const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol)}&token=${token}`;
        const profile = await fetchJSON<ProfileData>(url, 3600);
        return profile ?? null;
    } catch (err) {
        console.error('getCompanyProfile error:', err);
        return null;
    }
}

export async function getCompanyFinancials(symbol: string): Promise<FinancialsData | null> {
    try {
        const token = resolveFinnhubToken();
        if (!token) {
            throw new Error('FINNHUB API key is not configured');
        }

        const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(symbol)}&metric=all&token=${token}`;
        const data = await fetchJSON<FinancialsData>(url, 3600);
        return data ?? null;
    } catch (err) {
        console.error('getCompanyFinancials error:', err);
        return null;
    }
}

export async function getWatchlistWithMarketData(watchlist: WatchlistItem[]) {
    const token = resolveFinnhubToken();

    if (!Array.isArray(watchlist) || watchlist.length === 0) {
        return { items: [] as StockWithData[], marketDataReady: Boolean(token) };
    }

    if (!token) {
        return {
            items: watchlist.map((item) => ({
                userId: item.userId,
                symbol: item.symbol.toUpperCase(),
                company: item.company,
                addedAt: item.addedAt,
            })),
            marketDataReady: false,
        };
    }

    const uniqueSymbols = Array.from(new Set(watchlist.map((item) => item.symbol.toUpperCase())));

    const symbolToData = await Promise.all(
        uniqueSymbols.map(async (symbol) => {
            try {
                const [quote, profile, financials] = await Promise.all([
                    getQuote(symbol),
                    getCompanyProfile(symbol),
                    getCompanyFinancials(symbol),
                ]);

                const currentPrice = quote?.c ?? undefined;
                const changePercent = quote?.dp ?? undefined;

                const rawMarketCap = profile?.marketCapitalization;
                const marketCapUsd = typeof rawMarketCap === 'number' ? rawMarketCap * 1_000_000_000 : undefined;

                const peRatio = financials?.metric?.peNormalizedAnnual ?? financials?.metric?.peBasicExclExtraTTM;

                return {
                    symbol,
                    currentPrice,
                    changePercent,
                    priceFormatted: currentPrice !== undefined ? formatPrice(currentPrice) : undefined,
                    changeFormatted:
                        changePercent !== undefined
                            ? `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`
                            : undefined,
                    marketCap:
                        marketCapUsd !== undefined ? formatMarketCapValue(marketCapUsd) : undefined,
                    peRatio: typeof peRatio === 'number' ? peRatio.toFixed(2) : undefined,
                };
            } catch (err) {
                console.error('getWatchlistWithMarketData symbol error:', symbol, err);
                return {
                    symbol,
                };
            }
        }),
    );

    const dataMap = new Map(symbolToData.map((entry) => [entry.symbol, entry]));

    const items: StockWithData[] = watchlist.map((item) => {
        const symbol = item.symbol.toUpperCase();
        const metrics = dataMap.get(symbol);

        return {
            userId: item.userId,
            symbol,
            company: item.company,
            addedAt: item.addedAt,
            currentPrice: metrics?.currentPrice,
            changePercent: metrics?.changePercent,
            priceFormatted: metrics?.priceFormatted,
            changeFormatted: metrics?.changeFormatted,
            marketCap: metrics?.marketCap,
            peRatio: metrics?.peRatio,
        };
    });

    return { items, marketDataReady: true };
}
