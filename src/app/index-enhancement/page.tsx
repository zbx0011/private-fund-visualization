'use client'

import { Navigation } from '@/components/ui/navigation'
import { IndexEnhancementModule } from '@/components/modules/IndexEnhancementModule'

export default function IndexEnhancementPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">基础池指增产品绩效分析</h1>
          <p className="text-gray-600 mt-2">指增产品与各大指数的超额收益分析</p>
        </div>
        <IndexEnhancementModule />
      </div>
    </div>
  )
}
