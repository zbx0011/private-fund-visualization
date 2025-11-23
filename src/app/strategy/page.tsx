'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StrategyBarChart } from '@/components/charts/strategy-bar-chart'
import { StrategyPieChart } from '@/components/charts/strategy-pie-chart'
import { DataTable } from '@/components/ui/table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface StrategyData {
  strategy: string
  fundCount: number
  avgReturn: number
  avgMaxDrawdown: number
  avgSharpeRatio: number
  avgVolatility: number
  totalAssets: number
  funds: any[]
}

export default function StrategyPage() {
  const [strategyData, setStrategyData] = useState<StrategyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)

  useEffect(() => {
    loadStrategyData()
  }, [])

  const loadStrategyData = async () => {
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

      const { funds } = result.data

      // 按策略分组数据
      const strategyMap = new Map<string, any[]>()

      funds.forEach((fund: any) => {
        const strategy = fund.strategy || '其他'
        if (!strategyMap.has(strategy)) {
          strategyMap.set(strategy, [])
        }
        strategyMap.get(strategy)!.push(fund)
      })

      // 计算每个策略的统计数据
      const strategies: StrategyData[] = Array.from(strategyMap.entries()).map(([strategy, strategyFunds]) => {
        const totalAssets = strategyFunds.reduce((sum, fund) => sum + (fund.total_assets || 0), 0)
        const avgReturn = strategyFunds.reduce((sum, fund) => sum + (fund.cumulative_return || 0), 0) / strategyFunds.length
        const avgMaxDrawdown = strategyFunds.reduce((sum, fund) => sum + (fund.max_drawdown || 0), 0) / strategyFunds.length
        const avgSharpeRatio = strategyFunds.reduce((sum, fund) => sum + (fund.sharpe_ratio || 0), 0) / strategyFunds.length
        const avgVolatility = strategyFunds.reduce((sum, fund) => sum + (fund.volatility || 0), 0) / strategyFunds.length

        return {
          strategy,
          fundCount: strategyFunds.length,
          avgReturn,
          avgMaxDrawdown,
          avgSharpeRatio,
          avgVolatility,
          totalAssets,
          funds: strategyFunds.sort((a, b) => (b.cumulative_return || 0) - (a.cumulative_return || 0))
        }
      }).sort((a, b) => b.avgReturn - a.avgReturn)

      setStrategyData(strategies)

    } catch (err) {
      console.error('加载策略数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const selectedStrategyData = strategyData.find(s => s.strategy === selectedStrategy)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载策略数据...</p>
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
              onClick={loadStrategyData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 准备图表数据
  const barChartData = strategyData.map(item => ({
    strategy: item.strategy,
    avgReturn: item.avgReturn,
    avgDrawdown: Math.abs(item.avgMaxDrawdown),
    sharpeRatio: item.avgSharpeRatio * 10, // 放大显示
    fundCount: item.fundCount
  }))

  const pieChartData = strategyData.map(item => ({
    strategy: item.strategy,
    value: item.totalAssets,
    count: item.fundCount
  }))

  const strategyColumns = [
    { key: 'strategy', title: '策略类型', sortable: true },
    { key: 'fundCount', title: '基金数量', sortable: true, format: 'number' },
    { key: 'avgReturn', title: '平均收益率', sortable: true, format: 'percent' },
    { key: 'avgMaxDrawdown', title: '平均最大回撤', sortable: true, format: 'percent' },
    { key: 'avgSharpeRatio', title: '平均夏普比率', sortable: true, format: 'number' },
    { key: 'totalAssets', title: '总规模', sortable: true, format: 'currency' }
  ]

  const fundColumns = [
    { key: 'name', title: '基金名称', sortable: true },
    { key: 'manager', title: '投资经理', sortable: true },
    { key: 'cumulative_return', title: '累计收益率', sortable: true, format: 'percent' },
    { key: 'max_drawdown', title: '最大回撤', sortable: true, format: 'percent' },
    { key: 'sharpe_ratio', title: '夏普比率', sortable: true, format: 'number' },
    { key: 'total_assets', title: '规模', sortable: true, format: 'currency' }
  ]

  const bestStrategy = strategyData.length > 0 ? strategyData[0] : null
  const worstStrategy = strategyData.length > 0 ? strategyData[strategyData.length - 1] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">策略分析</h1>
          <p className="text-gray-600 mt-2">按投资策略分析基金表现和风险收益特征</p>
        </div>

        {/* 策略概览指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {bestStrategy && (
            <MetricCard
              title="最佳策略"
              value={bestStrategy.avgReturn}
              format="percent"
              changeLabel={bestStrategy.strategy}
            />
          )}
          {worstStrategy && (
            <MetricCard
              title="最大回撤最小策略"
              value={Math.abs(worstStrategy.avgMaxDrawdown)}
              format="percent"
              changeLabel={worstStrategy.strategy}
            />
          )}
          <MetricCard
            title="策略总数"
            value={strategyData.length}
            format="number"
          />
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 策略收益对比 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📊</span>
                策略收益对比
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyBarChart data={barChartData} />
            </CardContent>
          </Card>

          {/* 资产规模分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">🥧</span>
                资产规模分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StrategyPieChart data={pieChartData} />
            </CardContent>
          </Card>
        </div>

        {/* 策略详细数据表 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>策略详细数据</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={strategyData}
              columns={strategyColumns}
              onRowClick={(row) => setSelectedStrategy(row.strategy)}
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* 选中策略的基金列表 */}
        {selectedStrategyData && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedStrategyData.strategy} - 基金列表
                <button
                  onClick={() => setSelectedStrategy(null)}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  清除选择
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedStrategyData.fundCount}
                  </div>
                  <div className="text-sm text-gray-600">基金数量</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercent(selectedStrategyData.avgReturn)}
                  </div>
                  <div className="text-sm text-gray-600">平均收益率</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {formatCurrency(selectedStrategyData.totalAssets)}
                  </div>
                  <div className="text-sm text-gray-600">总规模</div>
                </div>
              </div>
              <DataTable
                data={selectedStrategyData.funds}
                columns={fundColumns}
                pageSize={5}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}