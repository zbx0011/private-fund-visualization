'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MultiLineChart } from '@/components/charts/multi-line-chart'
import { DataTable, TableColumn } from '@/components/ui/table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatPercent, calculateDateRange } from '@/lib/utils'

interface ChartDataPoint {
  date: string
  [key: string]: any
}

interface Fund {
  id: string
  name: string
  strategy: string
  manager: string
  cumulative_return: number
  max_drawdown: number
  sharpe_ratio: number
  total_assets: number
}

export default function ChartsPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [selectedFunds, setSelectedFunds] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('1Y')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (funds.length > 0) {
      generateChartData()
    }
  }, [funds, selectedFunds, timeRange])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/funds?type=excluded-fof')
      if (!response.ok) {
        throw new Error('获取数据失败')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '数据获取失败')
      }

      const { funds: fundData } = result.data

      // 选择前5个基金作为默认显示
      const topFunds = fundData
        .sort((a: any, b: any) => (b.cumulative_return || 0) - (a.cumulative_return || 0))
        .slice(0, 5) as Fund[]

      setFunds(fundData as Fund[])
      setSelectedFunds(topFunds.map(f => f.name))

    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = () => {
    const dateRange = calculateDateRange(timeRange)
    const data: ChartDataPoint[] = []

    // 生成日期序列
    const currentDate = new Date(dateRange.start)
    const endDate = dateRange.end

    while (currentDate <= endDate) {
      const dateStr = currentDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
      const dataPoint: ChartDataPoint = { date: dateStr }

      // 为每个选中的基金生成数据
      selectedFunds.forEach(fundName => {
        const fund = funds.find(f => f.name === fundName)
        if (fund) {
          // 生成模拟的收益率曲线
          const baseReturn = fund.cumulative_return
          const volatility = 0.02
          const trend = (currentDate.getTime() - dateRange.start.getTime()) / (endDate.getTime() - dateRange.start.getTime())

          dataPoint[fundName] = baseReturn * trend + (Math.random() - 0.5) * baseReturn * volatility
        }
      })

      data.push(dataPoint)
      currentDate.setDate(currentDate.getDate() + 7) // 按周生成数据点
    }

    setChartData(data)
  }

  const toggleFundSelection = (fundName: string) => {
    setSelectedFunds(prev =>
      prev.includes(fundName)
        ? prev.filter(f => f !== fundName)
        : [...prev, fundName].slice(0, 8) // 最多选择8个基金
    )
  }

  const getSelectedFundData = () => {
    return funds.filter(f => selectedFunds.includes(f.name))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载图表数据...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <p className="text-gray-600 text-lg mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  const fundColumns: TableColumn[] = [
    { key: 'name', title: '基金名称', sortable: true },
    { key: 'strategy', title: '策略', sortable: true },
    { key: 'manager', title: '投资经理', sortable: true },
    { key: 'cumulative_return', title: '累计收益率', sortable: true, format: 'percent' },
    { key: 'max_drawdown', title: '最大回撤', sortable: true, format: 'percent' },
    { key: 'sharpe_ratio', title: '夏普比率', sortable: true, format: 'number' },
    { key: 'total_assets', title: '规模', sortable: true, format: 'currency' }
  ]

  const selectedFundData = getSelectedFundData()
  const avgReturn = selectedFundData.length > 0
    ? selectedFundData.reduce((sum, fund) => sum + fund.cumulative_return, 0) / selectedFundData.length
    : 0

  const totalAssets = selectedFundData.reduce((sum, fund) => sum + fund.total_assets, 0)

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">收益率图表</h1>
          <p className="text-gray-600 mt-2">各私募基金收益率时间序列对比分析</p>
        </div>

        {/* 控制面板 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>图表设置</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 时间范围选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  时间范围
                </label>
                <div className="flex space-x-2">
                  {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${timeRange === range
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      {range === '1M' ? '1月' :
                        range === '3M' ? '3月' :
                          range === '6M' ? '6月' :
                            range === '1Y' ? '1年' : '全部'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 已选择基金统计 */}
              <div>
                <div className="text-sm text-gray-600 mb-2">
                  已选择 {selectedFunds.length} 支基金
                </div>
                <div className="flex space-x-4">
                  <div>
                    <span className="text-xs text-gray-500">平均收益率</span>
                    <div className="font-semibold text-green-600">
                      {formatPercent(avgReturn)}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">总规模</span>
                    <div className="font-semibold">
                      {formatCurrency(totalAssets)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 收益率对比图表 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>收益率对比图表</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedFunds.length > 0 ? (
              <MultiLineChart
                data={chartData}
                funds={selectedFunds}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-lg mb-2">请选择基金进行对比</div>
                  <div className="text-sm">点击下方表格中的基金名称</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计指标 */}
        {selectedFunds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="平均收益率"
              value={avgReturn}
              format="percent"
            />
            <MetricCard
              title="最大回撤(平均)"
              value={selectedFundData.reduce((sum, fund) => sum + Math.abs(fund.max_drawdown), 0) / selectedFundData.length}
              format="percent"
            />
            <MetricCard
              title="夏普比率(平均)"
              value={selectedFundData.reduce((sum, fund) => sum + fund.sharpe_ratio, 0) / selectedFundData.length}
              format="number"
            />
            <MetricCard
              title="总资产规模"
              value={totalAssets}
              format="currency"
            />
          </div>
        )}

        {/* 基金选择列表 */}
        <Card>
          <CardHeader>
            <CardTitle>
              基金选择列表
              {selectedFunds.length > 0 && (
                <button
                  onClick={() => setSelectedFunds([])}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  清除选择 ({selectedFunds.length})
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={funds}
              columns={fundColumns}
              onRowClick={(row) => toggleFundSelection(row.name)}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}