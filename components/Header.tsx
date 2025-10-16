import Link from "next/link";
import Image from "next/image";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";
import { Button } from "@/components/ui/button";

const Header = async ({ user }: { user: User | null }) => {
    const initialStocks = await searchStocks();

    return (
        <header className="sticky top-0 header">
            <div className="container header-wrapper">
                <Link href="/" className="flex items-center justify-center gap-2">
                    <Image
                        src="https://i.ibb.co/r28VWPjS/Screenshot-2025-10-04-123317-Picsart-Ai-Image-Enhancer-removebg-preview.png"
                        alt="OpenStock 標誌"
                        width={200}
                        height={50}
                    />
                </Link>
                <nav className="hidden sm:block">
                    <NavItems initialStocks={initialStocks} />
                </nav>

                {user ? (
                    <UserDropdown user={user} initialStocks={initialStocks} />
                ) : (
                    <Link href="/sign-in">
                        <Button variant="outline" className="bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700">
                            登入
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    )
}

export default Header
