'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, TableColumn } from '@/components/ui/table'
import { MetricCard } from '@/components/ui/metric-card'
import { FundChartModal } from '@/components/ui/fund-chart-modal'
import { formatCurrency, formatPercent, formatDate } from '@/lib/utils'
import { Download, Filter, RefreshCw } from 'lucide-react'

interface Fund {
  id: string
  name: string
  strategy: string
  manager: string
  latest_nav_date: string
  weekly_return: number
  daily_return: number
  yearly_return: number
  concentration: number
  cost: number
  max_drawdown: number
  sharpe_ratio: number
  volatility: number
  status: string
  establishment_date?: string
  scale?: number
}

export default function DataPage() {
  const [funds, setFunds] = useState<Fund[]>([])
  const [filteredFunds, setFilteredFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all')
  const [selectedManager, setSelectedManager] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedFund, setSelectedFund] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [funds, selectedStrategy, selectedManager, statusFilter])

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
      // 按策略排序
      const sortedFunds = (fundData as Fund[]).sort((a, b) => {
        // 先按策略类型排序
        const strategyOrder = [
          'CTA策略', '债券策略', '套利策略', '宏观策略',
          '量化中性策略', '多策略', '指数增强策略', '股票多头策略'
        ];

        const aStrategy = a.strategy || '';
        const bStrategy = b.strategy || '';

        const aIndex = strategyOrder.indexOf(aStrategy);
        const bIndex = strategyOrder.indexOf(bStrategy);

        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        } else if (aIndex !== -1) {
          return -1;
        } else if (bIndex !== -1) {
          return 1;
        } else {
          return aStrategy.localeCompare(bStrategy, 'zh-CN');
        }
      });
      setFunds(sortedFunds)

    } catch (err) {
      console.error('加载数据失败:', err)
      setError('加载数据失败，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...funds]

    if (selectedStrategy !== 'all') {
      filtered = filtered.filter(fund => fund.strategy === selectedStrategy)
    }

    if (selectedManager !== 'all') {
      filtered = filtered.filter(fund => fund.manager === selectedManager)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(fund => fund.status === statusFilter)
    }

    setFilteredFunds(filtered)
  }

  const exportToCSV = () => {
    const headers = [
      '基金名称', '策略', '投资经理', '最新净值日期', '本日收益率',
      '本周收益率', '本年收益率', '集中度', '成本',
      '最大回撤', '夏普比率', '波动率', '状态', '成立日期', '当前规模'
    ]

    const csvData = filteredFunds.map(fund => [
      fund.name,
      fund.strategy || '',
      fund.manager || '',
      fund.latest_nav_date || '',
      fund.daily_return || 0,
      fund.weekly_return || 0,
      fund.yearly_return || 0,
      fund.concentration || 0,
      fund.cost || 0,
      fund.max_drawdown || 0,
      fund.sharpe_ratio || 0,
      fund.volatility || 0,
      fund.status || '',
      fund.establishment_date || '',
      fund.scale || 0
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `私募基金数据_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // 获取唯一的策略和经理列表
  const strategies = Array.from(new Set(funds.map(f => f.strategy).filter(Boolean)))
  const managers = Array.from(new Set(funds.map(f => f.manager).filter(Boolean)))
  const statuses = Array.from(new Set(funds.map(f => f.status).filter(Boolean)))

  const fundColumns: TableColumn[] = [
    {
      key: 'name',
      title: '基金名称',
      sortable: true,
      width: '200px',
      clickable: true,
      onCellClick: (row) => {
        setSelectedFund(row.name)
        setIsModalOpen(true)
      }
    },
    { key: 'strategy', title: '策略', sortable: true, width: '120px' },
    { key: 'manager', title: '投资经理', sortable: true, width: '120px' },
    { key: 'latest_nav_date', title: '最新净值日期', sortable: true, format: 'date', width: '120px' },
    { key: 'daily_return', title: '本日收益率', sortable: true, format: 'percent', width: '120px' },
    { key: 'weekly_return', title: '本周收益率', sortable: true, format: 'percent', width: '120px' },
    { key: 'yearly_return', title: '本年收益率', sortable: true, format: 'percent', width: '120px' },
    { key: 'concentration', title: '集中度', sortable: true, format: 'concentration', width: '100px' },
    { key: 'cost', title: '成本', sortable: true, format: 'currency', width: '120px' },
    { key: 'max_drawdown', title: '最大回撤', sortable: true, format: 'percent-unsigned', width: '120px' },
    { key: 'sharpe_ratio', title: '夏普比率', sortable: true, format: 'number', width: '100px' },
    { key: 'volatility', title: '波动率', sortable: true, format: 'percent-unsigned', width: '100px' },
    { key: 'status', title: '状态', sortable: true, width: '100px' }
  ]

  // 统计计算：只计算正常基金
  const normalFunds = funds.filter(fund => fund.status === '正常');
  const totalCost = normalFunds.reduce((sum, fund) => sum + (fund.cost || 0), 0);

  // 本年收益率计算：正常基金的本年收益总和 / 正常基金的成本总和
  const totalYearlyIncome = normalFunds.reduce((sum, fund) => {
    const cost = fund.cost || 0;
    const yearlyReturn = fund.yearly_return || 0;
    // 将收益率转回收益金额
    return sum + (yearlyReturn * cost / 100);
  }, 0);

  const overallYearlyReturn = totalCost > 0 ? (totalYearlyIncome / totalCost) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">正在加载数据表...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">详细数据表</h1>
          <p className="text-gray-600 mt-2">完整的私募基金数据展示和分析</p>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="基金总数"
            value={normalFunds.length}
            format="number"
          />
          <MetricCard
            title="总成本"
            value={totalCost}
            format="currency"
          />
          <MetricCard
            title="本年收益率"
            value={overallYearlyReturn}
            format="percent"
          />
        </div>

        {/* 筛选器 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              数据筛选
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 策略筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  策略筛选
                </label>
                <select
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部策略</option>
                  {strategies.map(strategy => (
                    <option key={strategy} value={strategy}>{strategy}</option>
                  ))}
                </select>
              </div>

              {/* 投资经理筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  投资经理
                </label>
                <select
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部经理</option>
                  {managers.map(manager => (
                    <option key={manager} value={manager}>{manager}</option>
                  ))}
                </select>
              </div>

              {/* 状态筛选 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基金状态
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">全部状态</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-end space-x-2">
                <button
                  onClick={loadData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新数据
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={filteredFunds.length === 0}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出CSV
                </button>
              </div>
            </div>

            {/* 筛选结果统计 */}
            <div className="mt-4 text-sm text-gray-600">
              显示 {filteredFunds.length} / {funds.length} 条记录
            </div>
          </CardContent>
        </Card>

        {/* 数据表格 */}
        <Card>
          <CardHeader>
            <CardTitle>
              基金详细数据
              <span className="ml-2 text-sm font-normal text-gray-500">
                (点击列标题可排序，点击基金名称查看收益率曲线)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredFunds}
              columns={fundColumns}
              searchable={true}
              pagination={false}
            />
          </CardContent>
        </Card>

        {/* 收益率曲线弹窗 */}
        {selectedFund && (
          <FundChartModal
            fundName={selectedFund}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false)
              setSelectedFund(null)
            }}
          />
        )}
      </div>
    </div>
  )
}