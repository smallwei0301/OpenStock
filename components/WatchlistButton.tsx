"use client";

import React, { useMemo, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { addSymbolToWatchlist, removeSymbolFromWatchlist } from "@/lib/actions/watchlist.actions";

const WatchlistButton = ({
                             symbol,
                             company,
                             isInWatchlist,
                             showTrashIcon = false,
                             type = "button",
                             onWatchlistChange,
                         }: WatchlistButtonProps) => {
    const normalizedSymbol = symbol.toUpperCase();
    const [added, setAdded] = useState<boolean>(!!isInWatchlist);
    const [isPending, startTransition] = useTransition();

    const label = useMemo(() => {
        if (type === "icon") return "";
        return added ? "從自選移除" : "加入自選";
    }, [added, type]);

    const handleClick = () => {
        const next = !added;
        setAdded(next);

        startTransition(async () => {
            const action = next
                ? await addSymbolToWatchlist({ symbol: normalizedSymbol, company: company || normalizedSymbol })
                : await removeSymbolFromWatchlist({ symbol: normalizedSymbol });

            if (!action?.success) {
                setAdded(!next);
                if (typeof window !== "undefined" && action?.error) {
                    window.alert(action.error);
                }
                return;
            }

            onWatchlistChange?.(normalizedSymbol, next);
        });
    };

    if (type === "icon") {
        return (
            <button
                type="button"
                title={added ? `將 ${normalizedSymbol} 從自選移除` : `將 ${normalizedSymbol} 加入自選`}
                aria-label={added ? `將 ${normalizedSymbol} 從自選移除` : `將 ${normalizedSymbol} 加入自選`}
                className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""}`}
                onClick={handleClick}
                disabled={isPending}
                aria-busy={isPending}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-amber-300" />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={added ? "#FACC15" : "none"}
                        stroke="#FACC15"
                        strokeWidth="1.5"
                        className="watchlist-star"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
                        />
                    </svg>
                )}
            </button>
        );
    }

    return (
        <button
            type="button"
            className={`watchlist-btn ${added ? "watchlist-remove" : ""}`}
            onClick={handleClick}
            disabled={isPending}
            aria-busy={isPending}
        >
            {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : showTrashIcon && added ? (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5 mr-2"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
                </svg>
            ) : null}
            <span>{label}</span>
        </button>
    );
};

export default WatchlistButton;