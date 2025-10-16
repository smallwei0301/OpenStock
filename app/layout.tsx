import type { Metadata } from "next";
import {Toaster} from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenStock",
  description: "OpenStock is an open-source alternative to expensive market platforms. Track real-time prices, set personalized alerts, and explore detailed company insights — built openly, for everyone, forever free.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body
                className="antialiased"
            >
                {children}
                <Toaster/>
            </body>
        </html>
    );
}
