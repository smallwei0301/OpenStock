import Header from "@/components/Header";

import {getAuth, isAuthConfigured} from "@/lib/better-auth/auth";

import {headers} from "next/headers";
import {redirect} from "next/navigation";
import Footer from "@/components/Footer";

type RootAuthClient = Awaited<ReturnType<typeof getAuth>>;
type RootSession = Awaited<ReturnType<RootAuthClient["api"]["getSession"]>>;

const Layout = async ({ children }: { children : React.ReactNode }) => {

    const authConfigured = isAuthConfigured();
    let session: RootSession | null = null;

    if (authConfigured) {
        const auth = await getAuth();
        session = await auth.api.getSession({ headers: await headers() });

        if(!session?.user) redirect('/sign-in');
    }

    const user = session?.user
        ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
        }
        : null;

    return (
        <main className="min-h-screen text-gray-400">
            <Header user={user} />

            <div className="container py-10">
                {children}
            </div>

            <Footer />
        </main>
    )
}
export default Layout
