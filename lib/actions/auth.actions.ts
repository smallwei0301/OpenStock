'use server';

import { getAuth, isAuthConfigured } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
    try {
        if (!isAuthConfigured()) {
            return { success: false, error: '驗證服務尚未啟用' };
        }

        const auth = await getAuth();
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } });


        if (response) {
            await inngest.send({
                name: 'app/user.created',
                data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry },
            });
        }

        return { success: true, data: response };
    } catch (e) {
        console.log('註冊失敗', e);
        return { success: false, error: '註冊失敗' };
    }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {

        if (!isAuthConfigured()) {
            return { success: false, error: '驗證服務尚未啟用' };
        }

        const auth = await getAuth();
        const response = await auth.api.signInEmail({ body: { email, password } });


        return { success: true, data: response };
    } catch (e) {
        console.log('登入失敗', e);
        return { success: false, error: '登入失敗' };
    }
};

export const signOut = async () => {
    try {

        if (!isAuthConfigured()) {
            return { success: false, error: '驗證服務尚未啟用' };
        }


        const auth = await getAuth();
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('登出失敗', e);
        return { success: false, error: '登出失敗' };
    }
};
