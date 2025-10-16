import { betterAuth } from "better-auth";
import {mongodbAdapter} from "better-auth/adapters/mongodb";
import {connectToDatabase} from "@/database/mongoose";
import {nextCookies} from "better-auth/next-js";


let authInstance: ReturnType<typeof betterAuth> | null = null;


export const getAuth = async () => {
    if(authInstance) {
        return authInstance;
    }

    const requiredEnv = ["MONGODB_URI", "BETTER_AUTH_SECRET", "BETTER_AUTH_URL"];
    const missingEnv = requiredEnv.filter((key) => !process.env[key as keyof NodeJS.ProcessEnv]);

    if (missingEnv.length > 0) {
        console.warn(
            `[auth] Missing environment variables: ${missingEnv.join(", ")}. Authentication APIs are disabled until they are configured.`,
        );

        const disabledApi = {
            signUpEmail: async (..._args: unknown[]) => {
                throw new Error("Authentication backend is not configured.");
            },
            signInEmail: async (..._args: unknown[]) => {
                throw new Error("Authentication backend is not configured.");
            },
            signOut: async (..._args: unknown[]) => {
                throw new Error("Authentication backend is not configured.");
            },
        };

        authInstance = { api: disabledApi } as unknown as ReturnType<typeof betterAuth>;
        return authInstance;
    }

    const mongoose = await connectToDatabase();
    const db = mongoose.connection;

    if (!db) {
        throw new Error("MongoDB connection not found!");
    }

    authInstance = betterAuth({
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

    return authInstance;
}

export const auth = await getAuth();