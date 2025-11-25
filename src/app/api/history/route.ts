import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const fundId = searchParams.get('fund_id');

        if (!fundId) {
            return NextResponse.json({ success: false, error: 'Fund ID is required' }, { status: 400 });
        }

        const db = getDatabase();

        const history = await db.getFundHistory(fundId);

        return NextResponse.json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error('History API Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
