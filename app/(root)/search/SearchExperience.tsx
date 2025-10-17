"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search as SearchIcon, Sparkles } from "lucide-react";
import WatchlistButton from "@/components/WatchlistButton";

const applyWatchlistStatus = (
    items: StockWithWatchlistStatus[],
    watchlistSet: Set<string>,
): StockWithWatchlistStatus[] => {
    return items.map((item) => ({
        ...item,
        isInWatchlist: watchlistSet.has(item.symbol.toUpperCase()),
    }));
};

type SearchExperienceProps = {
    initialStocks: StockWithWatchlistStatus[];
    initialWatchlistSymbols: string[];
    isAuthenticated: boolean;
    marketDataReady: boolean;
};

const SearchExperience = ({
    initialStocks,
    initialWatchlistSymbols,
    isAuthenticated,
    marketDataReady,
}: SearchExperienceProps) => {
    const [inputValue, setInputValue] = useState("");
    const [rawResults, setRawResults] = useState<StockWithWatchlistStatus[]>(initialStocks);
    const [results, setResults] = useState<StockWithWatchlistStatus[]>(initialStocks);
    const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>(
        initialWatchlistSymbols.map((symbol) => symbol.toUpperCase()),
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(
        initialStocks.length === 0 && !marketDataReady
            ? "尚未設定 FINNHUB API 金鑰，暫時無法顯示熱門股票。"
            : null,
    );

    const watchlistSet = useMemo(
        () => new Set(watchlistSymbols.map((symbol) => symbol.toUpperCase())),
        [watchlistSymbols],
    );

    useEffect(() => {
        setResults(applyWatchlistStatus(rawResults, watchlistSet));
    }, [rawResults, watchlistSet]);

    useEffect(() => {
        const trimmed = inputValue.trim();

        if (!trimmed) {
            setRawResults(initialStocks);
            setLoading(false);
            setError(
                initialStocks.length === 0 && !marketDataReady
                    ? "尚未設定 FINNHUB API 金鑰，暫時無法顯示熱門股票。"
                    : null,
            );
            return;
        }

        setLoading(true);
        setError(null);

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search?query=${encodeURIComponent(trimmed)}`, {
                    signal: controller.signal,
                });

                if (!response.ok) {
                    let errorMessage = "搜尋失敗";
                    try {
                        const data = (await response.json()) as { error?: string };
                        if (typeof data?.error === "string" && data.error.trim().length > 0) {
                            errorMessage = data.error.trim();
                        }
                    } catch {
                        const fallback = await response.text().catch(() => "");
                        if (fallback.trim().length > 0) {
                            errorMessage = fallback.trim();
                        }
                    }

                    throw new Error(errorMessage);
                }

                const data = (await response.json()) as { stocks?: StockWithWatchlistStatus[]; error?: string };
                const list = Array.isArray(data.stocks) ? data.stocks : [];
                setRawResults(list);
                if (list.length === 0) {
                    setError(
                        data.error?.trim() ||
                            "找不到符合的股票代號，請確認輸入是否正確，或改用公司名稱搜尋。",
                    );
                }
            } catch (err) {
                if (controller.signal.aborted) return;
                console.error("search api error:", err);
                setRawResults([]);
                const message = err instanceof Error && err.message.trim().length > 0
                    ? err.message.trim()
                    : "搜尋時發生錯誤，請稍後再試一次。";
                setError(message);
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }, 400);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [inputValue, initialStocks, marketDataReady]);

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        const upper = symbol.toUpperCase();
        setWatchlistSymbols((prev) => {
            if (isAdded) {
                if (prev.includes(upper)) return prev;
                return [...prev, upper];
            }
            return prev.filter((item) => item !== upper);
        });

        setRawResults((prev) =>
            prev.map((item) =>
                item.symbol.toUpperCase() === upper
                    ? {
                          ...item,
                          isInWatchlist: isAdded,
                      }
                    : item,
            ),
        );

        setResults((prev) =>
            prev.map((item) =>
                item.symbol.toUpperCase() === upper
                    ? {
                          ...item,
                          isInWatchlist: isAdded,
                      }
                    : item,
            ),
        );
    };

    const title = inputValue.trim() ? "搜尋結果" : "熱門股票";
    const helperText = isAuthenticated
        ? "點擊「加入自選」即可同步到個人清單。"
        : "登入後即可將股票加入自選清單並同步到雲端。";

    return (
        <section className="space-y-8">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-lg shadow-black/20">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <SearchIcon className="h-4 w-4" />
                    <span>輸入股票代號、公司名稱或 ETF 名稱</span>
                </div>
                <div className="relative mt-4">
                    <input
                        value={inputValue}
                        onChange={(event) => setInputValue(event.target.value)}
                        placeholder="例如：TSLA、台積電 或 S&P 500 ETF"
                        className="w-full rounded-xl border border-gray-800 bg-gray-950/80 px-4 py-3 text-base text-gray-100 placeholder:text-gray-600 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                    />
                    {loading && <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-400" />}
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3" />
                    Finnhub 提供的即時市場資料，建議在尖峰時段稍作等待以獲得完整結果。
                </p>
            </div>

            {error && (
                <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold text-gray-100">{title}</h2>
                <span className="text-sm text-gray-500">{helperText}</span>
            </div>

            {results.length === 0 && !loading ? (
                <div className="rounded-xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center text-sm text-gray-400">
                    {error ?? "目前沒有可顯示的結果，請嘗試輸入其他關鍵字。"}
                </div>
            ) : (
                <ul className="grid gap-4 lg:grid-cols-2">
                    {results.map((stock) => (
                        <li
                            key={stock.symbol}
                            className="flex flex-col gap-4 rounded-2xl border border-gray-800 bg-gray-900/50 p-5 shadow-lg shadow-black/20 transition-colors hover:border-teal-500/40"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-gray-100">{stock.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {stock.symbol} • {stock.exchange} • {stock.type}
                                    </p>
                                </div>
                                <WatchlistButton
                                    symbol={stock.symbol}
                                    company={stock.name}
                                    isInWatchlist={stock.isInWatchlist}
                                    onWatchlistChange={handleWatchlistChange}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-teal-300">
                                <Link
                                    href={`/stocks/${stock.symbol}`}
                                    className="inline-flex items-center gap-2 rounded-lg border border-teal-500/60 px-3 py-1.5 text-sm text-teal-200 transition-colors hover:border-teal-400 hover:text-teal-100"
                                >
                                    查看即時走勢
                                    <span aria-hidden>→</span>
                                </Link>
                                <span className="text-xs text-gray-500">交易所：{stock.exchange}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
};

export default SearchExperience;
