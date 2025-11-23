'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'

interface ManagerRadarChartProps {
  data: Array<{
    subject: string
    A: number
    B: number
    fullMark: number
  }>
  managers: string[]
}

export function ManagerRadarChart({ data, managers }: ManagerRadarChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 10 }}
            stroke="#6b7280"
          />
          <Radar
            name={managers[0]}
            dataKey="A"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.3}
          />
          <Radar
            name={managers[1]}
            dataKey="B"
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.3}
          />
          <Tooltip
            formatter={(value: number) => [`${value}`, '得分']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '6px'
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}