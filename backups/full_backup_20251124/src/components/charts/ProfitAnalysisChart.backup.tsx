'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface ProfitAnalysisChartProps {
    funds: any[]
}

type ViewType = 'product' | 'strategy' | 'manager'
type TimeRange = 'daily' | 'weekly' | 'yearly'

export function ProfitAnalysisChart({ funds }: ProfitAnalysisChartProps) {
    const [viewType, setViewType] = useState<ViewType>('product')
    const [timeRange, setTimeRange] = useState<TimeRange>('daily')

    const chartData = useMemo(() => {
        if (!funds || funds.length === 0) return []

        let data: any[] = []

        // Helper to get value based on time range
        const getValue = (fund: any) => {
            switch (timeRange) {
                case 'daily': return fund.daily_pnl || 0
                case 'weekly': return fund.weekly_return || 0
                case 'yearly': return fund.yearly_return || 0
            }
        }

        if (viewType === 'product') {
            // Filter out funds with 0 cost if needed, or just show all active
            data = funds
                .filter(f => f.status !== '已赎回') // Only show active funds? Or all? Let's show active for now.
                .map(f => ({
                    name: f.name,
                    value: getValue(f),
                    // Extra info for tooltip
                    strategy: f.strategy,
                    manager: f.manager
                }))
                .sort((a, b) => a.value - b.value) // Sort by value ascending (Losses Left, Profits Right)
        } else {
            // Aggregation for Strategy or Manager
            const map = new Map<string, { totalValue: number, totalCost: number, count: number }>()

            funds.forEach(f => {
                if (f.status === '已赎回') return // Skip redeemed for aggregation

                const key = viewType === 'strategy' ? f.strategy : f.manager
                if (!key) return

                if (!map.has(key)) {
                    map.set(key, { totalValue: 0, totalCost: 0, count: 0 })
                }
                const entry = map.get(key)!

                // For Daily PnL, we sum the PnL
                // For Returns, we calculate weighted average based on Cost
                if (timeRange === 'daily') {
                    entry.totalValue += (f.daily_pnl || 0)
                } else {
                    // Weighted sum for returns: return * cost
                    const cost = f.cost || 0
                    const ret = timeRange === 'weekly' ? (f.weekly_return || 0) : (f.yearly_return || 0)
                    entry.totalValue += ret * cost
                    entry.totalCost += cost
                }
                entry.count += 1
            })

            data = Array.from(map.entries()).map(([name, stats]) => {
                let value = 0
                if (timeRange === 'daily') {
                    value = stats.totalValue
                } else {
                    // Weighted Average = (Sum of Return * Cost) / Total Cost
                    value = stats.totalCost > 0 ? stats.totalValue / stats.totalCost : 0
                }
                return { name, value }
            }).sort((a, b) => a.value - b.value)
        }

        return data
    }, [funds, viewType, timeRange])

    const getTitle = () => {
        const viewMap = { product: '基金产品', strategy: '策略', manager: '投资经理' }
        const timeMap = { daily: '当日收益', weekly: '本周收益率', yearly: '本年收益率' }
        return `${viewMap[viewType]} - ${timeMap[timeRange]}分布`
    }

    const formatValue = (val: number) => {
        if (timeRange === 'daily') return formatCurrency(val)
        return formatPercent(val)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <CardTitle>📊 收益分析</CardTitle>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        {/* Left Controls: View Type */}
                        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                            {(['product', 'strategy', 'manager'] as ViewType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setViewType(type)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === type
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {type === 'product' ? '比较产品' : type === 'strategy' ? '比较策略' : '比较投资经理'}
                                </button>
                            ))}
                        </div>

                        {/* Right Controls: Time Range */}
                        <div className="flex bg-gray-100 p-1 rounded-lg self-start">
                            {(['daily', 'weekly', 'yearly'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === range
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {range === 'daily' ? '当日' : range === 'weekly' ? '本周' : '本年'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                interval={0}
                                angle={viewType === 'product' ? -45 : 0}
                                textAnchor={viewType === 'product' ? 'end' : 'middle'}
                                height={viewType === 'product' ? 100 : 30}
                            />
                            <YAxis
                                tickFormatter={(val) => {
                                    if (timeRange === 'daily') {
                                        return (val / 10000).toFixed(0) + '万'
                                    }
                                    return (val * 100).toFixed(1) + '%'
                                }}
                            />
                            <Tooltip
                                formatter={(value: number) => [formatValue(value), timeRange === 'daily' ? '收益' : '收益率']}
                                labelStyle={{ color: '#333' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.value >= 0 ? '#ef4444' : '#22c55e'} // Red for positive, Green for negative (CN style)
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
