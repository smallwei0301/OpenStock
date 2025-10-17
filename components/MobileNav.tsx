"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

import NavItems from "@/components/NavItems";

type MobileNavProps = {
    initialStocks: StockWithWatchlistStatus[];
    isAuthenticated: boolean;
};

const MobileNav = ({ initialStocks, isAuthenticated }: MobileNavProps) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    const closeMenu = () => setOpen(false);

    return (
        <div className="sm:hidden">
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="開啟主選單"
                className="inline-flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900/60 p-2 text-gray-300 transition-colors hover:border-teal-500/60 hover:text-teal-300"
            >
                <Menu className="h-5 w-5" />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm">
                    <div className="absolute inset-x-4 top-4 rounded-2xl border border-gray-800 bg-gray-950/95 p-6 shadow-2xl shadow-black/40">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-100">主選單</span>
                            <button
                                type="button"
                                onClick={closeMenu}
                                aria-label="關閉主選單"
                                className="rounded-xl border border-transparent p-2 text-gray-400 transition-colors hover:border-gray-700 hover:text-gray-200"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6">
                            <NavItems
                                initialStocks={initialStocks}
                                includeSearchShortcut
                                searchVariant="button"
                                searchLabel="快速搜尋股票"
                                onNavigate={closeMenu}
                                className="gap-4 p-0 text-base"
                            />
                        </div>

                        {!isAuthenticated && (
                            <Link
                                href="/sign-in"
                                onClick={closeMenu}
                                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-teal-500/70 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-200 transition-colors hover:border-teal-400 hover:text-teal-100"
                            >
                                登入或註冊
                            </Link>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileNav;
