'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/ui/navigation'
import { ProductDataModule } from '@/components/modules/ProductDataModule'

export default function ProductsPage() {
    const [funds, setFunds] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('/api/funds?type=excluded-fof')
            if (!response.ok) throw new Error('获取数据失败')

            const result = await response.json()
            if (!result.success) throw new Error(result.error || '数据获取失败')

            setFunds(result.data.funds)
            setLastSyncTime(result.data.lastSyncTime)

        } catch (err) {
            console.error('加载产品数据失败:', err)
            setError('加载数据失败，请检查网络连接')
        } finally {
            setLoading(false)
        }
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
                <ProductDataModule
                    funds={funds}
                    loading={loading}
                    lastSyncTime={lastSyncTime}
                />
            </div>
        </div>
    )
}
