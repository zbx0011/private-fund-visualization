'use client'

import { Navigation } from '@/components/ui/navigation'
import { OverviewModule } from '@/components/modules/OverviewModule'
import { useDashboard } from '@/contexts/DashboardContext'

export default function Home() {
  const { data, yieldCurveData, monitorData, loading, error } = useDashboard()

  // Generate mock overview data (keep this for now as it was in the original page)
  const generateMockOverviewData = () => {
    const data = []
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0-indexed

    let currentValue = 0
    let currentBenchmark = 0

    for (let i = 0; i <= currentMonth; i++) {
      const monthStr = String(i + 1).padStart(2, '0')
      const dateStr = `${currentYear}-${monthStr}-01`

      data.push({
        date: dateStr,
        value: currentValue,
        benchmark: currentBenchmark
      })

      currentValue += (Math.random() * 4 - 1.5)
      currentBenchmark += (Math.random() * 3 - 1)
    }
    return data
  }

  // Merge context data with mock data for OverviewModule
  const overviewModuleData = data ? {
    ...data,
    overviewData: generateMockOverviewData(),
    // Ensure these are passed if OverviewModule expects them from data object
    yieldCurveData,
    monitorData
  } : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <OverviewModule
          initialData={overviewModuleData}
          initialLoading={loading}
          initialError={error}
          // Pass these explicitly as well to be safe, though we merged them above
          yieldCurveData={yieldCurveData}
          monitorData={monitorData}
        />
      </div>
    </div>
  )
}