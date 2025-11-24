'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TopFundsChartProps {
  data: Array<{
    name: string
    return: number
    assets?: number
  }>
  maxItems?: number
}

export function TopFundsChart({ data, maxItems = 5 }: TopFundsChartProps) {
  const displayData = data.slice(0, maxItems).map(item => ({
    ...item,
    displayName: item.name.length > 8 ? item.name.substring(0, 8) + '...' : item.name
  }))

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={displayData}
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayName"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 11 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)}%`,
              '收益率'
            ]}
            labelFormatter={(label) => {
              const originalItem = displayData.find(d => d.displayName === label)
              return originalItem ? `基金: ${originalItem.name}` : label
            }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Bar
            dataKey="return"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="收益率"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}