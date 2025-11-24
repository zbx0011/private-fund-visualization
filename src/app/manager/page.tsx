'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ManagerRadarChart } from '@/components/charts/manager-radar-chart'
import { TopFundsChart } from '@/components/charts/top-funds-chart'
import { DataTable, TableColumn } from '@/components/ui/table'
import { MetricCard } from '@/components/ui/metric-card'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface ManagerData {
  manager: string
  fundCount: number
  totalAssets: number
  avgReturn: number
  bestFundName: string
  bestFundReturn: number
  funds: any[]
  radarData?: Array<{
    subject: string
    A: number
    B: number
    fullMark: number
  }>
}

export default function ManagerPage() {
  const [managerData, setManagerData] = useState<ManagerData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedManagers, setSelectedManagers] = useState<string[]>([])

  useEffect(() => {
    loadManagerData()
  }, [])

  const loadManagerData = async () => {
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

      // 按投资经理分组数据
      const managerMap = new Map<string, any[]>()

      funds.forEach((fund: any) => {
        const manager = fund.manager || '未知'
        if (!managerMap.has(manager)) {
          managerMap.set(manager, [])
        }
        managerMap.get(manager)!.push(fund)
      })

      // 计算每个经理的统计数据
      const managers: ManagerData[] = Array.from(managerMap.entries()).map(([manager, managerFunds]) => {
        const totalAssets = managerFunds.reduce((sum, fund) => sum + (fund.total_assets || 0), 0)
        const avgReturn = managerFunds.reduce((sum, fund) => sum + (fund.cumulative_return || 0), 0) / managerFunds.length
        const bestFund = managerFunds.reduce((best, fund) =>
          (fund.cumulative_return || 0) > (best.cumulative_return || 0) ? fund : best
          , managerFunds[0])

        // 生成雷达图数据
        const radarData = [
          { subject: '收益率', A: avgReturn * 5, B: 75, fullMark: 100 },
          { subject: '管理规模', A: Math.min((totalAssets / 1000000000) * 10, 100), B: 80, fullMark: 100 },
          { subject: '基金数量', A: Math.min(managerFunds.length * 10, 100), B: 70, fullMark: 100 },
          { subject: '夏普比率', A: Math.min((managerFunds.reduce((sum, fund) => sum + (fund.sharpe_ratio || 0), 0) / managerFunds.length) * 25, 100), B: 85, fullMark: 100 },
          { subject: '风险控制', A: Math.max(0, 100 - Math.abs(managerFunds.reduce((sum, fund) => sum + (fund.max_drawdown || 0), 0) / managerFunds.length) * 10), B: 90, fullMark: 100 }
        ]

        return {
          manager,
          fundCount: managerFunds.length,
          totalAssets,
          avgReturn,
          bestFundName: bestFund.name,
          bestFundReturn: bestFund.cumulative_return || 0,
          funds: managerFunds.sort((a, b) => (b.cumulative_return || 0) - (a.cumulative_return || 0)),
          radarData
        }
      }).sort((a, b) => b.avgReturn - a.avgReturn)

      setManagerData(managers)
    } catch (err) {
      console.error('加载经理数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const toggleManagerSelection = (manager: string) => {
    setSelectedManagers(prev =>
      prev.includes(manager)
        ? prev.filter(m => m !== manager)
        : [...prev, manager].slice(0, 2) // 最多选择2个经理进行对比
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载投资经理数据...</p>
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
              onClick={loadManagerData}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 准备数据
  const topManagers = managerData.slice(0, 10).map(manager => ({
    name: manager.manager,
    return: manager.avgReturn,
    assets: manager.totalAssets
  }))

  const managerColumns: TableColumn[] = [
    { key: 'manager', title: '投资经理', sortable: true },
    { key: 'fundCount', title: '基金数量', sortable: true, format: 'number' },
    { key: 'totalAssets', title: '管理规模', sortable: true, format: 'currency' },
    { key: 'avgReturn', title: '平均收益率', sortable: true, format: 'percent' },
    { key: 'bestFundReturn', title: '最佳基金收益', sortable: true, format: 'percent' },
    { key: 'bestFundName', title: '最佳基金', sortable: true }
  ]

  const fundColumns: TableColumn[] = [
    { key: 'name', title: '基金名称', sortable: true },
    { key: 'strategy', title: '投资策略', sortable: true },
    { key: 'cumulative_return', title: '累计收益率', sortable: true, format: 'percent' },
    { key: 'max_drawdown', title: '最大回撤', sortable: true, format: 'percent' },
    { key: 'sharpe_ratio', title: '夏普比率', sortable: true, format: 'number' },
    { key: 'total_assets', title: '规模', sortable: true, format: 'currency' }
  ]

  const topManager = managerData.length > 0 ? managerData[0] : null

  // 准备雷达图数据
  const radarData = selectedManagers.length === 2
    ? managerData
      .filter(m => selectedManagers.includes(m.manager))
      .reduce((acc, manager) => {
        if (acc.length === 0) {
          return manager.radarData || []
        }
        return acc.map((item, index) => ({
          ...item,
          [selectedManagers.indexOf(manager.manager) === 0 ? 'A' : 'B']:
            manager.radarData?.[index]?.[selectedManagers.indexOf(manager.manager) === 0 ? 'A' : 'B'] || 0
        }))
      }, [] as any[])
    : []

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">投资经理分析</h1>
          <p className="text-gray-600 mt-2">各投资经理的业绩表现和管理能力对比</p>
        </div>

        {/* 经理概览指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topManager && (
            <MetricCard
              title="最佳经理"
              value={topManager.avgReturn}
              format="percent"
              changeLabel={topManager.manager}
            />
          )}
          <MetricCard
            title="经理总数"
            value={managerData.length}
            format="number"
          />
          <MetricCard
            title="平均管理规模"
            value={managerData.length > 0
              ? managerData.reduce((sum, m) => sum + m.totalAssets, 0) / managerData.length
              : 0}
            format="currency"
          />
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 经理排行榜 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">🏆</span>
                经理收益排行榜
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopFundsChart data={topManagers} maxItems={8} />
            </CardContent>
          </Card>

          {/* 经理能力对比 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="mr-2">📊</span>
                经理能力对比
                <span className="ml-auto text-sm text-gray-500">
                  选择2个经理进行对比
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedManagers.length === 2 ? (
                <ManagerRadarChart
                  data={radarData}
                  managers={selectedManagers}
                />
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <div className="text-lg mb-2">选择经理进行对比</div>
                    <div className="text-sm">点击下方表格中的经理名称</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 经理详细数据表 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              经理详细数据
              {selectedManagers.length > 0 && (
                <button
                  onClick={() => setSelectedManagers([])}
                  className="ml-4 text-sm text-blue-600 hover:text-blue-800"
                >
                  清除选择 ({selectedManagers.length})
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={managerData}
              columns={managerColumns}
              onRowClick={(row) => toggleManagerSelection(row.manager)}
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* 选中经理的基金列表 */}
        {selectedManagers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedManagers.join(', ')} - 管理基金列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={managerData
                  .filter(m => selectedManagers.includes(m.manager))
                  .flatMap(m => m.funds.map(f => ({ ...f, manager: m.manager })))
                }
                columns={fundColumns}
                pageSize={8}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}