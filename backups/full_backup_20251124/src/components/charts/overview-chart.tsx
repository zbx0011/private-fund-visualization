'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface OverviewChartProps {
  data: Array<{
    date: string
    value: number
    benchmark?: number
  }>
}

export function OverviewChart({ data }: OverviewChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toFixed(2)}%`, '收益率']}
            labelFormatter={(label) => `日期: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="组合收益率"
          />
          {data.some(d => d.benchmark !== undefined) && (
            <Line
              type="monotone"
              dataKey="benchmark"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
              name="基准收益率"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}