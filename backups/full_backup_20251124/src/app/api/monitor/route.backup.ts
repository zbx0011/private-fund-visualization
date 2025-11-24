import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import {
    getExternalMonitorRecords,
    countExternalMonitorRecords
} from '@/lib/external-monitor-db'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)

        const filters = {
            importance: searchParams.get('importance') || undefined,
            sentiment: searchParams.get('sentiment') || undefined,
            enterprise: searchParams.get('enterprise') || undefined,
            limit: Number(searchParams.get('limit')) || 100,
            offset: Number(searchParams.get('offset')) || 0
        }

        const records = getExternalMonitorRecords(filters)
        const total = countExternalMonitorRecords(filters)

        return NextResponse.json({
            success: true,
            data: records,
            total,
            page: Math.floor(filters.offset / filters.limit) + 1,
            pageSize: filters.limit
        }, {
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            }
        })

    } catch (error) {
        console.error('External Monitor API Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch external monitor data'
        }, { status: 500 })
    }
}
