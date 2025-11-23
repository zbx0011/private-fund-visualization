'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { OverviewModule } from '@/components/modules/OverviewModule'

interface DashboardData {
  totalAssets: number
  todayReturn: number
  weeklyReturn: number
  annualReturn: number
  totalReturn: number
  overviewData: Array<{ date: string; value: number; benchmark?: number }>
  strategyData: Array<{ strategy: string; value: number; count: number }>
  funds: any[]
  strategyStats: any[]
  managerStats: any[]
}

const DATA_VERSION = '2025-01-01' // Force reload

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [DATA_VERSION])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch main data (excluding FOF)
      const response = await fetch('/api/funds?type=excluded-fof')
      if (!response.ok) throw new Error('获取数据失败')

      const result = await response.json()
      if (!result.success) throw new Error(result.error || '数据获取失败')

      const { funds, strategyStats, managerStats } = result.data

      // Calculate Overview Metrics
      const totalAssets = funds.reduce((sum: number, fund: any) => sum + (fund.cost || fund.scale || 0), 0)
      const todayReturn = funds.reduce((sum: number, fund: any) => sum + (fund.daily_pnl || 0), 0)

      const weightedWeeklyReturn = totalAssets > 0
        ? funds.reduce((sum: number, fund: any) => sum + ((fund.weekly_return || 0) * (fund.cost || fund.scale || 0)), 0) / totalAssets
        : 0

      const weightedAnnualReturn = totalAssets > 0
        ? funds.reduce((sum: number, fund: any) => sum + ((fund.yearly_return || 0) * (fund.cost || fund.scale || 0)), 0) / totalAssets
        : 0

      const weightedTotalReturn = totalAssets > 0
        ? funds.reduce((sum: number, fund: any) => sum + ((fund.yearly_return || 0) * (fund.cost || fund.scale || 0)), 0) / totalAssets
        : 0

      // Mock Overview Chart Data (replace with real if available)
      const overviewData = generateMockOverviewData()

      // Strategy Distribution
      const strategyData = strategyStats.map((stat: any) => ({
        strategy: stat.strategy,
        value: Math.abs(stat.avg_return) || 0,
        count: stat.fund_count || 0
      }))

      setData({
        totalAssets,
        todayReturn,
        weeklyReturn: weightedWeeklyReturn,
        annualReturn: weightedAnnualReturn,
        totalReturn: weightedTotalReturn,
        overviewData,
        strategyData,
        funds,
        strategyStats,
        managerStats
      })

    } catch (err) {
      console.error('加载仪表板数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const generateMockOverviewData = () => {
    const data = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed
    console.log('Generating mock data for year:', currentYear, 'Month limit:', currentMonth)

    let currentValue = 0
    let currentBenchmark = 0

    for (let i = 0; i <= currentMonth; i++) {
      // Create date as YYYY-MM-DD for correct sorting
      // Use local time construction to avoid timezone issues with toISOString()
      const monthStr = String(i + 1).padStart(2, '0')
      const dateStr = `${currentYear}-${monthStr}-01`

      data.push({
        date: dateStr,
        value: currentValue,
        benchmark: currentBenchmark
      })

      // Update for next month
      currentValue += (Math.random() * 4 - 1.5) // Random change between -1.5% and +2.5%
      currentBenchmark += (Math.random() * 3 - 1) // Random change for benchmark
    }
    return data
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <OverviewModule
          data={data}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  )
}