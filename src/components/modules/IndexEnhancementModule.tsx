'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { DataTable, TableColumn } from '@/components/ui/table'
import { formatPercent, formatNumber } from '@/lib/utils'
import { X } from 'lucide-react'

// Helper function to shorten fund names by removing common suffixes
const shortenFundName = (name: string): string => {
  return name
    .replace(/私募证券投资基金$/g, '')
    .replace(/私募基金$/g, '')
    .trim()
}

interface FundData {
  id: string
  name: string
  strategy: string
  history: { date: string; cumulative_nav: number; unit_nav: number }[]
}

interface IndexData {
  date: string
  code: string
  name: string
  close: number
}

export function IndexEnhancementModule() {
  const [viewMode, setViewMode] = useState<'nav' | 'excess'>('nav')
  const [selectedStrategy, setSelectedStrategy] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'2025' | 'all'>('2025')
  const [funds, setFunds] = useState<FundData[]>([])
  const [indices, setIndices] = useState<IndexData[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state for individual fund chart
  const [selectedFund, setSelectedFund] = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/index-enhancement')
        const data = await res.json()
        if (data.funds) setFunds(data.funds)
        if (data.indices) setIndices(data.indices)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter products based on strategy
  const filteredFunds = useMemo(() => {
    if (selectedStrategy === 'all') return funds
    return funds.filter(p => p.strategy === selectedStrategy)
  }, [selectedStrategy, funds])

  // Improved Data Processing
  const processedData = useMemo(() => {
    if (loading) return { chartData: [], tableData: [] }

    // 1. Align Dates
    // When a specific strategy is selected, only use dates where those funds have data
    // This ensures the X-axis starts from the earliest date of the selected strategy's products
    const dateSet = new Set<string>()

    // For chart display: use filtered funds' dates as the primary range
    // Add all filtered fund dates first
    filteredFunds.forEach(f => f.history.forEach(h => dateSet.add(h.date)))

    // Also add index dates that fall within the fund date range
    if (dateSet.size > 0) {
      const fundDates = Array.from(dateSet).sort()
      const minFundDate = fundDates[0]
      const maxFundDate = fundDates[fundDates.length - 1]
      indices.forEach(i => {
        if (i.date >= minFundDate && i.date <= maxFundDate) {
          dateSet.add(i.date)
        }
      })
    }

    let dates = Array.from(dateSet).sort()

    // Filter dates based on timeRange
    if (timeRange === '2025') {
      dates = dates.filter(d => d.startsWith('2025'))
    }

    if (dates.length === 0) return { chartData: [], tableData: [] }

    // 2. Create Normalized Series for CHART (affected by timeRange)
    const series: Record<string, { date: string, value: number }[]> = {}

    // Indices for chart
    const uniqueIndexCodes = Array.from(new Set(indices.map(i => i.code)))
    uniqueIndexCodes.forEach(code => {
      let indexData = indices.filter(i => i.code === code).sort((a, b) => a.date.localeCompare(b.date))

      // Filter index data by date range for chart
      if (timeRange === '2025') {
        indexData = indexData.filter(d => d.date.startsWith('2025'))
      }

      if (indexData.length === 0) return
      const startValue = indexData[0].close
      series[`index_${code}`] = indexData.map(d => ({
        date: d.date,
        value: (d.close / startValue) - 1
      }))
    })

    // Funds for chart
    funds.forEach(f => {
      let fundData = f.history.sort((a, b) => a.date.localeCompare(b.date))

      // Filter fund data by date range for chart
      if (timeRange === '2025') {
        fundData = fundData.filter(d => d.date.startsWith('2025'))
      }

      if (fundData.length === 0) return

      const startValue = fundData[0].cumulative_nav || fundData[0].unit_nav || 1

      series[f.id] = fundData.map(d => {
        const val = d.cumulative_nav || d.unit_nav || 0
        return {
          date: d.date,
          value: (val / startValue) - 1
        }
      })
    })

    // 2b. Create Normalized Series for TABLE (always all-time, not affected by timeRange)
    const allTimeSeries: Record<string, { date: string, value: number }[]> = {}

    // Indices for table (all-time)
    uniqueIndexCodes.forEach(code => {
      const indexData = indices.filter(i => i.code === code).sort((a, b) => a.date.localeCompare(b.date))

      if (indexData.length === 0) return
      const startValue = indexData[0].close
      allTimeSeries[`index_${code}`] = indexData.map(d => ({
        date: d.date,
        value: (d.close / startValue) - 1
      }))
    })

    // Funds for table (all-time)
    funds.forEach(f => {
      const fundData = f.history.sort((a, b) => a.date.localeCompare(b.date))

      if (fundData.length === 0) return

      const startValue = fundData[0].cumulative_nav || fundData[0].unit_nav || 1

      allTimeSeries[f.id] = fundData.map(d => {
        const val = d.cumulative_nav || d.unit_nav || 0
        return {
          date: d.date,
          value: (val / startValue) - 1
        }
      })
    })

    // 3. Build Chart Data (uses filtered series)
    const chartData = dates.map(date => {
      const point: any = { date }

      // Add Indices (only in NAV mode)
      if (viewMode === 'nav') {
        uniqueIndexCodes.forEach(code => {
          const s = series[`index_${code}`]
          const item = s?.find(d => d.date === date)
          if (item) point[`index_${code}`] = item.value
        })
      }

      // Add Funds
      filteredFunds.forEach(f => {
        const s = series[f.id]
        const item = s?.find(d => d.date === date)

        if (viewMode === 'nav') {
          if (item) point[f.id] = item.value
        } else {
          // Excess Return
          let benchmarkCode = ''
          const strategy = f.strategy || ''
          if (strategy.includes('300')) benchmarkCode = '000300.SH'
          else if (strategy.includes('500')) benchmarkCode = '000905.SH'
          else if (strategy.includes('1000')) benchmarkCode = '000852.SH'
          else if (strategy.includes('2000')) benchmarkCode = '932000.CSI'
          else benchmarkCode = '000905.SH'

          const indexSeries = series[`index_${benchmarkCode}`]
          const indexItem = indexSeries?.find(d => d.date === date)

          if (item && indexItem) {
            point[f.id] = item.value - indexItem.value
          }
        }
      })
      return point
    })

    // 4. Calculate Table Metrics (uses ALL-TIME series, not affected by timeRange)
    const tableData = filteredFunds.map(f => {
      const fundSeries = allTimeSeries[f.id]
      if (!fundSeries || fundSeries.length === 0) return null

      const finalValue = fundSeries[fundSeries.length - 1].value

      // Calculate annualized return using actual calendar days between first and last date
      // This is more accurate than using data points count (which may be weekly data)
      const firstDate = new Date(fundSeries[0].date)
      const lastDate = new Date(fundSeries[fundSeries.length - 1].date)
      const calendarDays = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
      const years = calendarDays / 365

      // Annualized return = (1 + cumReturn)^(1/years) - 1
      const annualizedReturn = years > 0 ? Math.pow(1 + finalValue, 1 / years) - 1 : finalValue

      // Benchmark
      let benchmarkCode = ''
      const strategy = f.strategy || ''
      if (strategy.includes('300')) benchmarkCode = '000300.SH'
      else if (strategy.includes('500') || strategy.includes('A500')) benchmarkCode = '000905.SH'
      else if (strategy.includes('1000')) benchmarkCode = '000852.SH'
      else if (strategy.includes('2000')) benchmarkCode = '932000.CSI'
      else if (strategy.includes('量化选股') || strategy.includes('全市场')) benchmarkCode = '000906.SH'  // 中证800
      else benchmarkCode = '000905.SH'

      const indexSeries = allTimeSeries[`index_${benchmarkCode}`]
      const finalIndexValue = indexSeries && indexSeries.length > 0 ? indexSeries[indexSeries.length - 1].value : 0

      const cumulativeExcess = indexSeries ? finalValue - finalIndexValue : 0
      const annualizedExcess = years > 0 && indexSeries ? Math.pow(1 + cumulativeExcess, 1 / years) - 1 : cumulativeExcess

      // Volatility & Sharpe
      // Need daily returns
      const dailyReturns = []
      const excessReturns = []
      for (let i = 1; i < fundSeries.length; i++) {
        const ret = (1 + fundSeries[i].value) / (1 + fundSeries[i - 1].value) - 1
        dailyReturns.push(ret)

        if (indexSeries && indexSeries[i] && indexSeries[i - 1]) {
          const idxRet = (1 + indexSeries[i].value) / (1 + indexSeries[i - 1].value) - 1
          excessReturns.push(ret - idxRet)
        }
      }

      const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length
      const stdDev = Math.sqrt(dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length)
      const volatility = stdDev * Math.sqrt(252)
      const sharpeRatio = volatility > 0 ? (annualizedReturn - 0.02) / volatility : 0

      // Tracking Error (standard deviation of excess returns) for Information Ratio
      let trackingError = 0
      if (excessReturns.length > 0) {
        const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length
        trackingError = Math.sqrt(excessReturns.reduce((a, b) => a + Math.pow(b - meanExcess, 2), 0) / excessReturns.length) * Math.sqrt(252)
      }

      // Information Ratio = Annualized Excess Return / Tracking Error
      const informationRatio = trackingError > 0 ? annualizedExcess / trackingError : 0

      // Max Drawdown
      let maxDd = 0
      let peak = -Infinity
      fundSeries.forEach(d => {
        if (d.value > peak) peak = d.value
        const dd = (peak - d.value) / (1 + peak) // Drawdown from peak compound
        // Simplified: just peak - current if log returns, but here simple returns
        // Correct: (Peak NAV - Current NAV) / Peak NAV
        // Here value is cumulative return. NAV = 1 + value.
        const nav = 1 + d.value
        const peakNav = 1 + peak
        const drawdown = (peakNav - nav) / peakNav
        if (drawdown > maxDd) maxDd = drawdown
      })

      // Calmar Ratio = Annualized Return / Max Drawdown
      const calmarRatio = maxDd > 0 ? annualizedReturn / maxDd : 0

      // Start date
      const startDate = fundSeries[0].date

      return {
        ...f,
        shortName: shortenFundName(f.name),
        startDate,
        cumulativeReturn: finalValue,
        annualizedReturn,
        cumulativeExcess,
        annualizedExcess,
        maxDrawdown: maxDd,
        volatility,
        sharpeRatio,
        calmarRatio,
        informationRatio,
      }
    }).filter(Boolean)

    return { chartData, tableData }
  }, [loading, funds, indices, filteredFunds, viewMode, timeRange])


  const columns: TableColumn[] = [
    { key: 'shortName', title: '基金名称', sortable: true, width: '180px' },
    { key: 'strategy', title: '策略', sortable: true, width: '80px' },
    { key: 'startDate', title: '开始日期', sortable: true, width: '100px' },
    { key: 'cumulativeReturn', title: '累计收益率', sortable: true, format: 'percent', width: '100px' },
    { key: 'annualizedReturn', title: '年化收益率', sortable: true, format: 'percent', width: '100px' },
    { key: 'cumulativeExcess', title: '累计超额', sortable: true, format: 'percent', width: '90px' },
    { key: 'annualizedExcess', title: '年化超额', sortable: true, format: 'percent', width: '90px' },
    { key: 'maxDrawdown', title: '最大回撤', sortable: true, format: 'percent-unsigned', width: '90px' },
    { key: 'volatility', title: '年化波动率', sortable: true, format: 'percent-unsigned', width: '100px' },
    { key: 'sharpeRatio', title: '夏普比率', sortable: true, format: 'number', width: '80px' },
    { key: 'calmarRatio', title: '卡玛比率', sortable: true, format: 'number', width: '80px' },
    { key: 'informationRatio', title: '信息比率', sortable: true, format: 'number', width: '80px' },
  ]

  const strategies = ['all', '300指增', '500指增', '1000指增', '2000指增', '量化选股']

  // Custom Tooltip Component - only show fund data, not indices
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Filter out indices (their dataKey starts with 'index_')
      const fundData = payload.filter((entry: any) => !entry.dataKey?.startsWith('index_'))
      if (fundData.length === 0) return null

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-xs max-w-[500px]">
          <p className="font-semibold mb-2 text-gray-700 text-sm">{label}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {fundData.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-gray-600 truncate">{entry.name}</span>
                </div>
                <span className="font-medium font-mono flex-shrink-0" style={{ color: entry.color }}>
                  {formatPercent(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  if (loading) return <div className="p-8 text-center">Loading data...</div>

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Strategy Filter */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <span className="text-sm sm:text-base font-semibold text-gray-700 whitespace-nowrap">策略筛选:</span>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {strategies.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedStrategy(s)}
                  className={`px-2 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-base font-medium rounded-full transition-colors ${selectedStrategy === s
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {s === 'all' ? '全部' : s}
                </button>
              ))}
            </div>
          </div>

          {/* Time Range & View Mode */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-6">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-1 bg-blue-50 p-1.5 sm:p-2 rounded-xl border border-blue-200">
              <button
                onClick={() => setTimeRange('2025')}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${timeRange === '2025'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-600 hover:bg-blue-100'
                  }`}
              >
                2025年
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${timeRange === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-blue-600 hover:bg-blue-100'
                  }`}
              >
                全部时间
              </button>
            </div>

            <div className="flex items-center space-x-1 bg-green-50 p-1.5 sm:p-2 rounded-xl border border-green-200">
              <button
                onClick={() => setViewMode('nav')}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${viewMode === 'nav'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-green-600 hover:bg-green-100'
                  }`}
              >
                净值走势
              </button>
              <button
                onClick={() => setViewMode('excess')}
                className={`px-3 sm:px-5 py-1.5 sm:py-2 text-sm sm:text-base font-bold rounded-lg transition-all ${viewMode === 'excess'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-green-600 hover:bg-green-100'
                  }`}
              >
                超额收益
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">
            {viewMode === 'nav' ? '累计收益走势对比' : '超额收益走势对比'}
          </CardTitle>
          {viewMode === 'nav' && selectedStrategy !== 'all' && (
            <span className="text-sm sm:text-base font-medium text-gray-600 flex items-center gap-2">
              <span className="inline-block w-8 sm:w-10 border-t-2 border-dashed border-gray-500"></span>
              虚线代表指数走势
            </span>
          )}
        </CardHeader>
        <CardContent>
          <div className="h-[280px] sm:h-[350px] lg:h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.chartData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    if (timeRange === '2025') {
                      // Show "1月", "2月" etc.
                      const date = new Date(val);
                      // Only show label if it's the first of the month or roughly so?
                      // Recharts handles tick count, we just format.
                      // If we just return month, we might get duplicates.
                      // But let's try simple formatting first.
                      return `${date.getMonth() + 1}月`
                    }
                    return val
                  }}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  minTickGap={30}
                />
                <YAxis
                  tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Removed Legend as per request (unified annotation in tooltip) */}
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                {/* Indices (only in NAV mode, and only when a specific strategy is selected, not for 'all') */}
                {viewMode === 'nav' && selectedStrategy !== 'all' && ['000300.SH', '000905.SH', '000852.SH', '932000.CSI', '000906.SH'].map((code) => {
                  const name = code === '000300.SH' ? '沪深300'
                    : code === '000905.SH' ? '中证500'
                      : code === '000852.SH' ? '中证1000'
                        : code === '932000.CSI' ? '中证2000'
                          : '中证800'
                  const shortName = code === '000300.SH' ? '300'
                    : code === '000905.SH' ? '500'
                      : code === '000852.SH' ? '1000'
                        : code === '932000.CSI' ? '2000'
                          : '量化选股'
                  // Show the index based on strategy filter
                  if (selectedStrategy === '量化选股' && code !== '000906.SH') return null
                  if (selectedStrategy !== '量化选股' && !selectedStrategy.includes(shortName)) return null
                  return (
                    <Line
                      key={`index_${code}`}
                      type="monotone"
                      dataKey={`index_${code}`}
                      name={name}
                      stroke="#9ca3af"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      connectNulls
                    />
                  )
                })}

                {/* Products */}
                {filteredFunds.map((p, i) => (
                  <Line
                    key={p.id}
                    type="monotone"
                    dataKey={p.id}
                    name={shortenFundName(p.name)}
                    stroke={`hsl(${i * 60 + 200}, 70%, 50%)`}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Horizontal Legend - wrapping */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 px-2 justify-center text-xs sm:text-sm">
            {viewMode === 'nav' && selectedStrategy !== 'all' && (
              <div className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-dashed border-gray-500"></span>
                <span className="text-gray-600">指数</span>
              </div>
            )}
            {filteredFunds.map((p, i) => (
              <div key={p.id} className="flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-4 h-0.5 rounded-full"
                  style={{ backgroundColor: `hsl(${i * 60 + 200}, 70%, 50%)` }}
                ></span>
                <span className="text-gray-700 truncate max-w-[120px]" title={p.name}>{shortenFundName(p.name)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-lg sm:text-xl">产品业绩详情</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs sm:text-base">
            <span className="text-gray-500 font-medium">
              (数据更新于: {
                funds.length > 0
                  ? (() => {
                    const allDates = funds.flatMap(f => f.history?.map(h => h.date) || [])
                    return allDates.sort((a, b) => b.localeCompare(a))[0] || '-'
                  })()
                  : '-'
              })
            </span>
            <span className="text-blue-500 font-medium">(点击产品名称可查看收益率曲线图)</span>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={processedData.tableData}
            columns={columns}
            searchable={true}
            pagination={false}
            onRowClick={(row) => {
              setSelectedFund(row)
              setModalOpen(true)
            }}
          />
        </CardContent>
      </Card>

      {/* Individual Fund Chart Modal */}
      {modalOpen && selectedFund && (
        <FundChartModalInline
          fund={selectedFund}
          funds={funds}
          indices={indices}
          onClose={() => {
            setModalOpen(false)
            setSelectedFund(null)
          }}
        />
      )}
    </div>
  )
}

// Inline Modal Component for Individual Fund Chart with Index
function FundChartModalInline({
  fund,
  funds,
  indices,
  onClose
}: {
  fund: any
  funds: FundData[]
  indices: IndexData[]
  onClose: () => void
}) {
  // Find original fund data with complete history
  const originalFund = funds.find(f => f.id === fund.id) || fund

  // Determine benchmark index based on strategy
  const getBenchmarkCode = (strategy: string) => {
    if (strategy?.includes('300')) return '000300.SH'
    if (strategy?.includes('500') || strategy?.includes('A500')) return '000905.SH'
    if (strategy?.includes('1000')) return '000852.SH'
    if (strategy?.includes('2000')) return '932000.CSI'
    if (strategy?.includes('量化选股') || strategy?.includes('全市场')) return '000906.SH'
    return '000905.SH' // Default to CSI 500
  }

  const getBenchmarkName = (code: string) => {
    switch (code) {
      case '000300.SH': return '沪深300'
      case '000905.SH': return '中证500'
      case '000852.SH': return '中证1000'
      case '932000.CSI': return '中证2000'
      case '000906.SH': return '中证800'
      default: return '指数'
    }
  }

  const benchmarkCode = getBenchmarkCode(fund.strategy)
  const benchmarkName = getBenchmarkName(benchmarkCode)

  // Get fund history from the original fund object with complete history
  const fundHistory = originalFund.history || []
  const sortedHistory = [...fundHistory].sort((a: any, b: any) => a.date.localeCompare(b.date))

  // Get index data
  const indexData = indices
    .filter(i => i.code === benchmarkCode)
    .sort((a, b) => a.date.localeCompare(b.date))

  // Find common date range
  const fundDates = new Set(sortedHistory.map((h: any) => h.date))
  const minFundDate = sortedHistory.length > 0 ? sortedHistory[0].date : ''
  const maxFundDate = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].date : ''

  // Filter index to match fund date range
  const filteredIndex = indexData.filter(i => i.date >= minFundDate && i.date <= maxFundDate)

  // Calculate normalized returns for fund
  const fundStartNav = sortedHistory.length > 0
    ? (sortedHistory[0].cumulative_nav || sortedHistory[0].unit_nav || 1)
    : 1

  const fundChartData = sortedHistory.map((h: any) => ({
    date: h.date,
    fundReturn: ((h.cumulative_nav || h.unit_nav || 1) / fundStartNav - 1)
  }))

  // Calculate normalized returns for index
  const indexStartClose = filteredIndex.length > 0 ? filteredIndex[0].close : 1
  const indexMap = new Map(filteredIndex.map(i => [i.date, (i.close / indexStartClose - 1)]))

  // Merge data
  const allDates = new Set([...fundChartData.map(d => d.date), ...filteredIndex.map(d => d.date)])
  const chartData = Array.from(allDates).sort().map(date => {
    const fundPoint = fundChartData.find(d => d.date === date)
    return {
      date,
      fund: fundPoint?.fundReturn,
      index: indexMap.get(date)
    }
  })

  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return '无日期'
    try {
      const date = new Date(dateStr + 'T00:00:00')
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('zh-CN')
      }
      return dateStr
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate pr-2">{shortenFundName(fund.name)} - 收益率曲线</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 100px)' }}>
          {/* Stats */}
          <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">数据点数</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900">{sortedHistory.length}</div>
            </div>
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">起始日期</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900">
                {formatDateSafe(minFundDate)}
              </div>
            </div>
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg">
              <div className="text-xs sm:text-sm text-gray-600 mb-1">最新日期</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900">
                {formatDateSafe(maxFundDate)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 sm:w-8 h-0.5 bg-blue-500"></span>
              <span className="truncate max-w-[120px] sm:max-w-none">{shortenFundName(fund.name)}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 sm:w-8 border-t-2 border-dashed border-gray-500"></span>
              {benchmarkName}
            </span>
          </div>

          {/* Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-2 sm:p-4">
            <div className="h-[250px] sm:h-[350px] lg:h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return `${d.getMonth() + 1}月`
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `${(value * 100).toFixed(2)}%`,
                      name === 'fund' ? shortenFundName(fund.name) : benchmarkName
                    ]}
                    labelFormatter={(label) => `日期: ${label}`}
                  />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />

                  {/* Fund Line - Solid */}
                  <Line
                    type="monotone"
                    dataKey="fund"
                    name="fund"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />

                  {/* Index Line - Dashed */}
                  <Line
                    type="monotone"
                    dataKey="index"
                    name="index"
                    stroke="#9ca3af"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
