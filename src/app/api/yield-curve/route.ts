import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

export async function GET(request: NextRequest) {
    try {
        const db = getDatabase()

        // 1. Fetch all funds to get strategy mapping
        const funds = await db.getAllFunds()

        // 2. Fetch Aggregated Data directly from DB
        const rawData = await db.getYieldCurveData('2025-01-01')

        // Helper to get Friday
        const getWeekEndingDate = (dateStr: string) => {
            const date = new Date(dateStr)
            const day = date.getDay()
            const diff = date.getDate() - day + (day === 0 ? -2 : 5) // Adjust to Friday
            const friday = new Date(date.setDate(diff))
            return friday.toISOString().split('T')[0]
        }

        // --- Aggregation Logic ---

        // A. Prepare Weekly Data for each Fund
        // Map: FundID -> Map<WeekDate, NormalizedReturn>
        const fundWeeklyReturns = new Map<string, Map<string, number>>()
        const fundBaseNavs = new Map<string, number>()

        rawData.forEach((row: any) => {
            const fundId = row.fund_id
            if (!fundBaseNavs.has(fundId)) {
                fundBaseNavs.set(fundId, row.cumulative_nav)
            }
            const baseNav = fundBaseNavs.get(fundId)!

            const dateStr = row.date.split('T')[0]
            const weekDate = getWeekEndingDate(dateStr)

            // Normalized return: (Current - Base) / Base
            const val = baseNav ? (row.cumulative_nav - baseNav) / baseNav : 0

            if (!fundWeeklyReturns.has(fundId)) {
                fundWeeklyReturns.set(fundId, new Map())
            }
            // Last day of week overwrites previous (since rows are sorted by date)
            fundWeeklyReturns.get(fundId)!.set(weekDate, val)
        })

        // B. Aggregate by Strategy
        const strategyWeeklyMap = new Map<string, Map<string, { sum: number, count: number }>>()
        const strategyColors: Record<string, string> = {
            '指增': '#3b82f6',
            '中性': '#10b981',
            'CTA': '#f59e0b',
            'T0': '#8b5cf6',
            '套利': '#ec4899',
            '量选': '#06b6d4',
            '混合': '#f97316',
            '期权': '#6366f1',
            '择时对冲': '#8b5cf6',
            '可转债': '#d946ef'
        }

        // Iterate through funds to build strategy map
        // We need to know strategy for each fund. rawData has it.
        // But rawData is flat history.
        // Let's use funds list for strategy mapping to be safe/clean
        const fundStrategyMap = new Map<string, string>()
        funds.forEach((f: any) => fundStrategyMap.set(f.record_id, f.strategy))

        fundWeeklyReturns.forEach((weeklyMap, fundId) => {
            const strategy = fundStrategyMap.get(fundId)
            if (!strategy || ['择时', '宏观'].includes(strategy)) return

            weeklyMap.forEach((val, weekDate) => {
                if (!strategyWeeklyMap.has(weekDate)) {
                    strategyWeeklyMap.set(weekDate, new Map())
                }
                const weekData = strategyWeeklyMap.get(weekDate)!

                if (!weekData.has(strategy)) {
                    weekData.set(strategy, { sum: 0, count: 0 })
                }
                const stats = weekData.get(strategy)!
                stats.sum += val
                stats.count += 1
            })
        })

        // Convert Strategy Map to Chart Data Array
        const strategyChartData = Array.from(strategyWeeklyMap.entries())
            .map(([date, strategies]) => {
                const point: any = { date }
                strategies.forEach((stats, strategy) => {
                    point[strategy] = stats.sum / stats.count
                    point[`${strategy}_yearly`] = stats.sum / stats.count
                })
                return point
            })
            .sort((a, b) => a.date.localeCompare(b.date))

        // Build Strategy Series
        const strategySeries = Array.from(new Set(funds.map((f: any) => f.strategy).filter(Boolean)))
            .filter(s => !['择时', '宏观'].includes(s as string))
            .map((strategy: any) => ({
                id: strategy,
                name: strategy,
                color: strategyColors[strategy] || `hsl(${Math.random() * 360}, 70%, 50%)`,
                strokeWidth: 2.5,
                yearlyKey: `${strategy}_yearly`
            }))

        // C. Prepare Individual Fund Data
        const fundDataMap: Record<string, Record<string, number>> = {}
        fundWeeklyReturns.forEach((weeklyMap, fundId) => {
            const fundObj: Record<string, number> = {}
            weeklyMap.forEach((val, date) => {
                fundObj[date] = val
            })
            fundDataMap[fundId] = fundObj
        })

        return NextResponse.json({
            success: true,
            data: {
                strategyChartData,
                strategySeries,
                fundDataMap
            }
        })

    } catch (error) {
        console.error('Failed to generate yield curve data:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to generate data' },
            { status: 500 }
        )
    }
}
