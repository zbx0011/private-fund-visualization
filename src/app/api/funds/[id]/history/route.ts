import { getDatabase } from '@/lib/database-server'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const db = getDatabase()
        const dbInstance = (db as any).db
        const { id } = params

        console.log(`[API] Fetching history for fund ID: ${id}`)

        // 1. Get fund name from funds table using ID (which is record_id)
        const fund = await new Promise<any>((resolve, reject) => {
            dbInstance.get(
                'SELECT name FROM funds WHERE record_id = ? OR id = ?',
                [id, id],
                (err: any, row: any) => {
                    if (err) reject(err)
                    else resolve(row)
                }
            )
        })

        if (!fund) {
            console.error(`[API] Fund not found for ID: ${id}`)
            return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
        }

        console.log(`[API] Found fund name: ${fund.name}`)

        // 2. Get history from fund_nav_history using fund name
        // Note: fund_nav_history uses fund name as fund_id
        const history = await new Promise<any[]>((resolve, reject) => {
            dbInstance.all(
                `SELECT 
          nav_date, 
          cumulative_nav, 
          unit_nav, 
          daily_return 
        FROM fund_nav_history 
        WHERE fund_id = ? 
        ORDER BY nav_date ASC`,
                [fund.name],
                (err: any, rows: any[]) => {
                    if (err) reject(err)
                    else resolve(rows || [])
                }
            )
        })

        // Format data for frontend
        const formattedHistory = history.map(item => ({
            date: item.nav_date,
            value: item.cumulative_nav, // Use cumulative NAV for yield curve
            unitNav: item.unit_nav,
            dailyReturn: item.daily_return
        }))

        return NextResponse.json(formattedHistory)
    } catch (error) {
        console.error('Error fetching fund history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch fund history' },
            { status: 500 }
        )
    }
}
