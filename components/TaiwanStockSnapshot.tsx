import { formatChangePercent, formatLocalizedCurrency, formatTimestampToLocale, getChangeColorClass } from '@/lib/utils';

type TaiwanStockSnapshotProps = {
    quote?: QuoteData | null;
    profile?: ProfileData | null;
};

const TaiwanStockSnapshot = ({ quote, profile }: TaiwanStockSnapshotProps) => {
    const currency = profile?.currency ?? 'TWD';
    const currentPrice = quote?.c;
    const previousClose = quote?.pc;
    const changeValue = currentPrice !== undefined && previousClose !== undefined ? currentPrice - previousClose : undefined;
    const lastUpdated = formatTimestampToLocale(quote?.t);

    const metrics: { label: string; value: string }[] = [
        { label: '開盤', value: formatLocalizedCurrency(quote?.o, currency) },
        { label: '最高', value: formatLocalizedCurrency(quote?.h, currency) },
        { label: '最低', value: formatLocalizedCurrency(quote?.l, currency) },
        { label: '昨收', value: formatLocalizedCurrency(previousClose, currency) },
    ];

    return (
        <section className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-3">
                <div>
                    <p className="text-sm text-gray-500">台股即時報價</p>
                    <h3 className="text-3xl font-semibold text-gray-100">
                        {formatLocalizedCurrency(currentPrice, currency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={getChangeColorClass(quote?.dp)}>
                        {changeValue !== undefined ? formatLocalizedCurrency(changeValue, currency, { maximumFractionDigits: 2 }) : '—'}
                    </span>
                    <span className={getChangeColorClass(quote?.dp)}>{formatChangePercent(quote?.dp) || '—'}</span>
                    {lastUpdated && <span className="text-xs text-gray-500">最後更新：{lastUpdated}</span>}
                </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {metrics.map(({ label, value }) => (
                    <div key={label} className="rounded-xl border border-gray-800/60 bg-gray-900/40 p-4">
                        <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
                        <dd className="mt-2 text-lg font-medium text-gray-100">{value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};

export default TaiwanStockSnapshot;
