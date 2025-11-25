'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { YieldCurveChart } from '@/components/charts/YieldCurveChart'

interface FundChartModalProps {
    fundName: string
    isOpen: boolean
    onClose: () => void
}

export function FundChartModal({ fundName, isOpen, onClose }: FundChartModalProps) {
    const [historyData, setHistoryData] = useState<any[]>([])
    const [fundCost, setFundCost] = useState<number>(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && fundName) {
            loadData()
        }
    }, [isOpen, fundName])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const [historyResponse, fundResponse] = await Promise.all([
                fetch(`/api/history?fund_id=${encodeURIComponent(fundName)}`),
                fetch('/api/funds')
            ])

            const historyResult = await historyResponse.json()
            const fundResult = await fundResponse.json()

            if (!historyResult.success) {
                setError(historyResult.error || '加载历史数据失败')
                return
            }

            if (fundResult.success && fundResult.data.funds) {
                const fund = fundResult.data.funds.find((f: any) => f.name === fundName)
                if (fund && fund.cost) {
                    setFundCost(fund.cost)
                }
            }

            setHistoryData(historyResult.data)

        } catch (err) {
            setError('加载数据失败: ' + (err instanceof Error ? err.message : String(err)))
            console.error('Failed to load data:', err)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

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

    const chartSeries = historyData.length > 0 && fundCost > 0 ? [{
        name: '累计收益率',
        data: historyData.map(item => {
            const virtualNav = parseFloat(item.cumulative_nav || 0)
            const marketValue = parseFloat(item.market_value || 0)
            const shares = marketValue > 0 && virtualNav > 0 ? marketValue / virtualNav : 0
            const returnRate = shares > 0 && fundCost > 0
                ? ((virtualNav * shares - fundCost) / fundCost) * 100
                : 0
            return {
                date: item.nav_date,
                value: parseFloat(returnRate.toFixed(4))
            }
        })
    }] : []

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">{fundName} - 收益率曲线</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {!loading && !error && historyData.length === 0 && (
                        <div className="text-center py-12 text-gray-500">暂无历史数据</div>
                    )}

                    {!loading && !error && historyData.length > 0 && (
                        <div>
                            <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">数据点数</div>
                                    <div className="text-lg font-semibold text-gray-900">{historyData.length}</div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">起始日期</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatDateSafe(historyData[0].nav_date)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">最新日期</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {formatDateSafe(historyData[historyData.length - 1].nav_date)}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">成本</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {fundCost > 0 ? `¥${fundCost.toLocaleString('zh-CN')}` : '未知'}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                                {chartSeries.length > 0 && chartSeries[0].data.length > 0 ? (
                                    <div style={{ width: '100%', height: '400px' }}>
                                        <YieldCurveChart series={chartSeries} height={400} />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center" style={{ height: '400px' }}>
                                        <div className="text-center text-gray-500">
                                            {fundCost === 0 ? '缺少成本数据' : '缺少市值数据'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
