import type { Metadata } from "next";
import { headers } from "next/headers";

import SearchExperience from "./SearchExperience";
import { searchStocks, isFinnhubConfigured } from "@/lib/actions/finnhub.actions";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";
import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";

export const metadata: Metadata = {
    title: "股票搜尋 | Lazybacktest",
    description:
        "透過 Finnhub 即時市場資料快速查找股票、ETF 與公司資訊，並同步管理自選清單。",
};

const SearchPage = async () => {
    const finnHubConfigured = await isFinnhubConfigured();
    const authConfigured = isAuthConfigured();
    let watchlistSymbols: string[] = [];
    let isAuthenticated = false;

    if (authConfigured) {
        try {
            const auth = await getAuth();
            const session = await auth.api.getSession({ headers: await headers() });
            const userId = session?.user?.id;

            if (userId) {
                isAuthenticated = true;
                watchlistSymbols = await getWatchlistSymbolsByUserId(userId);
            }
        } catch (err) {
            console.error("search page session error:", err);
        }
    }

    const initialStocks = await searchStocks(undefined, watchlistSymbols);

    return (
        <div className="space-y-10">
            <header className="space-y-3">
                <h1 className="text-3xl font-semibold text-gray-100">股票搜尋</h1>
                <p className="max-w-2xl text-sm text-gray-400">
                    透過 Finnhub 市場資料快速查找股票、ETF 與公司資訊，並一鍵加入自選清單，隨時追蹤您關注的標的。
                </p>
                {!finnHubConfigured && (
                    <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                        尚未設定 FINNHUB API 金鑰，僅能顯示基本搜尋結果。請在 Netlify 環境變數中加入 FINNHUB_API_KEY 以解鎖完整功能。
                    </div>
                )}
            </header>

            <SearchExperience
                initialStocks={initialStocks}
                initialWatchlistSymbols={watchlistSymbols}
                isAuthenticated={isAuthenticated}
                marketDataReady={finnHubConfigured}
            />
        </div>
    );
};

export default SearchPage;
