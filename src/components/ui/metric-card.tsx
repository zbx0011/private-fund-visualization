import { cn, formatCurrency, formatPercent, getColorByValue } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  format?: 'currency' | 'percent' | 'number'
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = '较昨日',
  format = 'number',
  className
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return formatCurrency(val as number)
      case 'percent':
        return formatPercent(val as number)
      case 'number':
      default:
        return val.toLocaleString('zh-CN')
    }
  }

  return (
    <div className={cn(
      'rounded-lg border bg-white p-3 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">{title}</p>
        {change !== undefined && (
          <span className={cn(
            'text-xs font-medium',
            getColorByValue(change)
          )}>
            {change >= 0 ? '↑' : '↓'} {formatPercent(Math.abs(change))}
          </span>
        )}
      </div>
      <div className="mt-1">
        <p className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </p>
        {change !== undefined && (
          <p className="text-xs text-gray-500 mt-0.5">
            {changeLabel}
          </p>
        )}
      </div>
    </div>
  )
}