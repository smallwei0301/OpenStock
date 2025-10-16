'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import {signUpWithEmail} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";

const SignUp = () => {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'TW',
            investmentGoals: 'Growth',
            riskTolerance: 'Medium',
            preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    }, );

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error('註冊失敗', {
                description: result.error ?? '無法建立帳號，請稍後再試。',
            });
        } catch (e) {
            console.error(e);
            toast.error('註冊失敗', {
                description: e instanceof Error ? e.message : '建立帳號時發生錯誤。'
            })
        }
    }

    return (
        <>
            <h1 className="form-title">建立帳號並客製體驗</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="fullName"
                    label="姓名"
                    placeholder="請輸入全名"
                    register={register}
                    error={errors.fullName}
                    validation={{ required: '請輸入姓名', minLength: { value: 2, message: '至少需 2 個字元' } }}
                />

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
                    placeholder="請設定安全密碼"
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: '請輸入密碼', minLength: { value: 8, message: '至少需 8 個字元' } }}
                />

                <CountrySelectField
                    name="country"
                    label="居住國家/地區"
                    control={control}
                    error={errors.country}
                    required
                />

                <SelectField
                    name="investmentGoals"
                    label="投資目標"
                    placeholder="選擇你的投資目標"
                    options={INVESTMENT_GOALS}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label="風險承受度"
                    placeholder="選擇可承受的風險等級"
                    options={RISK_TOLERANCE_OPTIONS}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label="偏好產業"
                    placeholder="選擇感興趣的產業"
                    options={PREFERRED_INDUSTRIES}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? '建立帳號中' : '開始投資旅程'}
                </Button>

                <FooterLink text="已經有帳號了嗎？" linkText="前往登入" href="/sign-in" />

                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center"/>
            </form>
        </>
    )
}
export default SignUp;
