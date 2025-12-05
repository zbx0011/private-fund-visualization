'use client'

import { Navigation } from '@/components/ui/navigation'
import { IndexEnhancementModule } from '@/components/modules/IndexEnhancementModule'

export default function IndexEnhancementPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <Navigation />
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <IndexEnhancementModule />
      </div>
    </div>
  )
}
