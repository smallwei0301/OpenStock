'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import { signInWithEmail } from "@/lib/actions/auth.actions";
import { toast } from "sonner";
import {useRouter} from "next/navigation";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";

const SignIn = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error('登入失敗', {
                description: result.error ?? '帳號或密碼有誤，請再試一次。',
            });
        } catch (e) {
            console.error(e);
            toast.error('登入失敗', {
                description: e instanceof Error ? e.message : '登入時發生錯誤。'
            })
        }
    }

    return (
        <>
            <h1 className="form-title">歡迎回來</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label="電子郵件"
                    placeholder="opendevsociety@cc.cc"
                    register={register}
                    error={errors.email}
                    validation={{
                      required: '請輸入電子郵件',
                      pattern: {
                        value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/,
                        message: '請輸入有效的電子郵件地址'
                      }
                    }}
                />

                <InputField
                    name="password"
                    label="密碼"
                    placeholder="請輸入密碼"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: '請輸入密碼', minLength: { value: 8, message: '至少需 8 個字元' } }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? '登入中' : '登入'}
                </Button>

                <FooterLink text="還沒有帳號嗎？" linkText="立即註冊" href="/sign-up" />
                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center"/>
            </form>
        </>
    );
};
export default SignIn;
