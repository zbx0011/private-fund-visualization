'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { YieldCurveChart } from '@/components/charts/YieldCurveChart'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function FOFModule() {
    const [funds, setFunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedFund, setSelectedFund] = useState<any | null>(null)
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        fetchFOFData()
    }, [])

    const fetchFOFData = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/fof')
            const result = await response.json()
            if (result.success) {
                setFunds(result.data)
            }
        } catch (error) {
            console.error('Error fetching FOF data:', error)
        } finally {
            setLoading(false)
        }
    }

    const columns = [
        { key: 'name', label: 'FOF名称', sortable: true },
        { key: 'manager', label: '管理人', sortable: true },
        { key: 'latest_nav_date', label: '净值日期', sortable: true, format: (v: string) => new Date(v).toLocaleDateString('zh-CN') },
        { key: 'unit_nav', label: '单位净值', sortable: true, format: (v: number) => v?.toFixed(4) || '-' },
        { key: 'cumulative_nav', label: '累计净值', sortable: true, format: (v: number) => v?.toFixed(4) || '-' },
        { key: 'daily_return', label: '日收益率', sortable: true, format: (v: number) => formatPercent(v) },
        { key: 'weekly_return', label: '周收益率', sortable: true, format: (v: number) => formatPercent(v) },
        { key: 'yearly_return', label: '今年以来', sortable: true, format: (v: number) => formatPercent(v) },
        { key: 'total_assets', label: '资产规模', sortable: true, format: (v: number) => formatCurrency(v) },
    ]

    const handleRowClick = async (fund: any) => {
        setSelectedFund(fund)
        setLoadingHistory(true)
        try {
            const response = await fetch(`/api/history?fund_id=${fund.record_id}`)
            const result = await response.json()

            if (result.success) {
                setHistoryData(result.data)
            } else {
                setHistoryData([])
            }
        } catch (error) {
            console.error('Error fetching history:', error)
            setHistoryData([])
        } finally {
            setLoadingHistory(false)
        }
    }

    if (loading) {
        return <div className="text-center py-10">正在加载 FOF 数据...</div>
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">第一创业 FOF</h2>
                <span className="text-sm text-gray-500">共 {funds.length} 只产品</span>
            </div>

            <DataTable
                columns={columns}
                data={funds}
                onRowClick={handleRowClick}
            />

            {/* Modal for Yield Curve */}
            {selectedFund && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-bold">{selectedFund.name} - 收益率曲线</h3>
                            <button
                                onClick={() => setSelectedFund(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
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
                                        value: item.cumulative_nav || item.unit_nav
                                    }))}
                                    series={[{
                                        id: 'value',
                                        name: selectedFund.name,
                                        color: '#8b5cf6'
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
