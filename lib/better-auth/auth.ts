import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { connectToDatabase } from "@/database/mongoose";

let authInstance: ReturnType<typeof betterAuth> | null = null;
let authPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

export const getAuth = async () => {
    if (authInstance) {
        return authInstance;
    }

    if (!authPromise) {
        authPromise = (async () => {
            const mongoose = await connectToDatabase();
            const db = mongoose.connection;

            if (!db) {
                throw new Error("MongoDB connection not found!");
            }

            return betterAuth({
                database: mongodbAdapter(db as any),
                secret: process.env.BETTER_AUTH_SECRET,
                baseURL: process.env.BETTER_AUTH_URL,
                emailAndPassword: {
                    enabled: true,
                    disableSignUp: false,
                    requireEmailVerification: false,
                    minPasswordLength: 8,
                    maxPasswordLength: 128,
                    autoSignIn: true,
                },
                plugins: [nextCookies()],
            });
        })();
    }

    authInstance = await authPromise;
    return authInstance;
};

export type AuthClient = Awaited<ReturnType<typeof getAuth>>;

