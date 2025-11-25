'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface MultiLineChartProps {
  data: Array<{
    date: string
    [key: string]: any
  }>
  funds: string[]
  colors?: string[]
}

export function MultiLineChart({ data, funds, colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'] }: MultiLineChartProps) {
  return (
    <div className="w-full h-96">
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
            formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
            labelFormatter={(label) => `日期: ${label}`}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Legend
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
          {funds.map((fund, index) => (
            <Line
              key={fund}
              type="monotone"
              dataKey={fund}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
              name={fund}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}