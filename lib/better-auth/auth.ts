import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

const isAuthReady = () => {
    return Boolean(
        process.env.MONGODB_URI &&
        process.env.BETTER_AUTH_SECRET &&
        process.env.BETTER_AUTH_URL,
    );
};

export const isAuthConfigured = () => isAuthReady();

export const getAuth = async () => {
    if (!isAuthReady()) {
        throw new Error("Authentication is not fully configured");
    }

    if (authInstance) {
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;

    if (!db) {
        throw new Error("MongoDB connection not found!");
    }

    const secret = process.env.BETTER_AUTH_SECRET;

    authInstance = betterAuth({
        database: mongodbAdapter(db as any),
        secret: secret!,
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

    return authInstance;
};
