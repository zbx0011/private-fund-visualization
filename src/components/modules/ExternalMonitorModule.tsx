'use client'

import { useState } from 'react'
import { Search, Download, FileText, Bell, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock Data based on the screenshot
const mockData = [
    {
        id: 1,
        date: '09-10',
        title: '震惊！这家量化私募收用虚开发票套现...',
        source: 'See资管',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 2,
        date: '08-10',
        title: '冰、火、AI：解码量化投资的生存法则...',
        source: '天府对冲基金...',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 3,
        date: '08-05',
        title: '虚开发票超1455万！量化私募平方和...',
        source: '21世纪经济...',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 4,
        date: '08-04',
        title: '平方和私募收用虚开发票被罚，公司...',
        source: '蓝鲸新财富',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 5,
        date: '08-04',
        title: '因收用虚增值税发票，知名量化私募...',
        source: '界面新闻',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 6,
        date: '08-03',
        title: '总经理带头，这家量化私募收用虚开...',
        source: '财联社',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 7,
        date: '08-01',
        title: '北大精英掌舵头部量化私募翻车：平...',
        source: '新浪财经',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 8,
        date: '07-31',
        title: '套取资金虚开发票，知名量化私募平...',
        source: '新浪财经',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 9,
        date: '06-25',
        title: '中关村必胜客？百亿量化员工发对联...',
        source: '金石随笔',
        relatedEnterprise: '宁波平方和投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '管理预警',
        level2: '拖欠工资'
    },
    {
        id: 10,
        date: '02-01',
        title: '32份私募罚单除夕前发布，百亿私募...',
        source: '财联社',
        relatedEnterprise: '上海殊馥投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    },
    {
        id: 11,
        date: '2024-12-14',
        title: '三项违规均涉债券业务，知名私募上...',
        source: '界面新闻',
        relatedEnterprise: '上海殊馥投资管理...',
        importance: '一般',
        sentiment: '负面',
        level1: '监管预警',
        level2: '行政处罚'
    }
]

export function ExternalMonitorModule() {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[800px]">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-blue-50/30">
                <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-gray-900">私募1</h2>
                </div>
                <div className="flex items-center space-x-3">
                    <button className="flex items-center px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <FileText className="w-4 h-4 mr-1.5" />
                        修改方案
                    </button>
                    <button className="flex items-center px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <Bell className="w-4 h-4 mr-1.5" />
                        实时推送(已开)
                    </button>
                    <button className="flex items-center px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">
                        <Mail className="w-4 h-4 mr-1.5" />
                        邮件·微信订阅
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-4 border-b border-gray-200">
                <div className="flex space-x-6">
                    <button className="pb-3 px-1 border-b-2 border-blue-600 text-blue-600 font-medium text-sm">
                        订阅结果
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
                        <span className="text-blue-600 font-medium">重要性</span>
                        <svg className="w-3 h-3 fill-current text-blue-600" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
                        <span className="text-gray-600">负面</span>
                        <svg className="w-3 h-3 fill-current text-gray-400" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
                        <span className="text-gray-600">资讯类型</span>
                        <svg className="w-3 h-3 fill-current text-gray-400" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
                        <span className="text-gray-600">企业</span>
                        <svg className="w-3 h-3 fill-current text-gray-400" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-blue-600">
                        <span className="text-gray-600">更多</span>
                        <svg className="w-3 h-3 fill-current text-gray-400" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2 top-1.5 h-4 w-4 text-blue-500" />
                        <input
                            type="text"
                            placeholder="搜索"
                            className="pl-8 pr-4 py-1 border-none bg-transparent focus:outline-none text-sm w-32 placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>共 {mockData.length} 条</span>
                    <button className="flex items-center text-green-700 hover:text-green-800 font-medium">
                        <Download className="w-4 h-4 mr-1" />
                        导出Excel
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-y border-gray-200">
                        <tr>
                            <th className="px-4 py-3 w-24">日期</th>
                            <th className="px-4 py-3">标题</th>
                            <th className="px-4 py-3 w-16">摘要</th>
                            <th className="px-4 py-3 w-32">来源</th>
                            <th className="px-4 py-3 w-48">关联企业</th>
                            <th className="px-4 py-3 w-20">重要性</th>
                            <th className="px-4 py-3 w-20">正负面</th>
                            <th className="px-4 py-3 w-24">一级分类</th>
                            <th className="px-4 py-3 w-24">二级分类</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {mockData.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-900">{item.date}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium truncate max-w-xs" title={item.title}>
                                    {item.title}
                                </td>
                                <td className="px-4 py-3">
                                    <button className="text-blue-600 hover:text-blue-800">查看</button>
                                </td>
                                <td className="px-4 py-3 text-gray-600 truncate max-w-[120px]" title={item.source}>
                                    {item.source}
                                </td>
                                <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]" title={item.relatedEnterprise}>
                                    {item.relatedEnterprise}
                                </td>
                                <td className="px-4 py-3 text-gray-500">{item.importance}</td>
                                <td className={cn(
                                    "px-4 py-3",
                                    item.sentiment === '负面' ? "text-red-500" : "text-gray-500"
                                )}>
                                    {item.sentiment}
                                </td>
                                <td className="px-4 py-3 text-gray-600">{item.level1}</td>
                                <td className="px-4 py-3 text-gray-600">{item.level2}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
