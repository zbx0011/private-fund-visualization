'use client'

import { useState } from 'react'
import { formatCurrency, formatPercent, formatConcentration, formatDate, getColorByValue } from '@/lib/utils'

interface MobileTableProps {
  data: any[]
  columns: Array<{
    key: string
    title: string
    format?: 'currency' | 'percent' | 'concentration' | 'date' | 'number'
  }>
  onItemClick?: (item: any) => void
}

export function MobileTable({ data, columns, onItemClick }: MobileTableProps) {
  const formatValue = (value: any, format?: string) => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'currency':
        return formatCurrency(Number(value))
      case 'percent':
        return formatPercent(Number(value))
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

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        暂无数据
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const isRedeemed = item.status === '已赎回';
        const hiddenColumns = ['daily_return', 'weekly_return', 'cost', 'concentration'];

        return (
          <div
            key={index}
            onClick={() => onItemClick && onItemClick(item)}
            className={`${isRedeemed ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-200'} rounded-lg border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className={`font-semibold text-sm flex-1 ${isRedeemed ? 'text-gray-600' : 'text-gray-900'}`}>
                {item[columns[0].key]}
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isRedeemed ? 'bg-gray-200 text-gray-600' : 'bg-green-100 text-green-800'
                }`}>
                  {item.status}
                </span>
                {columns.some(col => col.key.includes('return') || col.key.includes('Return')) && (
                  <span className={`text-sm font-bold ${
                    getColorByValue(Number(item[columns.find(col => col.key.includes('return') || col.key.includes('Return'))?.key] || 0))
                  }`}>
                    {formatPercent(Number(item[columns.find(col => col.key.includes('return') || col.key.includes('Return'))?.key] || 0))}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {columns.slice(1, 7)
                .filter(column => !isRedeemed || !hiddenColumns.includes(column.key))
                .map((column) => {
                  const value = item[column.key];
                  const isValueColumn = column.key.includes('return') || column.key.includes('Return');

                  return (
                    <div key={column.key} className="flex justify-between">
                      <span className={` ${isRedeemed ? 'text-gray-400' : 'text-gray-500'}`}>{column.title}:</span>
                      <span className={`font-medium ${isValueColumn ? getColorByValue(Number(value)) : (isRedeemed ? 'text-gray-500' : 'text-gray-900')}`}>
                        {formatValue(value, column.format)}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* 显示更多按钮 */}
            {columns.length > 7 && (
              <button className={`mt-3 text-sm ${isRedeemed ? 'text-gray-400' : 'text-blue-600'} hover:text-blue-800`}>
                查看详情 →
              </button>
            )}
          </div>
        );
      })}
    </div>
  )
}