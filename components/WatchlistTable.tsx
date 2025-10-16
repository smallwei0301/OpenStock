"use client";

import { useState } from "react";
import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { getChangeColorClass } from "@/lib/utils";

const WatchlistTable = ({ initialWatchlist }: { initialWatchlist: StockWithData[] }) => {
    const [items, setItems] = useState<StockWithData[]>(initialWatchlist);

    const handleWatchlistChange = (symbol: string, isAdded: boolean) => {
        if (!isAdded) {
            setItems((prev) => prev.filter((item) => item.symbol.toUpperCase() !== symbol.toUpperCase()));
        }
    };

    if (items.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/40 p-10 text-center text-sm text-gray-400">
                自選清單目前沒有股票，從上方搜尋結果加入第一檔想追蹤的標的吧！
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/40 shadow-lg shadow-black/20">
            <table className="min-w-full divide-y divide-gray-800 text-sm">
                <thead className="bg-gray-900/60 text-left text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                        <th scope="col" className="px-6 py-4 font-semibold">標的</th>
                        <th scope="col" className="px-6 py-4 font-semibold">最新價格</th>
                        <th scope="col" className="px-6 py-4 font-semibold">漲跌幅</th>
                        <th scope="col" className="px-6 py-4 font-semibold">市值</th>
                        <th scope="col" className="px-6 py-4 font-semibold">本益比</th>
                        <th scope="col" className="px-6 py-4 font-semibold">提醒</th>
                        <th scope="col" className="px-6 py-4 font-semibold text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                    {items.map((item) => (
                        <tr key={item.symbol} className="hover:bg-gray-900/60">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <Link
                                        href={`/stocks/${item.symbol}`}
                                        className="text-sm font-semibold text-gray-100 hover:text-teal-400"
                                    >
                                        {item.company}
                                    </Link>
                                    <span className="text-xs text-gray-500">{item.symbol}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{item.priceFormatted ?? "—"}</td>
                            <td className={`px-6 py-4 text-sm font-semibold ${getChangeColorClass(item.changePercent)}`}>
                                {item.changeFormatted ?? "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300">{item.marketCap ?? "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-300">{item.peRatio ?? "—"}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">—</td>
                            <td className="px-6 py-4 text-right">
                                <WatchlistButton
                                    symbol={item.symbol}
                                    company={item.company}
                                    isInWatchlist
                                    type="icon"
                                    onWatchlistChange={handleWatchlistChange}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default WatchlistTable;
