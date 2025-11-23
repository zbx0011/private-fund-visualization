'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface StrategyBarChartProps {
  data: Array<{
    strategy: string
    avgReturn: number
    avgDrawdown: number
    sharpeRatio: number
    fundCount: number
  }>
}

export function StrategyBarChart({ data }: StrategyBarChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="strategy"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fontSize: 12 }}
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
              name === 'avgReturn' ? '平均收益率' :
              name === 'avgDrawdown' ? '平均最大回撤' : name
            ]}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
          <Legend
            formatter={(value) =>
              value === 'avgReturn' ? '平均收益率' :
              value === 'avgDrawdown' ? '平均最大回撤' : value
            }
          />
          <Bar
            dataKey="avgReturn"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
            name="avgReturn"
          />
          <Bar
            dataKey="avgDrawdown"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
            name="avgDrawdown"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}