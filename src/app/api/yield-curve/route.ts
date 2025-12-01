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

        // 1. Group raw data by fund and week (keeping cumulative_nav)
        const fundWeeklyNavs = new Map<string, Map<string, number>>()
        const fundLatestDates = new Map<string, string>()

        rawData.forEach((row: any) => {
            const dateStr = row.date
            const weekDate = getWeekEndingDate(dateStr)
            const fundId = row.fund_id

            if (!fundWeeklyNavs.has(fundId)) {
                fundWeeklyNavs.set(fundId, new Map())
            }
            // Always overwrite to get the last NAV of the week (since rawData is sorted by date)
            fundWeeklyNavs.get(fundId)!.set(weekDate, row.cumulative_nav)

            // Track latest date for this fund
            const currentLatest = fundLatestDates.get(fundId) || ''
            if (dateStr > currentLatest) {
                fundLatestDates.set(fundId, dateStr)
            }
        })

        // 2. Calculate Yields using Implied Start NAV
        // Formula: Start_Nav = Latest_Nav / (1 + Yearly_Return)
        // Yield_t = (Nav_t - Start_Nav) / Start_Nav

        const fundWeeklyReturns = new Map<string, Map<string, number>>()

        fundWeeklyNavs.forEach((weeklyNavs, fundId) => {
            const fundInfo = funds.find((f: any) => f.record_id === fundId || f.name === fundId)

            if (!fundInfo) return

            const sortedWeeks = Array.from(weeklyNavs.keys()).sort()
            const latestWeek = sortedWeeks[sortedWeeks.length - 1]
            const latestNav = weeklyNavs.get(latestWeek)

            if (!latestNav) return

            let startNav = 0
            const yearlyReturn = fundInfo.yearly_return

            // If we have a valid yearly_return, use it to back-calculate start NAV
            if (typeof yearlyReturn === 'number' && !isNaN(yearlyReturn)) {
                startNav = latestNav / (1 + yearlyReturn)
            } else {
                // Fallback: Use the first available NAV in the series (Yield starts at 0)
                const firstWeek = sortedWeeks[0]
                startNav = weeklyNavs.get(firstWeek) || 1
            }

            // Calculate yields
            const yields = new Map<string, number>()
            weeklyNavs.forEach((nav, date) => {
                const y = (startNav > 0) ? (nav - startNav) / startNav : 0
                yields.set(date, y)
            })

            fundWeeklyReturns.set(fundId, yields)
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
        const fundStrategyMap = new Map<string, string>()
        funds.forEach((f: any) => {
            fundStrategyMap.set(f.record_id, f.strategy)
            fundStrategyMap.set(f.name, f.strategy) // Also map by name as history uses name
        })

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
