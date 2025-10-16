import { NextRequest, NextResponse } from "next/server";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";
import { getWatchlistSymbolsByUserId } from "@/lib/actions/watchlist.actions";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("query") ?? "";

        let watchlistSymbols: string[] = [];

        if (isAuthConfigured()) {
            try {
                const auth = await getAuth();
                const session = await auth.api.getSession({ headers: request.headers });
                const userId = session?.user?.id;

                if (userId) {
                    watchlistSymbols = await getWatchlistSymbolsByUserId(userId);
                }
            } catch (err) {
                console.error("search api session error:", err);
            }
        }

        const stocks = await searchStocks(query, watchlistSymbols);

        return NextResponse.json({ stocks });
    } catch (err) {
        console.error("search api error:", err);
        return NextResponse.json({ stocks: [], error: "搜尋時發生錯誤，請稍後再試一次。" }, { status: 500 });
    }
}
