'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ExternalMonitorModule() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)

    const handleSearch = async () => {
        if (!query.trim()) return

        setLoading(true)
        setSearched(true)
        setResults([])

        try {
            const response = await fetch('/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company: query })
            })

            const result = await response.json()
            if (result.success) {
                setResults(result.data)
            }
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">外部舆情监控</h2>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="输入公司名称 (例如: 景林资产)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={loading || !query.trim()}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? '搜索中...' : '开始监测'}
                    </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                    系统将自动检索必应/百度搜索引擎，分析最近的负面新闻、违规记录和舆情风险。
                </p>
            </div>

            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {!loading && searched && results.length === 0 && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-200">
                    未发现相关负面信息
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {results.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-bold text-gray-900 hover:underline">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                                        {item.title}
                                    </a>
                                </h3>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.sentimentScore < 0.4 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    风险系数: {((1 - item.sentimentScore) * 10).toFixed(1)}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                                {item.snippet}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {item.foundKeywords.map((kw: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                        {kw}
                                    </span>
                                ))}
                                <span className="text-xs text-gray-400 ml-auto">
                                    来源: {new URL(item.url).hostname}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
