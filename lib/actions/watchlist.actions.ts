'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist, type WatchlistItem } from '@/database/models/watchlist.model';
import { getAuth, isAuthConfigured } from '@/lib/better-auth/auth';
import { headers } from 'next/headers';

type SessionUser = {
    id: string;
    email?: string;
    name?: string;
};

async function getDatabaseConnection() {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('MongoDB connection not found');
    }
    return db;
}

async function getSessionUser(): Promise<{ success: boolean; user?: SessionUser; error?: string }> {
    if (!isAuthConfigured()) {
        return { success: false, error: '驗證服務尚未啟用' };
    }

    try {
        const auth = await getAuth();
        const session = await auth.api.getSession({ headers: await headers() });
        const user = session?.user;

        if (!user?.id) {
            return { success: false, error: '使用者尚未登入' };
        }

        return { success: true, user };
    } catch (err) {
        console.error('getSessionUser error:', err);
        return { success: false, error: '讀取使用者資訊失敗' };
    }
}

async function resolveUserIdByEmail(email: string): Promise<string | null> {
    if (!email) return null;

    try {
        const db = await getDatabaseConnection();
        const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
        if (!user) return null;

        const userId = (user.id as string) || (user._id ? String(user._id) : null);
        return userId || null;
    } catch (err) {
        console.error('resolveUserIdByEmail error:', err);
        return null;
    }
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
    try {
        const userId = await resolveUserIdByEmail(email);
        if (!userId) return [];

        await connectToDatabase();
        const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
        return items.map((item) => String(item.symbol).toUpperCase());
    } catch (err) {
        console.error('getWatchlistSymbolsByEmail error:', err);
        return [];
    }
}

export async function getWatchlistItemsByUserId(userId: string): Promise<WatchlistItem[]> {
    if (!userId) return [];

    try {
        await connectToDatabase();
        const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean<WatchlistItem[]>();
        return items.map((item) => ({
            ...item,
            symbol: item.symbol.toUpperCase(),
            addedAt: item.addedAt ? new Date(item.addedAt) : new Date(),
        }));
    } catch (err) {
        console.error('getWatchlistItemsByUserId error:', err);
        return [];
    }
}

export async function getWatchlistSymbolsByUserId(userId: string): Promise<string[]> {
    const items = await getWatchlistItemsByUserId(userId);
    return items.map((item) => item.symbol.toUpperCase());
}

export async function getSessionWatchlistSymbols(): Promise<string[]> {
    const session = await getSessionUser();
    if (!session.success || !session.user) return [];
    return getWatchlistSymbolsByUserId(session.user.id);
}

export async function addSymbolToWatchlist({
    symbol,
    company,
}: {
    symbol: string;
    company: string;
}) {
    const normalizedSymbol = symbol?.trim().toUpperCase();
    const normalizedCompany = company?.trim() || normalizedSymbol;

    if (!normalizedSymbol) {
        return { success: false, error: '股票代號不正確' };
    }

    const session = await getSessionUser();
    if (!session.success || !session.user) {
        return { success: false, error: session.error || '使用者尚未登入' };
    }

    try {
        await connectToDatabase();
    } catch (err) {
        console.error('addSymbolToWatchlist connection error:', err);
        return { success: false, error: '資料庫尚未設定' };
    }

    try {
        await Watchlist.updateOne(
            { userId: session.user.id, symbol: normalizedSymbol },
            {
                userId: session.user.id,
                symbol: normalizedSymbol,
                company: normalizedCompany,
                addedAt: new Date(),
            },
            { upsert: true },
        );

        return { success: true };
    } catch (err) {
        console.error('addSymbolToWatchlist error:', err);
        return { success: false, error: '無法加入自選清單' };
    }
}

export async function removeSymbolFromWatchlist({ symbol }: { symbol: string }) {
    const normalizedSymbol = symbol?.trim().toUpperCase();
    if (!normalizedSymbol) {
        return { success: false, error: '股票代號不正確' };
    }

    const session = await getSessionUser();
    if (!session.success || !session.user) {
        return { success: false, error: session.error || '使用者尚未登入' };
    }

    try {
        await connectToDatabase();
    } catch (err) {
        console.error('removeSymbolFromWatchlist connection error:', err);
        return { success: false, error: '資料庫尚未設定' };
    }

    try {
        await Watchlist.deleteOne({ userId: session.user.id, symbol: normalizedSymbol });
        return { success: true };
    } catch (err) {
        console.error('removeSymbolFromWatchlist error:', err);
        return { success: false, error: '無法更新自選清單' };
    }
}
