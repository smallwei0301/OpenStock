import { NextRequest, NextResponse } from 'next/server';

import { getStockCandles, type CandleResolution } from '@/lib/actions/finnhub.actions';

export const dynamic = 'force-dynamic';

const VALID_RESOLUTIONS: CandleResolution[] = ['1', '5', '15', '30', '60', 'D', 'W', 'M'];

const isValidResolution = (value: string): value is CandleResolution =>
    VALID_RESOLUTIONS.includes(value as CandleResolution);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = (searchParams.get('symbol') || '').trim();

    if (!symbol) {
        return NextResponse.json({ error: 'Missing symbol parameter' }, { status: 400 });
    }

    const resolutionParam = (searchParams.get('resolution') || 'D').toUpperCase();
    const resolution: CandleResolution = isValidResolution(resolutionParam) ? resolutionParam : 'D';

    const countParam = Number.parseInt(searchParams.get('count') || '', 10);
    const count = Number.isFinite(countParam) && countParam > 0 ? countParam : undefined;

    try {
        const { candles, reason } = await getStockCandles(symbol, {
            resolution,
            count,
        });

        return NextResponse.json({ candles, reason });
    } catch (error) {
        console.error('GET /api/finnhub/candles error:', error);
        return NextResponse.json({ error: 'Unable to fetch candle data' }, { status: 500 });
    }
}
