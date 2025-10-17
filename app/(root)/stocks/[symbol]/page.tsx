import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import TaiwanStockChart from "@/components/TaiwanStockChart";
import TaiwanStockSnapshot from "@/components/TaiwanStockSnapshot";
import TaiwanStockFundamentals from "@/components/TaiwanStockFundamentals";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import {
    getCompanyFinancials,
    getCompanyProfile,
    getQuote,
    getStockCandles,
    isFinnhubConfigured,
} from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";
import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import {
    formatChangePercent,
    formatLocalizedCurrency,
    getChangeColorClass,
    isTaiwanEquitySymbol,
    mapFinnhubSymbolToTradingView,
} from "@/lib/utils";

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const finnHubConfigured = await isFinnhubConfigured();
    const { symbol } = await params;
    const normalizedSymbol = symbol.toUpperCase();
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    const isTaiwanSymbol = isTaiwanEquitySymbol(normalizedSymbol);

    let displayName = normalizedSymbol;
    let isInWatchlist = false;
    let profile: ProfileData | null = null;
    let quote: QuoteData | null = null;
    let financials: FinancialsData | null = null;
    let candles: CandleDatum[] = [];
    let candleIssue: CandleDataIssue | undefined;

    if (finnHubConfigured) {
        try {
            [profile, quote, financials] = await Promise.all([
                getCompanyProfile(normalizedSymbol),
                getQuote(normalizedSymbol),
                getCompanyFinancials(normalizedSymbol),
            ]);

            if (profile?.name) {
                displayName = profile.name;
            }

            if (isTaiwanSymbol) {
                const candleResult = await getStockCandles(normalizedSymbol, { resolution: 'D', count: 240 });
                candles = candleResult.candles;
                candleIssue = candleResult.reason;
            }
        } catch (err) {
            console.error("stock data hydrate error:", err);
        }
    }

    if (isAuthConfigured()) {
        try {
            const auth = await getAuth();
            const session = await auth.api.getSession({ headers: await headers() });
            const userId = session?.user?.id;

            if (userId) {
                const symbols = await getWatchlistSymbolsByUserId(userId);
                isInWatchlist = symbols.includes(normalizedSymbol);
            }
        } catch (err) {
            console.error("stock watchlist session error:", err);
        }
    }

    const currency = profile?.currency ?? 'USD';
    const tradingViewSymbol = mapFinnhubSymbolToTradingView(normalizedSymbol);
    const tradingViewSymbolUrl = tradingViewSymbol.includes(':')
        ? tradingViewSymbol.replace(':', '-')
        : tradingViewSymbol;

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
                    {isTaiwanSymbol ? (
                        <>
                            <TaiwanStockSnapshot quote={quote} profile={profile} />
                            <TaiwanStockChart
                                symbol={normalizedSymbol}
                                candles={candles}
                                initialReason={candleIssue}
                                height={600}
                            />
                        </>
                    ) : (
                        <>
                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}symbol-info.js`}
                                config={SYMBOL_INFO_WIDGET_CONFIG(normalizedSymbol)}
                                height={170}
                            />

                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}advanced-chart.js`}
                                config={CANDLE_CHART_WIDGET_CONFIG(normalizedSymbol)}
                                className="custom-chart"
                                height={600}
                            />

                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}advanced-chart.js`}
                                config={BASELINE_WIDGET_CONFIG(normalizedSymbol)}
                                className="custom-chart"
                                height={600}
                            />
                        </>
                    )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-100">{displayName}</h2>
                            <p className="text-sm text-gray-500">{normalizedSymbol}</p>
                            {quote?.c !== undefined && (
                                <div className="mt-3 flex flex-wrap items-baseline gap-2 text-sm">
                                    <span className="text-2xl font-semibold text-gray-100">
                                        {formatLocalizedCurrency(quote.c, currency, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </span>
                                    <span className={getChangeColorClass(quote.dp)}>
                                        {formatChangePercent(quote.dp) || '—'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <WatchlistButton
                            symbol={normalizedSymbol}
                            company={displayName}
                            isInWatchlist={isInWatchlist}
                        />
                    </div>
                    {isTaiwanSymbol ? (
                        <>
                            <TaiwanStockFundamentals profile={profile} financials={financials} />
                            <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100">
                                <h3 className="text-base font-semibold text-amber-100">TradingView 授權提示</h3>
                                <p className="mt-3 leading-relaxed text-amber-50/80">
                                    台灣交易所標的在 TradingView 官方插件上受限於資料授權，因此我們改採 Finnhub 即時行情搭配 TradingView
                                    Lightweight Charts 呈現互動走勢。若您仍需進入 TradingView 完整版本，可點擊下方按鈕開啟新視窗。
                                </p>
                                <a
                                    href={`https://www.tradingview.com/symbols/${tradingViewSymbolUrl}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center justify-center rounded-lg border border-amber-400/60 px-4 py-2 text-sm font-medium text-amber-50 transition-colors hover:border-amber-300 hover:text-white"
                                >
                                    在 TradingView 開啟完整圖表
                                </a>
                            </section>
                        </>
                    ) : (
                        <>
                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}technical-analysis.js`}
                                config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(normalizedSymbol)}
                                height={400}
                            />

                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}company-profile.js`}
                                config={COMPANY_PROFILE_WIDGET_CONFIG(normalizedSymbol)}
                                height={440}
                            />

                            <TradingViewWidget
                                scriptUrl={`${scriptUrl}financials.js`}
                                config={COMPANY_FINANCIALS_WIDGET_CONFIG(normalizedSymbol)}
                                height={800}
                            />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}