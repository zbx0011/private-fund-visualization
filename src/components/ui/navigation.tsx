'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useYear } from '@/contexts/YearContext'
import {
  TrendingUp,
  BarChart3,
  Users,
  Target,
  LineChart,
  Table,
  Settings,
  Menu,
  X,
  ClipboardList,
  Building2,
  Search,
  Brain,
  Activity,
  Calendar,
  LayoutDashboard,
  Database
} from 'lucide-react'

const navigationItems = [
  { href: '/', label: '总览仪表盘', icon: LayoutDashboard },
  { href: '/products', label: '产品数据', icon: Database },
  { href: '/monitor', label: '外部信息监控', icon: Search },
  { href: '/basic-pool', label: '基础池基金', icon: LineChart },
  { href: '/market-monitor', label: '行情监控', icon: Activity },
  // { href: '/ai-analysis', label: 'AI分析(开发中)', icon: Brain }, // 暂时隐藏
]

export function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { selectedYear, setSelectedYear, availableYears } = useYear()

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">私募管理系统</span>
              </Link>
              {/* Year Selector */}
              <div className="flex items-center ml-4 bg-gray-100 rounded-lg p-1">
                <Calendar className="h-4 w-4 text-gray-500 ml-1 mr-1" />
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={cn(
                      'px-3 py-1 text-sm font-medium rounded-md transition-all',
                      selectedYear === year
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-md text-base font-medium transition-colors',
                      pathname === item.href
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">私募管理</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-medium',
                      pathname === item.href
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                    )}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center w-full">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-2 text-[10px] sm:text-xs max-w-[80px]',
                  pathname === item.href
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span className="truncate text-center leading-tight">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}