'use client'

import { useState } from 'react'

interface Column {
    key: string
    label: string
    format?: (value: any) => React.ReactNode
    sortable?: boolean
}

interface DataTableProps {
    columns: Column[]
    data: any[]
    onRowClick?: (row: any) => void
    rowClassName?: (row: any) => string
    footerRow?: any
}

export function DataTable({ columns, data, onRowClick, rowClassName, footerRow }: DataTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

    const sortedData = [...data].sort((a, b) => {
        if (!sortConfig) return 0
        const { key, direction } = sortConfig
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1
        return 0
    })

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((col) => (
                            <th
                                key={col.key}
                                scope="col"
                                className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                                onClick={() => col.sortable && requestSort(col.key)}
                            >
                                <div className="flex items-center space-x-1">
                                    <span>{col.label}</span>
                                    {sortConfig?.key === col.key && (
                                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {sortedData.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''} ${rowClassName ? rowClassName(row) : ''}`}
                        >
                            {columns.map((col) => (
                                <td key={col.key} className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                                    {col.format ? col.format(row[col.key]) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {footerRow && (
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                            {columns.map((col) => (
                                <td key={col.key} className="px-3 py-3 whitespace-nowrap text-xs text-gray-900">
                                    {footerRow[col.key] !== undefined
                                        ? (col.format ? col.format(footerRow[col.key]) : footerRow[col.key])
                                        : ''}
                                </td>
                            ))}
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}
