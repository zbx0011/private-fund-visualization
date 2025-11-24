'use client'

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts'
import { formatPercent } from '@/lib/utils'

interface YieldCurveChartProps {
    data: any[] // Array of { date, [fundId]: value, ... }
    series: Array<{
        id: string
        name: string
        color: string
        strokeWidth?: number
        strokeDasharray?: string
        yearlyKey?: string  // Key for yearly return data
    }>
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, series }: any) => {
    if (!active || !payload || payload.length === 0) return null

    // Filter out null/undefined values and sort by return value (highest first)
    const validPayload = payload
        .filter((entry: any) => entry.value !== null && entry.value !== undefined)
        .sort((a: any, b: any) => b.value - a.value)

    if (validPayload.length === 0) return null

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '12px',
            fontSize: '12px',
            maxHeight: '400px',
            overflowY: 'auto',
            minWidth: '220px'
        }}>
            <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                {new Date(label).toLocaleDateString('zh-CN')}
            </p>
            <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                累计收益率
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {validPayload.map((entry: any, index: number) => {
                    // Find the series to get the full name and yearly key
                    const fundSeries = series.find((s: any) => s.id === entry.dataKey)
                    const displayName = fundSeries ? fundSeries.name : entry.name

                    // Display the actual value on the chart (Cumulative Return)
                    const displayValue = entry.value

                    return (
                        <div key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '2px 0'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: entry.color,
                                borderRadius: '50%',
                                flexShrink: 0
                            }} />
                            <span style={{
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                color: '#666'
                            }} title={displayName}>
                                {displayName}
                            </span>
                            <span style={{
                                fontWeight: 'bold',
                                color: displayValue >= 0 ? '#22c55e' : '#ef4444',
                                marginLeft: '8px'
                            }}>
                                {formatPercent(displayValue)}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export function YieldCurveChart({ data, series }: YieldCurveChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                暂无数据
            </div>
        )
    }

    return (
        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        tickFormatter={(value) => {
                            try {
                                const date = new Date(value)
                                if (isNaN(date.getTime())) return value
                                return `${date.getMonth() + 1}月`
                            } catch (e) {
                                return value
                            }
                        }}
                    />
                    <YAxis
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        tick={{ fontSize: 12 }}
                        stroke="#6b7280"
                        domain={['auto', 'auto']}
                    />
                    <Tooltip content={<CustomTooltip series={series} />} />
                    {series.map((s) => (
                        <Line
                            key={s.id}
                            type="monotone"
                            dataKey={s.id}
                            name={s.name}
                            stroke={s.color}
                            strokeWidth={s.strokeWidth || 1.5}
                            strokeDasharray={s.strokeDasharray}
                            dot={false}
                            connectNulls={false}
                            activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
