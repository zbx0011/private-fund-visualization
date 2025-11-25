'use client'

import { useState } from 'react'
import { formatCurrency, formatPercent, formatPercentUnsigned, formatConcentration, formatDate, getColorByValue } from '@/lib/utils'

export interface TableColumn {
  key: string
  title: string
  sortable?: boolean
  format?: 'currency' | 'percent' | 'percent-unsigned' | 'concentration' | 'date' | 'number'
  width?: string
  clickable?: boolean
  onCellClick?: (row: any) => void
}

interface DataTableProps {
  data: any[]
  columns: TableColumn[]
  searchable?: boolean
  pagination?: boolean
  pageSize?: number
  onRowClick?: (row: any) => void
}

export function DataTable({
  data,
  columns,
  searchable = true,
  pagination = true,
  pageSize = 10,
  onRowClick
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)

  // 过滤数据
  const filteredData = data.filter(row => {
    if (!searchTerm) return true
    return columns.some(column => {
      const value = row[column.key]
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    })
  })

  // 排序数据
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0
    const aValue = a[sortColumn] || 0
    const bValue = b[sortColumn] || 0

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // 分页数据
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = pagination
    ? sortedData.slice(startIndex, startIndex + pageSize)
    : sortedData

  const totalPages = Math.ceil(sortedData.length / pageSize)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'currency':
        return formatCurrency(Number(value))
      case 'percent':
        return formatPercent(Number(value))
      case 'percent-unsigned':
        return formatPercentUnsigned(Number(value))
      case 'concentration':
        return formatConcentration(Number(value))
      case 'date':
        return formatDate(value)
      case 'number':
        return Number(value).toLocaleString('zh-CN')
      default:
        return value.toString()
    }
  }

  return (
    <div className="w-full">
      {/* 搜索框 */}
      {searchable && (
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    {column.title}
                    {column.sortable && sortColumn === column.key && (
                      <svg
                        className="ml-1 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={sortDirection === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, index) => {
              const isRedeemed = row.status === '已赎回';

              return (
                <tr
                  key={index}
                  className={`${isRedeemed ? 'bg-gray-100' : 'hover:bg-gray-50'} ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => {
                    const value = row[column.key];
                    const isValueColumn = column.key.includes('return') || column.key.includes('Return');
                    const isHiddenColumn = isRedeemed && (
                      column.key === 'daily_return' ||
                      column.key === 'weekly_return' ||
                      column.key === 'cost' ||
                      column.key === 'concentration'
                    );

                    if (isHiddenColumn) {
                      return (
                        <td
                          key={column.key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-400"
                        >
                          -
                        </td>
                      );
                    }
                    const valueColor = isValueColumn ? getColorByValue(Number(value)) : '';

                    const cellContent = formatValue(value, column.format);
                    const isClickable = column.clickable && column.onCellClick;

                    return (
                      <td
                        key={column.key}
                        className={`px-3 py-2 whitespace-nowrap text-sm ${isRedeemed ? 'text-gray-500' : 'text-gray-900'
                          } ${valueColor} ${isClickable ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                        onClick={(e) => {
                          if (isClickable) {
                            e.stopPropagation();
                            column.onCellClick!(row);
                          }
                        }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-700">
            显示 {startIndex + 1} 到 {Math.min(startIndex + pageSize, sortedData.length)} 条，
            共 {sortedData.length} 条记录
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  )
}