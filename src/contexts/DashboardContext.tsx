'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface DashboardContextType {
    data: any
    yieldCurveData: any
    monitorData: any[]
    loading: boolean
    error: string | null
    refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<any>(null)
    const [yieldCurveData, setYieldCurveData] = useState<any>(null)
    const [monitorData, setMonitorData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refreshData = async () => {
        try {
            setLoading(true)
            setError(null)

            // Parallel fetch for all required data
            const [fundsRes, yieldRes, monitorRes] = await Promise.all([
                fetch('/api/funds?type=excluded-fof', { cache: 'no-store' }),
                fetch('/api/yield-curve', { cache: 'no-store' }),
                fetch('/api/monitor?limit=50', { cache: 'no-store' })
            ])

            const fundsJson = await fundsRes.json()
            const yieldJson = await yieldRes.json()
            const monitorJson = await monitorRes.json()

            if (!fundsJson.success) throw new Error(fundsJson.error || 'Failed to fetch funds')

            // Process Funds Data
            const { funds, strategyStats, managerStats } = fundsJson.data

            // Calculate Overview Metrics
            const normalFunds = funds.filter((f: any) => f.status !== '已赎回')

            // 总规模 = 正常基金的成本之和
            const totalAssets = normalFunds.reduce((sum: number, f: any) => sum + (f.cost || 0), 0)

            // 总日均资金占用 = 所有基金的日均资金占用之和（与飞书一致，包含已赎回）
            const totalDailyCapitalUsage = funds.reduce((sum: number, f: any) => sum + (f.daily_capital_usage || 0), 0)

            // 今日收益 = 正常基金的日盈亏之和
            const todayReturn = normalFunds.reduce((sum: number, f: any) => sum + (f.daily_pnl || 0), 0)

            // 七天内收益率 = 本周收益合计 / 日均资金占用合计（包括已赎回）
            const totalWeeklyPnl = funds.reduce((sum: number, f: any) => sum + (f.weekly_pnl || 0), 0)
            const weeklyReturn = totalDailyCapitalUsage ? totalWeeklyPnl / totalDailyCapitalUsage : 0

            // 本年收益 = 所有基金的本年收益之和（与飞书一致，包含已赎回）
            const totalYearlyPnl = funds.reduce((sum: number, f: any) => sum + (f.yearly_pnl || 0), 0)

            // 本年收益率 = 本年收益 / 日均资金占用
            const annualReturn = totalDailyCapitalUsage ? totalYearlyPnl / totalDailyCapitalUsage : 0

            // Map strategy stats
            const strategyData = strategyStats
                .filter((s: any) => !['择时', '宏观'].includes(s.strategy))
                .map((s: any) => ({
                    strategy: s.strategy,
                    value: s.total_cost || 0,
                    count: s.fund_count
                }))

            setData({
                funds,
                strategyStats,
                managerStats,
                totalAssets,
                totalDailyCapitalUsage,
                todayReturn,
                weeklyReturn,
                annualReturn,
                strategyData,
                lastSyncTime: fundsJson.data.lastSyncTime
            })

            if (yieldJson.success) {
                setYieldCurveData(yieldJson.data)
            }

            if (monitorJson.success) {
                setMonitorData(monitorJson.data)
            }

        } catch (err: any) {
            console.error('Dashboard data fetch failed:', err)
            setError(err.message || '加载数据失败')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshData()
    }, [])

    return (
        <DashboardContext.Provider value={{ data, yieldCurveData, monitorData, loading, error, refreshData }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (context === undefined) {
        throw new Error('useDashboard must be used within a DashboardProvider')
    }
    return context
}
