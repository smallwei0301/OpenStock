'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { LIGHTWEIGHT_CHARTS_SCRIPT_SRC } from '@/lib/constants';
import { cn } from '@/lib/utils';

declare global {
    interface Window {
        LightweightCharts?: {
            createChart: (
                container: HTMLElement,
                options?: Record<string, unknown>,
            ) => {
                applyOptions: (options: Record<string, unknown>) => void;
                addCandlestickSeries: (options?: Record<string, unknown>) => {
                    setData: (data: { time: number; open: number; high: number; low: number; close: number }[]) => void;
                };
                addHistogramSeries: (options?: Record<string, unknown>) => {
                    setData: (data: { time: number; value: number; color?: string }[]) => void;
                };
                resize: (width: number, height: number) => void;
                timeScale: () => { fitContent: () => void };
                priceScale: (id?: string) => { applyOptions: (options: Record<string, unknown>) => void };
                remove: () => void;
            };
        };
    }
}

const DEFAULT_NO_DATA_MESSAGE = '暫時取得不到該股票的歷史走勢，稍後再試一次。';

const REASON_MESSAGE_MAP: Record<CandleDataIssue, string> = {
    'no-data': DEFAULT_NO_DATA_MESSAGE,
    'rate-limit': 'Finnhub API 呼叫已達今日流量上限，請稍後再重新整理。',
    'not-configured': '系統尚未完成台股資料來源設定，暫無法載入走勢。',
    'invalid-symbol': '找不到對應的台股代號，請確認輸入是否正確。',
    'network-error': '台股走勢載入失敗，請確認網路連線後再試一次。',
    'permission-denied': 'Finnhub API 權限不足，請確認方案是否支援台股歷史走勢資料。',
};

const resolveReasonMessage = (reason?: CandleDataIssue | null) =>
    reason ? REASON_MESSAGE_MAP[reason] ?? DEFAULT_NO_DATA_MESSAGE : DEFAULT_NO_DATA_MESSAGE;

type TaiwanStockChartProps = {
    symbol: string;
    candles?: CandleDatum[];
    initialReason?: CandleDataIssue;
    height?: number;
    className?: string;
};

const loadLightweightCharts = () =>
    new Promise<void>((resolve, reject) => {
        if (typeof window === 'undefined') {
            resolve();
            return;
        }

        if (window.LightweightCharts?.createChart) {
            resolve();
            return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="${LIGHTWEIGHT_CHARTS_SCRIPT_SRC}"]`,
        );
        if (existingScript) {
            if (existingScript.dataset.loaded === 'true') {
                resolve();
                return;
            }

            existingScript.addEventListener('load', () => resolve(), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('LightweightCharts failed to load.')), {
                once: true,
            });
            return;
        }

        const script = document.createElement('script');
        script.src = LIGHTWEIGHT_CHARTS_SCRIPT_SRC;
        script.async = true;
        script.dataset.loaded = 'false';
        script.addEventListener(
            'load',
            () => {
                script.dataset.loaded = 'true';
                resolve();
            },
            { once: true },
        );
        script.addEventListener('error', () => reject(new Error('LightweightCharts failed to load.')), { once: true });
        document.head.appendChild(script);
    });

const DEFAULT_RESOLUTION = 'D';
const DEFAULT_COUNT = 240;

const MAX_AUTO_RETRY = 3;
const AUTO_RETRY_DELAY_MS = 4_000;

const TaiwanStockChart = ({ symbol, candles, initialReason, height = 600, className }: TaiwanStockChartProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [candlesData, setCandlesData] = useState<CandleDatum[]>(() => candles ?? []);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(() =>
        initialReason ? resolveReasonMessage(initialReason) : null,
    );
    const [autoRetryAttempts, setAutoRetryAttempts] = useState(0);
    const [issue, setIssue] = useState<CandleDataIssue | null>(initialReason ?? null);
    const previousSymbolRef = useRef(symbol);

    useEffect(() => {
        const hasSymbolChanged = previousSymbolRef.current !== symbol;
        previousSymbolRef.current = symbol;

        setCandlesData(candles ?? []);

        if (candles && candles.length > 0) {
            setLoadError(null);
            setIssue(null);
            setAutoRetryAttempts(0);
            return;
        }

        if (initialReason) {
            setIssue(initialReason);
            setLoadError(resolveReasonMessage(initialReason));
            setAutoRetryAttempts(0);
            return;
        }

        if (hasSymbolChanged) {
            setIssue(null);
            setLoadError(null);
            setAutoRetryAttempts(0);
        }
    }, [candles, initialReason, symbol]);

    const fetchCandles = useCallback(async () => {
        if (!symbol) return;

        try {
            setIsLoading(true);
            setLoadError(null);
            setIssue(null);

            const params = new URLSearchParams({
                symbol,
                resolution: DEFAULT_RESOLUTION,
                count: String(DEFAULT_COUNT),
            });

            const response = await fetch(`/api/finnhub/candles?${params.toString()}`, { cache: 'no-store' });

            if (!response.ok) {
                const message = await response.text().catch(() => '');
                throw new Error(message || 'Candle fetch failed');
            }

            const payload = (await response.json()) as StockCandlesResult;

            if (Array.isArray(payload.candles) && payload.candles.length > 0) {
                setLoadError(null);
                setCandlesData(payload.candles);
                setIssue(null);
                setAutoRetryAttempts(0);
                return;
            }

            const nextIssue = payload.reason ?? 'no-data';
            setIssue(nextIssue);
            setLoadError(resolveReasonMessage(nextIssue));
        } catch (error) {
            console.error('TaiwanStockChart fetchCandles error:', error);
            setIssue('network-error');
            setLoadError(resolveReasonMessage('network-error'));
        } finally {
            setIsLoading(false);
        }
    }, [symbol]);

    useEffect(() => {
        if (!symbol) return;
        if (candlesData.length > 0) return;
        if (isLoading) return;
        if (autoRetryAttempts >= MAX_AUTO_RETRY) return;
        if (candles && candles.length > 0) return;
        if (
            issue === 'not-configured' ||
            issue === 'invalid-symbol' ||
            issue === 'rate-limit' ||
            issue === 'permission-denied'
        )
            return;

        const timer = window.setTimeout(() => {
            setAutoRetryAttempts((previous) => previous + 1);
            void fetchCandles();
        }, autoRetryAttempts === 0 ? 0 : AUTO_RETRY_DELAY_MS);

        return () => window.clearTimeout(timer);
    }, [
        autoRetryAttempts,
        candles,
        candlesData.length,
        fetchCandles,
        issue,
        isLoading,
        symbol,
    ]);

    const handleManualRefresh = useCallback(() => {
        setAutoRetryAttempts(0);
        setIssue(null);
        setLoadError(null);
        void fetchCandles();
    }, [fetchCandles]);

    useEffect(() => {
        let disposed = false;
        let chart: ReturnType<NonNullable<Window['LightweightCharts']>['createChart']> | undefined;
        let resizeObserver: ResizeObserver | undefined;

        const initialize = async () => {
            if (!containerRef.current) return;
            if (!candlesData || candlesData.length === 0) {
                return;
            }

            try {
                await loadLightweightCharts();
            } catch (err) {
                if (!disposed) {
                    console.error('TaiwanStockChart load error:', err);
                    setLoadError('無法載入 TradingView 圖表模組。請稍後再試。');
                    setCandlesData([]);
                }
                return;
            }

            if (disposed || !containerRef.current) return;

            const library = window.LightweightCharts;
            if (!library?.createChart) {
                if (!disposed) {
                    setLoadError('TradingView 圖表模組未正確初始化。');
                    setCandlesData([]);
                }
                return;
            }

            containerRef.current.innerHTML = '';

            chart = library.createChart(containerRef.current, {
                height,
                layout: {
                    background: { color: '#141414' },
                    textColor: '#D1D5DB',
                },
                grid: {
                    horzLines: { color: 'rgba(209, 213, 219, 0.08)' },
                    vertLines: { color: 'rgba(209, 213, 219, 0.08)' },
                },
                crosshair: {
                    mode: 0,
                },
                rightPriceScale: {
                    borderVisible: false,
                    scaleMargins: {
                        top: 0.1,
                        bottom: 0.2,
                    },
                },
                timeScale: {
                    borderVisible: false,
                },
            });

            const candleSeries = chart.addCandlestickSeries({
                upColor: '#0FEDBE',
                downColor: '#F87171',
                borderUpColor: '#0FEDBE',
                borderDownColor: '#F87171',
                wickUpColor: '#0FEDBE',
                wickDownColor: '#F87171',
            });

            candleSeries.setData(
                candlesData.map((candle) => ({
                    time: candle.time,
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                })),
            );

            const volumeSeries = chart.addHistogramSeries({
                priceFormat: { type: 'volume' },
                priceScaleId: '',
                scaleMargins: {
                    top: 0.8,
                    bottom: 0,
                },
            });

            volumeSeries.setData(
                candlesData.map((candle) => ({
                    time: candle.time,
                    value: candle.volume ?? 0,
                    color:
                        candle.close >= candle.open
                            ? 'rgba(15, 237, 190, 0.4)'
                            : 'rgba(248, 113, 113, 0.4)',
                })),
            );

            chart.timeScale().fitContent();

            const resizeContainer = () => {
                if (!containerRef.current) return;
                chart?.resize(containerRef.current.clientWidth, height);
            };

            resizeObserver = new ResizeObserver(() => resizeContainer());
            resizeObserver.observe(containerRef.current);
            resizeContainer();
        };

        initialize();

        return () => {
            disposed = true;
            resizeObserver?.disconnect();
            chart?.remove();
        };
    }, [candlesData, height]);

    if (!candlesData || candlesData.length === 0) {
        return (
            <div
                ref={containerRef}
                className={cn(
                    'flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border border-gray-800 bg-gray-900/60 p-6 text-center text-sm text-amber-100',
                    className,
                )}
            >
                <span>{isLoading ? '正在載入台股走勢資料…' : loadError ?? '暫無可用的台股走勢資料。'}</span>
                <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={isLoading}
                    className="inline-flex items-center rounded-lg border border-amber-400/60 px-3 py-1.5 text-xs font-medium text-amber-50 transition-colors hover:border-amber-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? '重新整理中…' : '重新整理走勢資料'}
                </button>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={cn('w-full overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/40', className)}
            style={{ height }}
        />
    );
};

export default TaiwanStockChart;
