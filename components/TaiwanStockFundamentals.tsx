import Link from 'next/link';

import { formatCompactCurrency } from '@/lib/utils';

type TaiwanStockFundamentalsProps = {
    profile?: ProfileData | null;
    financials?: FinancialsData | null;
};

const TaiwanStockFundamentals = ({ profile, financials }: TaiwanStockFundamentalsProps) => {
    const currency = profile?.currency ?? 'TWD';
    const marketCap =
        profile?.marketCapitalization && Number.isFinite(profile.marketCapitalization)
            ? profile.marketCapitalization * 1_000_000_000
            : undefined;
    const peRatio = financials?.metric?.peBasicExclExtraTTM ?? financials?.metric?.peNormalizedAnnual;

    const items: { label: string; value?: string | null; isLink?: boolean }[] = [
        { label: '交易所', value: profile?.exchange },
        { label: '產業', value: profile?.finnhubIndustry },
        { label: '國家 / 地區', value: profile?.country },
        { label: '上市日期', value: profile?.ipo },
        {
            label: '市值 (估算)',
            value: marketCap !== undefined ? formatCompactCurrency(marketCap, currency) : undefined,
        },
        {
            label: '本益比 (TTM)',
            value: Number.isFinite(peRatio) ? Number(peRatio).toFixed(2) : undefined,
        },
        { label: '官方網站', value: profile?.weburl ?? undefined, isLink: true },
    ];

    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 shadow-lg shadow-black/20">
            <h3 className="text-lg font-semibold text-gray-100">基本面速覽</h3>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {items
                    .filter((item) => item.value)
                    .map(({ label, value, isLink }) => (
                        <div key={label} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                            <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                            <dd className="mt-2 text-sm text-gray-100">
                                {isLink && value ? (
                                    <Link
                                        href={value}
                                        className="text-teal-300 transition-colors hover:text-teal-200"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {value}
                                    </Link>
                                ) : (
                                    value
                                )}
                            </dd>
                        </div>
                    ))}
            </dl>
        </section>
    );
};

export default TaiwanStockFundamentals;
