
import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
        return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    try {
        const db = getDatabase()
        const dbInstance = (db as any).db

        const query = `
      SELECT 
        f.name, 
        f.strategy, 
        f.manager, 
        h.nav_date as latest_nav_date, 
        h.daily_pnl, 
        h.daily_return
      FROM fund_nav_history h
      JOIN funds f ON f.name = h.fund_id
      WHERE h.nav_date = ?
      ORDER BY h.daily_pnl DESC
    `

        const rows = await new Promise<any[]>((resolve, reject) => {
            dbInstance.all(query, [date], (err: Error | null, rows: any[]) => {
                if (err) reject(err)
                else resolve(rows)
            })
        })

        // Format the response to match what the chart expects
        const data = rows.map(row => ({
            name: row.name,
            strategy: row.strategy,
            manager: row.manager,
            latest_nav_date: row.latest_nav_date,
            daily_pnl: row.daily_pnl,
            daily_return: row.daily_return
        }))

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching daily PnL:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
