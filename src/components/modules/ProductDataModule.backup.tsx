'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { YieldCurveChart } from '@/components/charts/YieldCurveChart'
import { formatCurrency, formatPercent, formatPercentUnsigned } from '@/lib/utils'

interface ProductDataModuleProps {
    funds: any[]
    loading: boolean
}

export function ProductDataModule({ funds, loading }: ProductDataModuleProps) {
    const [selectedFund, setSelectedFund] = useState<any | null>(null)
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const columns = [
        { key: 'name', label: '基金名称', sortable: true },
        { key: 'strategy', label: '策略', sortable: true },
        { key: 'manager', label: '投资经理', sortable: true },
        { key: 'latest_nav_date', label: '最新净值日期', sortable: true, format: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
        { key: 'daily_pnl', label: '本日收益', sortable: true, format: (v: number) => formatCurrency(v) },
        { key: 'weekly_return', label: '本周收益率', sortable: true, format: (v: number) => formatPercent(v) },
        { key: 'yearly_return', label: '本年收益率', sortable: true, format: (v: number) => formatPercent(v) },
        { key: 'concentration', label: '集中度', sortable: true, format: (v: number) => v ? formatPercentUnsigned(v) : '-' },
        { key: 'cost', label: '成本', sortable: true, format: (v: number) => formatCurrency(v) },
        { key: 'max_drawdown', label: '最大回撤', sortable: true, format: (v: number) => formatPercentUnsigned(v) },
        { key: 'sharpe_ratio', label: '夏普比率', sortable: true, format: (v: number) => v?.toFixed(3) || '-' },
        { key: 'volatility', label: '波动率', sortable: true, format: (v: number) => formatPercentUnsigned(v) },
        { key: 'status', label: '状态', sortable: true },
    ]

    const handleRowClick = async (fund: any) => {
        setSelectedFund(fund)
        setLoadingHistory(true)
        try {
            // Fetch history for the selected fund using the new API endpoint
            const response = await fetch(`/api/funds/${fund.id}/history`)
            const data = await response.json()

            if (Array.isArray(data)) {
                setHistoryData(data)
            } else {
                console.error('Failed to fetch history:', data.error)
                setHistoryData([])
            }
        } catch (error) {
            console.error('Error fetching history:', error)
            setHistoryData([])
        } finally {
            setLoadingHistory(false)
        }
    }

    // Process funds to handle "Redeemed" logic
    const processedFunds = funds.map(fund => {
        if (fund.status === '已赎回') {
            return {
                ...fund,
                daily_pnl: 0,
                weekly_return: 0,
                concentration: 0,
                cost: 0
            }
        }
        return fund
    })

    if (loading) {
        return <div className="text-center py-10">正在加载数据...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">基金产品数据</h2>
                <span className="text-sm text-gray-500">共 {funds.length} 只产品</span>
            </div>

            <DataTable
                columns={columns}
                data={processedFunds}
                onRowClick={handleRowClick}
                rowClassName={(row) => row.status === '已赎回' ? 'bg-gray-100 text-gray-500' : ''}
            />

            {/* Modal for Yield Curve */}
            {selectedFund && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">{selectedFund.name} - 收益率曲线</h3>
                            <button
                                onClick={() => setSelectedFund(null)}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto">
                            {loadingHistory ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : historyData.length > 0 ? (
                                <YieldCurveChart
                                    data={historyData.map((item: any) => ({
                                        date: new Date(item.date).toLocaleDateString('zh-CN'),
                                        value: (item.cumulative_nav || item.unit_nav)
                                    }))}
                                    series={[{
                                        id: 'value',
                                        name: selectedFund.name,
                                        color: '#2563eb',
                                        strokeWidth: 2
                                    }]}
                                />
                            ) : (
                                <div className="text-center text-gray-500 h-64 flex items-center justify-center">
                                    暂无历史数据
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
