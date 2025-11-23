'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OverviewChart } from '@/components/charts/overview-chart'
import { DataTable, TableColumn } from '@/components/ui/table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface FOFFund {
  id: string
  name: string
  strategy: string
  manager: string
  cumulative_return: number
  annualized_return: number
  max_drawdown: number
  sharpe_ratio: number
  volatility: number
  total_assets: number
  latest_nav_date: string
  status: string
}

export default function FOFPage() {
  const [fofFunds, setFofFunds] = useState<FOFFund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFOF, setSelectedFOF] = useState<FOFFund | null>(null)

  useEffect(() => {
    loadFOFData()
  }, [])

  const loadFOFData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/funds?type=fof')
      if (!response.ok) {
        throw new Error('获取数据失败')
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '数据获取失败')
      }

      const { funds } = result.data

      // 筛选第一创业FOF基金
      const fofFunds = funds.filter((fund: any) =>
        fund.name.includes('第一创业')
      ) as FOFFund[]

      setFofFunds(fofFunds)

      // 默认选择第一个FOF
      if (fofFunds.length > 0) {
        setSelectedFOF(fofFunds[0])
      }

    } catch (err) {
      console.error('加载FOF数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载FOF数据...</p>
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
              onClick={loadFOFData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 准备性能对比数据
  const performanceData = [
    { date: '1月', value: selectedFOF?.cumulative_return || 0, benchmark: 8.5 },
    { date: '2月', value: (selectedFOF?.cumulative_return || 0) * 0.9, benchmark: 7.2 },
    { date: '3月', value: (selectedFOF?.cumulative_return || 0) * 0.95, benchmark: 9.1 },
    { date: '4月', value: (selectedFOF?.cumulative_return || 0) * 1.05, benchmark: 8.8 },
    { date: '5月', value: (selectedFOF?.cumulative_return || 0) * 1.1, benchmark: 10.2 },
    { date: '6月', value: (selectedFOF?.cumulative_return || 0) * 1.08, benchmark: 9.5 },
  ]

  // 模拟持仓数据
  const holdingsData = [
    { name: '股票类', value: 40, color: '#3b82f6' },
    { name: '债券类', value: 30, color: '#10b981' },
    { name: '另类投资', value: 20, color: '#f59e0b' },
    { name: '现金类', value: 10, color: '#8b5cf6' },
  ]

  // 模拟子基金数据
  const subFundsData = [
    {
      name: selectedFOF?.name.includes('第一创业') ? '正瀛骐骥17号' : '千衍三涛15号',
      weight: 20,
      return: 15.2,
      contribution: 3.04,
      latestNav: 1.152
    },
    {
      name: selectedFOF?.name.includes('第一创业') ? '千衍三涛15号' : '平方和衡盛36号',
      weight: 15,
      return: 12.8,
      contribution: 1.92,
      latestNav: 1.128
    },
    {
      name: selectedFOF?.name.includes('第一创业') ? '平方和衡盛36号' : '世纪前沿量化对冲9号',
      weight: 18,
      return: 11.5,
      contribution: 2.07,
      latestNav: 1.115
    },
    {
      name: selectedFOF?.name.includes('第一创业') ? '世纪前沿量化对冲9号' : '远澜翠柏1号',
      weight: 12,
      return: 9.3,
      contribution: 1.12,
      latestNav: 1.093
    },
    {
      name: '其他子基金',
      weight: 35,
      return: 8.7,
      contribution: 3.05,
      latestNav: 1.087
    }
  ]

  const fofColumns: TableColumn[] = [
    { key: 'name', title: 'FOF名称', sortable: true },
    { key: 'manager', title: '投资经理', sortable: true },
    { key: 'total_assets', title: '规模', sortable: true, format: 'currency' },
    { key: 'cumulative_return', title: '累计收益率', sortable: true, format: 'percent' },
    { key: 'max_drawdown', title: '最大回撤', sortable: true, format: 'percent-unsigned' },
    { key: 'sharpe_ratio', title: '夏普比率', sortable: true, format: 'number' },
    { key: 'latest_nav_date', title: '最新净值日期', sortable: true }
  ]

  const subFundColumns: TableColumn[] = [
    { key: 'name', title: '子基金名称', sortable: true },
    { key: 'weight', title: '权重', sortable: true, format: 'number' },
    { key: 'return', title: '收益率', sortable: true, format: 'percent' },
    { key: 'contribution', title: '收益贡献', sortable: true, format: 'percent' },
    { key: 'latestNav', title: '最新净值', sortable: true, format: 'number' }
  ]

  const bestFOF = fofFunds.length > 0 ? fofFunds[0] : null

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">FOF专项分析</h1>
          <p className="text-gray-600 mt-2">第一创业FOF和华泰优选43号FOF专项分析</p>
        </div>

        {/* FOF概览指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {bestFOF && (
            <MetricCard
              title="最佳FOF收益"
              value={bestFOF.cumulative_return}
              format="percent"
              changeLabel={bestFOF.name}
            />
          )}
          <MetricCard
            title="FOF总数"
            value={fofFunds.length}
            format="number"
          />
          <MetricCard
            title="FOF总规模"
            value={fofFunds.reduce((sum, fof) => sum + fof.total_assets, 0)}
            format="currency"
          />
        </div>

        {/* FOF选择和概览 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* FOF列表 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>FOF基金列表</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fofFunds.map((fof) => (
                  <div
                    key={fof.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedFOF?.id === fof.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    onClick={() => setSelectedFOF(fof)}
                  >
                    <div className="font-medium text-gray-900">{fof.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {formatPercent(fof.cumulative_return)} · {formatCurrency(fof.total_assets)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 选中FOF详情 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{selectedFOF?.name || '选择FOF查看详情'}</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFOF ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPercent(selectedFOF.cumulative_return)}
                    </div>
                    <div className="text-sm text-gray-600">累计收益率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatPercent(selectedFOF.annualized_return)}
                    </div>
                    <div className="text-sm text-gray-600">年化收益率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {formatCurrency(selectedFOF.total_assets)}
                    </div>
                    <div className="text-sm text-gray-600">基金规模</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedFOF.sharpe_ratio.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">夏普比率</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  请选择一个FOF基金查看详细信息
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {selectedFOF && (
          <>
            {/* 图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* 收益表现 vs 基准 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">📈</span>
                    收益表现 vs 基准
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <OverviewChart data={performanceData} />
                </CardContent>
              </Card>

              {/* 资产配置分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="mr-2">🎯</span>
                    资产配置分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {holdingsData.map((item, index) => (
                      <div key={index} className="flex items-center">
                        <div
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm">{item.value}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${item.value}%`,
                                backgroundColor: item.color
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 子基金表现 */}
            <Card>
              <CardHeader>
                <CardTitle>子基金表现分析</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={subFundsData}
                  columns={subFundColumns}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* 所有FOF对比表 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>FOF基金对比</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={fofFunds}
              columns={fofColumns}
              onRowClick={(row) => setSelectedFOF(row)}
              pageSize={10}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}