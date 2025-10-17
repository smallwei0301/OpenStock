import SearchCommand from "@/components/SearchCommand";
import WatchlistTable from "@/components/WatchlistTable";
import { searchStocks, getWatchlistWithMarketData, isFinnhubConfigured } from "@/lib/actions/finnhub.actions";
import { getWatchlistItemsByUserId } from "@/lib/actions/watchlist.actions";
import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const databaseConfigured = Boolean(process.env.MONGODB_URI);
const WatchlistPage = async () => {
    const finnHubConfigured = await isFinnhubConfigured();
    const authConfigured = isAuthConfigured();

    if (!authConfigured || !databaseConfigured) {
        const fallbackStocks = await searchStocks();

        return (
            <section className="space-y-8">
                <div className="space-y-3">
                    <h1 className="text-3xl font-semibold text-gray-100">自選清單</h1>
                    <p className="max-w-2xl text-sm text-gray-400">
                        要啟用自選清單，需要在環境變數設定驗證參數與 MongoDB 連線資訊。設定完成後即可儲存並同步個人關注的股票。
                    </p>
                </div>
                <SearchCommand label="搜尋股票" initialStocks={fallbackStocks} />
            </section>
        );
    }

    let userId: string | null = null;

    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: await headers() });
        userId = session?.user?.id ?? null;
    } catch (err) {
        console.error("watchlist page session error:", err);
    }

    if (!userId) {
        redirect("/sign-in");
    }

    const watchlistItems = await getWatchlistItemsByUserId(userId);
    const { items: watchlistWithData, marketDataReady } = await getWatchlistWithMarketData(watchlistItems);
    const initialStocks = await searchStocks(undefined, watchlistItems.map((item) => item.symbol));

    return (
        <section className="space-y-10">
            <header className="space-y-3">
                <h1 className="text-3xl font-semibold text-gray-100">自選清單</h1>
                <p className="max-w-2xl text-sm text-gray-400">
                    集中管理所有追蹤標的，直接從列表開啟圖表或移除不再關注的股票。
                </p>
                {(!finnHubConfigured || !marketDataReady) && (
                    <div className="rounded-lg border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                        尚未設定 FINNHUB API 金鑰，將無法顯示最新價格、市值與本益比資訊。
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-500">
                    已追蹤 <span className="font-semibold text-gray-100">{watchlistWithData.length}</span> 檔股票
                </div>
                <SearchCommand label="新增股票" initialStocks={initialStocks} />
            </div>

            <WatchlistTable initialWatchlist={watchlistWithData} />
        </section>
    );
};

export default WatchlistPage;
