'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";

import SearchCommand from "@/components/SearchCommand";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NavItemsProps = {
    initialStocks: StockWithWatchlistStatus[];
    className?: string;
    includeSearchShortcut?: boolean;
    onNavigate?: () => void;
    searchLabel?: string;
    searchVariant?: 'button' | 'text';
};

const NavItems = ({
    initialStocks,
    className,
    includeSearchShortcut = false,
    onNavigate,
    searchLabel = '快速搜尋',
    searchVariant = 'text',
}: NavItemsProps) => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';

        return pathname.startsWith(path);
    };

    const handleNavigate = () => {
        onNavigate?.();
    };

    return (
        <ul
            className={cn(
                "flex flex-col gap-3 p-2 text-base font-medium sm:flex-row sm:gap-8",
                className,
            )}
        >
            {NAV_ITEMS.map(({ href, label }) => (
                <li key={href}>
                    <Link
                        href={href}
                        onClick={handleNavigate}
                        className={cn(
                            "transition-colors hover:text-teal-400",
                            isActive(href) ? "text-gray-100" : "text-gray-400",
                        )}
                    >
                        {label}
                    </Link>
                </li>
            ))}
            {includeSearchShortcut && (
                <li key="search-shortcut" className="pt-1 sm:pt-0">
                    <SearchCommand
                        renderAs={searchVariant}
                        label={searchLabel}
                        initialStocks={initialStocks}
                        onNavigate={onNavigate}
                    />
                </li>
            )}
        </ul>
    );
};

export default NavItems;
