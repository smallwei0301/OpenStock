import TradingViewWidget from "@/components/TradingViewWidget";
import WatchlistButton from "@/components/WatchlistButton";
import {
    SYMBOL_INFO_WIDGET_CONFIG,
    CANDLE_CHART_WIDGET_CONFIG,
    BASELINE_WIDGET_CONFIG,
    TECHNICAL_ANALYSIS_WIDGET_CONFIG,
    COMPANY_PROFILE_WIDGET_CONFIG,
    COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants";
import { getCompanyProfile, isFinnhubConfigured } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";
import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export default async function StockDetails({ params }: StockDetailsPageProps) {
    const finnHubConfigured = await isFinnhubConfigured();
    const { symbol } = await params;
    const normalizedSymbol = symbol.toUpperCase();
    const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;

    let displayName = normalizedSymbol;
    let isInWatchlist = false;

    if (finnHubConfigured) {
        try {
            const profile = await getCompanyProfile(normalizedSymbol);
            if (profile?.name) {
                displayName = profile.name;
            }
        } catch (err) {
            console.error("stock profile fetch error:", err);
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

    return (
        <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {/* Left column */}
                <div className="flex flex-col gap-6">
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
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-100">{displayName}</h2>
                            <p className="text-sm text-gray-500">{normalizedSymbol}</p>
                        </div>
                        <WatchlistButton
                            symbol={normalizedSymbol}
                            company={displayName}
                            isInWatchlist={isInWatchlist}
                        />
                    </div>

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
                </div>
            </section>
        </div>
    );
}