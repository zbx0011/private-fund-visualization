import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

// API to get yearly returns for a specific year
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const year = searchParams.get('year') || new Date().getFullYear().toString()
        const yearNum = parseInt(year)

        const db = getDatabase()
        const dbInstance = (db as any).db

        // Calculate yearly return for each fund based on first and last NAV of the year
        const results = await new Promise<any[]>((resolve, reject) => {
            const query = `
        WITH year_data AS (
          SELECT 
            fund_id,
            nav_date,
            cumulative_nav,
            ROW_NUMBER() OVER (PARTITION BY fund_id ORDER BY nav_date ASC) as rn_first,
            ROW_NUMBER() OVER (PARTITION BY fund_id ORDER BY nav_date DESC) as rn_last
          FROM fund_nav_history
          WHERE nav_date >= ? AND nav_date < ?
            AND cumulative_nav IS NOT NULL AND cumulative_nav > 0
        ),
        first_last AS (
          SELECT 
            fund_id,
            MAX(CASE WHEN rn_first = 1 THEN cumulative_nav END) as first_nav,
            MAX(CASE WHEN rn_first = 1 THEN nav_date END) as first_date,
            MAX(CASE WHEN rn_last = 1 THEN cumulative_nav END) as last_nav,
            MAX(CASE WHEN rn_last = 1 THEN nav_date END) as last_date
          FROM year_data
          WHERE rn_first = 1 OR rn_last = 1
          GROUP BY fund_id
        )
        SELECT 
          fl.fund_id as name,
          fl.first_nav,
          fl.first_date,
          fl.last_nav,
          fl.last_date,
          CASE 
            WHEN fl.first_nav > 0 THEN (fl.last_nav - fl.first_nav) / fl.first_nav
            ELSE 0
          END as yearly_return,
          f.strategy,
          f.manager,
          f.status,
          f.cost,
          f.daily_capital_usage
        FROM first_last fl
        LEFT JOIN funds f ON f.name = fl.fund_id
        ORDER BY yearly_return DESC
      `

            const startDate = `${yearNum}-01-01`
            const endDate = `${yearNum + 1}-01-01`

            dbInstance.all(query, [startDate, endDate], (err: Error | null, rows: any[]) => {
                if (err) reject(err)
                else resolve(rows || [])
            })
        })

        return NextResponse.json({
            success: true,
            year: yearNum,
            data: results
        })

    } catch (error) {
        console.error('获取年度收益数据失败:', error)
        return NextResponse.json(
            { success: false, error: '获取数据失败' },
            { status: 500 }
        )
    }
}
