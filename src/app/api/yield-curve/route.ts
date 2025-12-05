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

        // 1. Group raw data by fund and week (keeping both cumulative_nav and daily_return)
        const fundWeeklyNavs = new Map<string, Map<string, number>>()
        const fundWeeklyReturns = new Map<string, Map<string, number>>()
        const fundLatestDates = new Map<string, string>()

        rawData.forEach((row: any) => {
            const dateStr = row.date
            const weekDate = getWeekEndingDate(dateStr)
            const fundId = row.fund_id

            if (!fundWeeklyNavs.has(fundId)) {
                fundWeeklyNavs.set(fundId, new Map())
                fundWeeklyReturns.set(fundId, new Map())
            }
            // Always overwrite to get the last NAV and return of the week (since rawData is sorted by date)
            fundWeeklyNavs.get(fundId)!.set(weekDate, row.cumulative_nav)
            // Use daily_return which actually contains yearly return from "本年收益率"
            fundWeeklyReturns.get(fundId)!.set(weekDate, row.daily_return || 0)

            // Track latest date for this fund
            const currentLatest = fundLatestDates.get(fundId) || ''
            if (dateStr > currentLatest) {
                fundLatestDates.set(fundId, dateStr)
            }
        })

        // Note: fundWeeklyReturns now contains the actual yearly returns from the database
        // No need to calculate from NAV anymore

        // B. Aggregate by Strategy
        const strategyWeeklyMap = new Map<string, Map<string, { sum: number, count: number, weightedSum: number, totalCapital: number }>>()
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

        // Iterate through funds to build strategy map and capital map
        const fundStrategyMap = new Map<string, string>()
        const fundCapitalMap = new Map<string, number>()
        const strategyTotalCapitalMap = new Map<string, number>()

        funds.forEach((f: any) => {
            fundStrategyMap.set(f.record_id, f.strategy)
            fundStrategyMap.set(f.name, f.strategy) // Also map by name as history uses name

            // Use 'cost' which corresponds to "日均资金占用" from the Private Fund Profit/Loss Table
            const capital = typeof f.cost === 'number' ? f.cost : 0
            fundCapitalMap.set(f.record_id, capital)
            fundCapitalMap.set(f.name, capital)

            // Accumulate total capital per strategy (Static Denominator)
            if (f.strategy && !['择时', '宏观'].includes(f.strategy)) {
                const currentTotal = strategyTotalCapitalMap.get(f.strategy) || 0
                strategyTotalCapitalMap.set(f.strategy, currentTotal + capital)
            }
        })

        fundWeeklyReturns.forEach((weeklyMap, fundId) => {
            const strategy = fundStrategyMap.get(fundId)
            if (!strategy || ['择时', '宏观'].includes(strategy)) return

            const capital = fundCapitalMap.get(fundId) || 0

            weeklyMap.forEach((val, weekDate) => {
                if (!strategyWeeklyMap.has(weekDate)) {
                    strategyWeeklyMap.set(weekDate, new Map())
                }
                const weekData = strategyWeeklyMap.get(weekDate)!

                if (!weekData.has(strategy)) {
                    // Initialize with static total capital for the strategy
                    const staticTotalCapital = strategyTotalCapitalMap.get(strategy) || 0
                    weekData.set(strategy, { sum: 0, count: 0, weightedSum: 0, totalCapital: staticTotalCapital })
                }
                const stats = weekData.get(strategy)!

                // Simple sum for fallback
                stats.sum += val
                stats.count += 1

                // Weighted sum numerator: accumulate (return * capital) for active funds
                if (capital > 0) {
                    stats.weightedSum += val * capital
                    // Note: stats.totalCapital is already set to the static total and shouldn't be incremented here
                }
            })
        })

        // Convert Strategy Map to Chart Data Array
        const rawStrategyChartData = Array.from(strategyWeeklyMap.entries())
            .map(([date, strategies]) => {
                const point: any = { date }
                strategies.forEach((stats, strategy) => {
                    let yieldValue = 0

                    // Use weighted average with static total capital
                    if (stats.totalCapital > 0) {
                        yieldValue = stats.weightedSum / stats.totalCapital
                    } else if (stats.count > 0) {
                        // Fallback to simple average only if total capital is 0 (unlikely if cost data exists)
                        yieldValue = stats.sum / stats.count
                    }

                    point[strategy] = yieldValue
                    point[`${strategy}_yearly`] = yieldValue
                })
                return point
            })
            .sort((a, b) => a.date.localeCompare(b.date))

        // Normalize: Find baseline (first value) for each strategy and subtract it
        const strategyBaselines = new Map<string, number>()
        if (rawStrategyChartData.length > 0) {
            const firstPoint = rawStrategyChartData[0]
            Object.keys(firstPoint).forEach(key => {
                if (key !== 'date' && !key.endsWith('_yearly')) {
                    strategyBaselines.set(key, firstPoint[key] || 0)
                }
            })
        }

        // Apply normalization to all data points
        const strategyChartData = rawStrategyChartData.map(point => {
            const normalizedPoint: any = { date: point.date }
            Object.keys(point).forEach(key => {
                if (key === 'date') return
                if (key.endsWith('_yearly')) {
                    const baseKey = key.replace('_yearly', '')
                    const baseline = strategyBaselines.get(baseKey) || 0
                    normalizedPoint[key] = point[key] - baseline
                } else {
                    const baseline = strategyBaselines.get(key) || 0
                    normalizedPoint[key] = point[key] - baseline
                }
            })
            return normalizedPoint
        })

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
            { success: false, error: 'Failed to generate data', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
