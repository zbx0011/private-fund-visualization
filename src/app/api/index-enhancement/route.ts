import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const db = getDatabase()
        const dbInstance = (db as any).db

        // 1. Get unique funds from basic_pool_history with their strategies
        const funds = await new Promise<any[]>((resolve, reject) => {
            dbInstance.all(`
                SELECT DISTINCT fund_name, strategy
                FROM basic_pool_history
                WHERE strategy IS NOT NULL AND strategy != ''
                ORDER BY fund_name
            `, [], (err: any, rows: any[]) => {
                if (err) reject(err)
                else resolve(rows || [])
            })
        })

        // 2. Get Market Indices
        const indices = await db.getMarketIndices('2024-01-01')

        // 3. Get Fund Histories from basic_pool_history
        const fundHistories = await Promise.all(funds.map(async (f: any) => {
            const history = await new Promise<any[]>((resolve, reject) => {
                dbInstance.all(`
                    SELECT nav_date as date, cumulative_nav, unit_nav
                    FROM basic_pool_history 
                    WHERE fund_name = ?
                    ORDER BY nav_date ASC
                `, [f.fund_name], (err: any, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows || [])
                })
            })
            return {
                id: f.fund_name,
                name: f.fund_name,
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
