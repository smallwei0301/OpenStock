import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInMs = now - timestamp * 1000; // Convert to milliseconds
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInHours > 24) {
        const days = Math.floor(diffInHours / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInHours >= 1) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
};

export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Formatted string like "$3.10T", "$900.00B", "$25.00M" or "$999,999.99"
export function formatMarketCapValue(marketCapUsd: number): string {
    if (!Number.isFinite(marketCapUsd) || marketCapUsd <= 0) return 'N/A';

    if (marketCapUsd >= 1e12) return `$${(marketCapUsd / 1e12).toFixed(2)}T`; // Trillions
    if (marketCapUsd >= 1e9) return `$${(marketCapUsd / 1e9).toFixed(2)}B`; // Billions
    if (marketCapUsd >= 1e6) return `$${(marketCapUsd / 1e6).toFixed(2)}M`; // Millions
    return `$${marketCapUsd.toFixed(2)}`; // Below one million, show full USD amount
}

export const getDateRange = (days: number) => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setDate(toDate.getDate() - days);
    return {
        to: toDate.toISOString().split('T')[0],
        from: fromDate.toISOString().split('T')[0],
    };
};

// Get today's date range (from today to today)
export const getTodayDateRange = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    return {
        to: todayString,
        from: todayString,
    };
};

// Calculate news per symbol based on watchlist size
export const calculateNewsDistribution = (symbolsCount: number) => {
    let itemsPerSymbol: number;
    let targetNewsCount = 6;

    if (symbolsCount < 3) {
        itemsPerSymbol = 3; // Fewer symbols, more news each
    } else if (symbolsCount === 3) {
        itemsPerSymbol = 2; // Exactly 3 symbols, 2 news each = 6 total
    } else {
        itemsPerSymbol = 1; // Many symbols, 1 news each
        targetNewsCount = 6; // Don't exceed 6 total
    }

    return { itemsPerSymbol, targetNewsCount };
};

// Check for required article fields
export const validateArticle = (article: RawNewsArticle) =>
    article.headline && article.summary && article.url && article.datetime;

// Get today's date string in YYYY-MM-DD format
export const getTodayString = () => new Date().toISOString().split('T')[0];

export const formatArticle = (
    article: RawNewsArticle,
    isCompanyNews: boolean,
    symbol?: string,
    index: number = 0
) => ({
    id: isCompanyNews ? Date.now() + Math.random() : article.id + index,
    headline: article.headline!.trim(),
    summary:
        article.summary!.trim().substring(0, isCompanyNews ? 200 : 150) + '...',
    source: article.source || (isCompanyNews ? 'Company News' : 'Market News'),
    url: article.url!,
    datetime: article.datetime!,
    image: article.image || '',
    category: isCompanyNews ? 'company' : article.category || 'general',
    related: isCompanyNews ? symbol! : article.related || '',
});

export const formatChangePercent = (changePercent?: number) => {
    if (changePercent === undefined || changePercent === null) return '';
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
};

export const getChangeColorClass = (changePercent?: number) => {
    if (!changePercent) return 'text-gray-400';
    return changePercent > 0 ? 'text-green-500' : 'text-red-500';
};

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(price);
};

export const formatDateToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});


export const getAlertText = (alert: Alert) => {
    const condition = alert.alertType === 'upper' ? '>' : '<';
    return `Price ${condition} ${formatPrice(alert.threshold)}`;
};

export const getFormattedTodayDate = () => new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
});

const FINNHUB_TO_TRADINGVIEW_PREFIX: Record<string, string> = {
    TW: 'TWSE',
    TWO: 'TPEX',
};

const TAIWAN_SYMBOL_SUFFIXES = ['.TW', '.TWO'];

/**
 * Convert Finnhub-formatted ticker (e.g. 2330.TW) to a TradingView compatible symbol (e.g. TWSE:2330).
 * Returns the original symbol if no mapping is required to avoid breaking existing markets.
 */
export const mapFinnhubSymbolToTradingView = (symbol: string) => {
    const normalized = symbol?.trim().toUpperCase();
    if (!normalized) return '';

    if (normalized.includes(':')) {
        return normalized;
    }

    const match = normalized.match(/^([A-Z0-9\-]+)\.([A-Z0-9]+)$/);
    if (!match) {
        return normalized;
    }

    const [, base, suffix] = match;
    const prefix = FINNHUB_TO_TRADINGVIEW_PREFIX[suffix as keyof typeof FINNHUB_TO_TRADINGVIEW_PREFIX];

    if (prefix) {
        return `${prefix}:${base}`;
    }

    return normalized;
};

export const isTaiwanEquitySymbol = (symbol: string) => {
    const normalized = symbol?.trim().toUpperCase();
    if (!normalized) return false;
    return TAIWAN_SYMBOL_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
};

export const extractTaiwanStockCode = (symbol: string) => {
    const normalized = symbol?.trim().toUpperCase();
    if (!normalized) return null;

    const parts = normalized.split(/[:.]/);
    const candidate = parts.length > 1 ? parts[parts.length - 1] : normalized;
    const digitsOnly = candidate.replace(/[^0-9]/g, '');

    if (digitsOnly.length === 4) {
        return digitsOnly;
    }

    const fourDigitMatch = normalized.match(/(\d{4})/);
    return fourDigitMatch ? fourDigitMatch[1] : null;
};

type CurrencyFormatOptions = {
    locale?: string;
    maximumFractionDigits?: number;
    minimumFractionDigits?: number;
};

const DEFAULT_CURRENCY_OPTIONS: Required<CurrencyFormatOptions> = {
    locale: 'zh-TW',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
};

export const formatLocalizedCurrency = (
    value?: number,
    currency: string = 'USD',
    options: CurrencyFormatOptions = {},
) => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';

    const { locale, maximumFractionDigits, minimumFractionDigits } = {
        ...DEFAULT_CURRENCY_OPTIONS,
        ...options,
    };

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            maximumFractionDigits,
            minimumFractionDigits,
        }).format(value);
    } catch (error) {
        console.error('formatLocalizedCurrency error:', error);
        return value.toFixed(Math.min(2, maximumFractionDigits));
    }
};

export const formatCompactCurrency = (value?: number, currency = 'USD', locale = 'zh-TW') => {
    if (value === undefined || value === null || !Number.isFinite(value)) return '—';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 2,
        }).format(value);
    } catch (error) {
        console.error('formatCompactCurrency error:', error);
        return formatLocalizedCurrency(value, currency, { locale });
    }
};

export const formatTimestampToLocale = (
    timestamp?: number,
    locale = 'zh-TW',
    timeZone = 'Asia/Taipei',
) => {
    if (!timestamp || !Number.isFinite(timestamp)) return '';

    const date = new Date(timestamp * 1000);
    try {
        return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone,
            hour12: false,
        }).format(date);
    } catch (error) {
        console.error('formatTimestampToLocale error:', error);
        return date.toISOString();
    }
};

