import Image from "next/image";
import Link from "next/link";

import MobileNav from "@/components/MobileNav";
import NavItems from "@/components/NavItems";
import SearchCommand from "@/components/SearchCommand";
import UserDropdown from "@/components/UserDropdown";
import { Button } from "@/components/ui/button";
import { searchStocks } from "@/lib/actions/finnhub.actions";

const Header = async ({ user }: { user: User | null }) => {
    const initialStocks = await searchStocks();
    const isAuthenticated = Boolean(user);

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <div className="flex flex-1 items-center gap-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="https://i.ibb.co/r28VWPjS/Screenshot-2025-10-04-123317-Picsart-Ai-Image-Enhancer-removebg-preview.png"
                            alt="OpenStock 標誌"
                            width={200}
                            height={50}
                        />
                    </Link>
                    <nav className="hidden lg:block">
                        <NavItems initialStocks={initialStocks} />
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:block">
                        <SearchCommand label="快速搜尋" initialStocks={initialStocks} />
                    </div>

                    {user ? (
                        <UserDropdown user={user} initialStocks={initialStocks} />
                    ) : (
                        <Link href="/sign-in" className="hidden sm:inline-flex">
                            <Button
                                variant="outline"
                                className="border-gray-700 bg-gray-800 text-gray-100 transition-colors hover:bg-gray-700"
                            >
                                登入
                            </Button>
                        </Link>
                    )}

                    <MobileNav initialStocks={initialStocks} isAuthenticated={isAuthenticated} />
                </div>
            </div>
        </header>
    )
}

export default Header
