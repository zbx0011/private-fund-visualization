'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, Download, FileText, Bell, Mail, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ExternalMonitorData {
    id: number;
    date: string;
    title: string;
    summary: string;
    source: string;
    related_enterprise: string;
    importance: string;
    sentiment: string;
    level1_category: string;
    level2_category: string;
    url: string;
}

export function ExternalMonitorModule() {
    const [monitorData, setMonitorData] = useState<ExternalMonitorData[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'latest' | 'company'>('latest')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const response = await fetch('/api/monitor')
            const result = await response.json()
            if (result.success) {
                setMonitorData(result.data)
            }
        } catch (error) {
            console.error('Failed to fetch monitor data:', error)
        } finally {
            setLoading(false)
        }
    }

    // Group data by company for the "Company Statistics" view
    const groupedData = useMemo(() => {
        const groups: { [key: string]: ExternalMonitorData[] } = {}
        monitorData.forEach(item => {
            const companyName = item.related_enterprise || '其他'
            if (!groups[companyName]) {
                groups[companyName] = []
            }
            groups[companyName].push(item)
        })
        return groups
    }, [monitorData])

    const renderLatestView = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                    <tr>
                        <th className="px-4 py-3 font-medium">更新日期</th>
                        <th className="px-4 py-3 font-medium">标题</th>
                        <th className="px-4 py-3 font-medium">关联企业</th>
                        <th className="px-4 py-3 font-medium">事件类型</th>
                        <th className="px-4 py-3 font-medium">重要性</th>
                        <th className="px-4 py-3 font-medium">正负面</th>
                        <th className="px-4 py-3 font-medium">来源</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                加载中...
                            </td>
                        </tr>
                    ) : monitorData.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                暂无数据
                            </td>
                        </tr>
                    ) : (
                        monitorData.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                    {item.date}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-blue-600 hover:underline flex items-center group"
                                    >
                                        {item.title}
                                        <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                </td>
                                <td className="px-4 py-3 text-gray-600">{item.related_enterprise}</td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="text-gray-900">{item.level1_category}</span>
                                        <span className="text-xs text-gray-500">{item.level2_category}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.importance === '高' ? 'bg-red-100 text-red-700' :
                                        item.importance === '中' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-gray-100 text-gray-700'
                                        }`}>
                                        {item.importance || '一般'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.sentiment === '负面' ? 'bg-red-50 text-red-600' :
                                        item.sentiment === '正面' ? 'bg-green-50 text-green-600' :
                                            'bg-gray-50 text-gray-600'
                                        }`}>
                                        {item.sentiment || '中性'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-500">{item.source}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )

    const renderCompanyView = () => (
        <div className="space-y-6 p-4 bg-gray-50/50">
            {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : Object.keys(groupedData).length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
            ) : (
                Object.entries(groupedData).map(([company, items]) => (
                    <div key={company} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {/* Company Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                    {company.charAt(0)}
                                </div>
                                <h3 className="text-base font-bold text-gray-900">{company}</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded font-medium">
                                    全部 {items.length}
                                </span>
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                                    新闻 {items.filter(i => i.level1_category?.includes('新闻')).length}
                                </span>
                                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                                    公告 {items.filter(i => i.level1_category?.includes('公告')).length}
                                </span>
                            </div>
                        </div>

                        {/* Company Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-2 font-medium w-16 text-center">序号</th>
                                        <th className="px-4 py-2 font-medium w-24">更新日期</th>
                                        <th className="px-4 py-2 font-medium w-24">事件类型</th>
                                        <th className="px-4 py-2 font-medium w-24">事件子项</th>
                                        <th className="px-4 py-2 font-medium">标题</th>
                                        <th className="px-4 py-2 font-medium w-20 text-center">重要性</th>
                                        <th className="px-4 py-2 font-medium w-20 text-center">正负面</th>
                                        <th className="px-4 py-2 font-medium w-24 text-center">来源</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="px-4 py-3 text-gray-500 text-center">{index + 1}</td>
                                            <td className="px-4 py-3 text-gray-900">{item.date.substring(5)}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.level1_category}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.level2_category}</td>
                                            <td className="px-4 py-3">
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-gray-900 hover:text-blue-600 hover:underline block"
                                                >
                                                    {item.title}
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-gray-600">{item.importance || '一般'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`${item.sentiment === '负面' ? 'text-red-500' :
                                                    item.sentiment === '正面' ? 'text-green-500' :
                                                        'text-gray-600'
                                                    }`}>
                                                    {item.sentiment || '中性'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-center">{item.source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    )

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[800px]">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-blue-50/30 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">外部信息监控</h2>
                <button
                    onClick={async () => {
                        try {
                            setLoading(true);
                            const res = await fetch('/api/monitor/update', { method: 'POST' });
                            const result = await res.json();
                            if (result.success) {
                                alert('更新任务已启动，请稍后刷新页面查看最新数据');
                            } else {
                                alert('启动失败: ' + result.error);
                            }
                        } catch (e) {
                            alert('请求失败');
                        } finally {
                            // Reload data after a short delay to check if anything immediate happened, 
                            // though scraping takes time.
                            setTimeout(fetchData, 2000);
                        }
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center transition-colors"
                >
                    <Download className="w-4 h-4 mr-1.5" />
                    手动更新数据
                </button>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-4 border-b border-gray-200">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('latest')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'latest'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        最新动态
                    </button>
                    <button
                        onClick={() => setActiveTab('company')}
                        className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'company'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        按公司统计
                    </button>
                </div>
            </div>

            {/* Filters (Only show for Latest view for now, or keep common) */}
            {activeTab === 'latest' && (
                <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
                            <option>近1周</option>
                            <option>近1月</option>
                            <option>近3月</option>
                        </select>
                        <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
                            <option>重要性</option>
                            <option>高</option>
                            <option>中</option>
                            <option>低</option>
                        </select>
                        <select className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">
                            <option>正负面</option>
                            <option>正面</option>
                            <option>负面</option>
                            <option>中性</option>
                        </select>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <Search className="w-4 h-4 text-gray-500" />
                            </div>
                            <input
                                type="text"
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 pl-10 p-2"
                                placeholder="请输入公司名称"
                            />
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                        共 <span className="font-bold text-gray-900 mx-1">{monitorData.length}</span> 条信息
                    </div>
                </div>
            )}

            {/* Content */}
            {activeTab === 'latest' ? renderLatestView() : renderCompanyView()}
        </div>
    )
}
