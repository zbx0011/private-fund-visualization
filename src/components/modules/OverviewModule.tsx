'use client'

import { useState, useEffect } from 'react'
import { MetricCard } from '@/components/ui/metric-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { YieldCurveChart } from '@/components/charts/YieldCurveChart'
import { StrategyDistributionChart } from '@/components/charts/StrategyDistributionChart'
import { formatCurrency } from '@/lib/utils'

import { ProfitAnalysisChart } from '@/components/charts/ProfitAnalysisChart'

const STRATEGY_TYPES = [
    '指增',
    '中性',
    'CTA',
    'T0',
    '套利',
    '量选',
    '混合',
    '期权',
    '择时对冲',
    '可转债'
]

interface OverviewModuleProps {
    initialData: any
    initialLoading?: boolean
    initialError?: string | null
    yieldCurveData?: any
    monitorData?: any[]
}

export function OverviewModule({
    initialData,
    initialLoading = false,
    initialError,
    yieldCurveData: propYieldCurveData,
    monitorData: propMonitorData
}: OverviewModuleProps) {
    const [data, setData] = useState<any>(initialData)
    const [loading, setLoading] = useState(initialLoading)
    const [selectedStrategy, setSelectedStrategy] = useState<string>('all')

    // Use props directly or default to empty
    const monitorData = propMonitorData || []
    const yieldCurveData = propYieldCurveData || null

    // Update local data state when initialData changes (from context refresh)
    useEffect(() => {
        if (initialData) {
            setData(initialData)
        }
    }, [initialData])

    useEffect(() => {
        setLoading(initialLoading)
    }, [initialLoading])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">正在加载数据...</p>
                </div>
            </div>
        )
    }

    if (initialError || !data) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <p className="text-gray-600 text-lg mb-4">{initialError || '数据加载失败'}</p>
                </div>
            </div>
        )
    }

    // Helper to get the Friday of the week for a given date
    const getWeekEndingDate = (dateStr: string) => {
        const date = new Date(dateStr)
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -2 : 5) // Adjust to Friday
        const friday = new Date(date.setDate(diff))
        return friday.toISOString().split('T')[0]
    }

    // Process data for the chart
    const getChartData = () => {
        if (!yieldCurveData || !data?.funds) return { chartData: [], series: [] }

        // ---------------------------------------------------------
        // Scenario 1: "All Strategies" - Use Pre-aggregated Data
        // ---------------------------------------------------------
        if (selectedStrategy === 'all') {
            return {
                chartData: yieldCurveData.strategyChartData || [],
                series: yieldCurveData.strategySeries || []
            }
        }

        // ---------------------------------------------------------
        // Scenario 2: Specific Strategy - Use Pre-aggregated Fund Data
        // ---------------------------------------------------------
        const filteredFunds = data.funds.filter((f: any) => f.strategy === selectedStrategy)

        // Collect all dates from the relevant funds
        const allDates = new Set<string>()
        const fundSeries: any[] = []

        // Store baseline (first value) for each fund to normalize to 0%
        const fundBaselines = new Map<string, number>()

        filteredFunds.forEach((fund: any) => {
            const fundData = yieldCurveData.fundDataMap?.[fund.record_id]
            // Fallback to name if record_id not found (handling the linkage issue)
            const fundDataByName = yieldCurveData.fundDataMap?.[fund.name]

            const actualData = fundData || fundDataByName

            if (!actualData) return

            // Find the first (earliest) date and its value as baseline
            const dates = Object.keys(actualData).sort()
            if (dates.length > 0) {
                const firstValue = actualData[dates[0]]
                fundBaselines.set(fund.record_id, firstValue)
            }

            fundSeries.push({
                id: fund.record_id,
                name: fund.name,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                strokeWidth: 2,
                yearlyKey: `${fund.record_id}_yearly`
            })

            Object.keys(actualData).forEach(date => allDates.add(date))
        })

        const sortedDates = Array.from(allDates).sort()

        const chartData = sortedDates.map(date => {
            const point: any = { date }
            filteredFunds.forEach((fund: any) => {
                const fundData = yieldCurveData.fundDataMap?.[fund.record_id]
                const fundDataByName = yieldCurveData.fundDataMap?.[fund.name]
                const actualData = fundData || fundDataByName

                if (actualData && actualData[date] !== undefined) {
                    // Normalize: subtract baseline so first point is 0%
                    const baseline = fundBaselines.get(fund.record_id) || 0
                    const normalizedValue = actualData[date] - baseline
                    point[fund.record_id] = normalizedValue
                    point[`${fund.record_id}_yearly`] = normalizedValue
                }
            })
            return point
        })

        return { chartData, series: fundSeries }
    }

    const { chartData, series } = getChartData()

    return (
        <div className="space-y-4">
            {/* 1. 核心指标 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <MetricCard
                    title="总规模"
                    value={data.totalAssets}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="总日均资金占用"
                    value={data.totalDailyCapitalUsage}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="今日收益"
                    subtitle="累计收益差（费前）*份额"
                    value={data.todayReturn}
                    format="currency"
                    className="col-span-1"
                />
                <MetricCard
                    title="七天内收益率"
                    subtitle="累计收益差（费前）*份额/日均资金占用"
                    value={data.weeklyReturn}
                    format="percent"
                    className="col-span-1"
                />
                <MetricCard
                    title="本年收益率"
                    subtitle="费后收益/日均资金占用"
                    value={data.annualReturn}
                    format="percent"
                    className="col-span-1"
                />
            </div>

            {/* 2. 近期事件提示 */}
            <Card>
                <CardHeader className="py-2">
                    <CardTitle className="text-sm text-gray-900">🔔 近期事件提示</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                    <div className="flex flex-wrap gap-2">
                        {/* 1. 外部信息监控中一周内有负面消息的 */}
                        {monitorData
                            .filter((m: any) => {
                                const isNegative = m.sentiment === '负面'
                                // Use m.date as the source of truth, fallback to created_at if needed
                                const dateStr = m.date || m.created_at
                                if (!dateStr) return false

                                const date = new Date(dateStr)
                                const oneWeekAgo = new Date()
                                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                                // Reset time part for accurate date comparison
                                oneWeekAgo.setHours(0, 0, 0, 0)

                                return isNegative && date >= oneWeekAgo
                            })
                            .map((m: any, i: number) => (
                                <a
                                    key={`monitor-${i}`}
                                    href={m.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-red-100 border border-red-200 rounded-md text-red-800 text-xs font-medium flex items-center shadow-sm hover:bg-red-200 transition-colors cursor-pointer"
                                >
                                    <span className="mr-1">📢</span>
                                    <span>负面: {m.title} ({m.date})</span>
                                </a>
                            ))}

                        {/* 2. 产品数据中本日收益大于十万或者亏损大于十万（也就是小于-10万）的产品 */}
                        {data.funds
                            .filter((f: any) => f.status !== '已赎回' && Math.abs(f.daily_pnl) > 100000)
                            .map((f: any, i: number) => (
                                <div
                                    key={`pnl-${i}`}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center shadow-sm border ${f.daily_pnl > 0
                                        ? 'bg-red-50 border-red-100 text-red-700'
                                        : 'bg-green-50 border-green-100 text-green-700'
                                        }`}
                                >
                                    <span className="mr-1">{f.daily_pnl > 0 ? '📈' : '📉'}</span>
                                    <span>
                                        {f.daily_pnl > 0
                                            ? `当日大额盈利: ${f.name} (+${formatCurrency(f.daily_pnl)})`
                                            : `当日大额亏损: ${f.name} (${formatCurrency(f.daily_pnl)})`
                                        }
                                    </span>
                                </div>
                            ))}

                        {/* 3. 产品数据中集中度大于10%的产品（不包括比说碧烁太极二号） */}
                        {data.funds
                            .filter((f: any) => f.status !== '已赎回' && f.concentration > 0.1 && f.name !== '碧烁太极二号')
                            .map((f: any, i: number) => (
                                <div key={`conc-${i}`} className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs font-medium flex items-center shadow-sm">
                                    <span className="mr-1">⚠️</span>
                                    <span>高集中度: {f.name} ({(f.concentration * 100).toFixed(2)}%)</span>
                                </div>
                            ))}

                        {/* 4. 出现当日的某类策略收益大于30万或者亏损大于30万（也就是小于-30万） */}
                        {(() => {
                            const strategyPnl = new Map<string, number>()
                            data.funds.forEach((f: any) => {
                                if (f.status !== '已赎回' && f.strategy && f.daily_pnl) {
                                    strategyPnl.set(f.strategy, (strategyPnl.get(f.strategy) || 0) + f.daily_pnl)
                                }
                            })
                            return Array.from(strategyPnl.entries())
                                .filter(([_, pnl]) => Math.abs(pnl) > 300000)
                                .map(([strategy, pnl], i) => (
                                    <div
                                        key={`strat-${i}`}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center shadow-sm border ${pnl > 0
                                            ? 'bg-orange-50 border-orange-100 text-orange-700'
                                            : 'bg-blue-50 border-blue-100 text-blue-700'
                                            }`}
                                    >
                                        <span className="mr-1">{pnl > 0 ? '🚀' : '🌊'}</span>
                                        <span>策略{pnl > 0 ? '大涨' : '大跌'}: {strategy} ({formatCurrency(pnl)})</span>
                                    </div>
                                ))
                        })()}

                        {/* Fallback if no events */}
                        {(!monitorData.some((m: any) => {
                            const dateStr = m.date || m.created_at
                            if (!dateStr) return false
                            const date = new Date(dateStr)
                            const oneWeekAgo = new Date()
                            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
                            oneWeekAgo.setHours(0, 0, 0, 0)
                            return m.sentiment === '负面' && date >= oneWeekAgo
                        }) &&
                            !data.funds.some((f: any) => f.status !== '已赎回' && Math.abs(f.daily_pnl) > 100000) &&
                            !data.funds.some((f: any) => f.status !== '已赎回' && f.concentration > 0.1 && f.name !== '碧烁太极二号') &&
                            !Array.from(new Set(data.funds.map((f: any) => f.strategy))).some((s: any) => Math.abs(data.funds.filter((f: any) => f.status !== '已赎回' && f.strategy === s).reduce((sum: number, f: any) => sum + (f.daily_pnl || 0), 0)) > 300000)
                        ) && (
                                <div className="text-gray-500 text-xs italic px-2">暂无重要事件提示</div>
                            )}
                    </div>
                </CardContent>
            </Card>

            {/* 3. 收益比较 */}
            <ProfitAnalysisChart funds={data.funds} lastSyncTime={data.lastSyncTime} />

            {/* 4. 收益率曲线 */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col space-y-4 w-full">
                        <div className="flex items-center justify-between">
                            <CardTitle>📈 收益率曲线</CardTitle>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedStrategy('all')}
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedStrategy === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                全部策略
                            </button>
                            {STRATEGY_TYPES.map((strategy) => (
                                <button
                                    key={strategy}
                                    onClick={() => setSelectedStrategy(strategy)}
                                    className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedStrategy === strategy
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {strategy}
                                </button>
                            ))}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <YieldCurveChart data={chartData} series={series} />
                </CardContent>
            </Card>

            {/* 5. 策略分布 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-gray-900">🥧 策略分布</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.strategyData && data.strategyData.length > 0 ? (
                        <StrategyDistributionChart data={data.strategyData} />
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            暂无策略分布数据
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    )
}
