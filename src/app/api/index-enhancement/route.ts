import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

export async function GET() {
    try {
        const db = getDatabase()

        // 1. Get Basic Pool Funds
        const funds = await db.getAllFunds('basic_pool')

        // 2. Get Market Indices
        const indices = await db.getMarketIndices('2024-01-01')

        // 3. Get Fund Histories
        const fundHistories = await Promise.all(funds.map(async (f: any) => {
            const history = await db.getFundHistory(f.record_id)
            return {
                id: f.record_id,
                name: f.name,
                strategy: f.strategy,
                history: history
            }
        }))

        return NextResponse.json({
            funds: fundHistories,
            indices: indices
        })
    } catch (error) {
        console.error('Error fetching index enhancement data:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
