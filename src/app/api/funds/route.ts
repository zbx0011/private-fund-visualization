import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    const includeHistory = searchParams.get('includeHistory') === 'true'
    const db = getDatabase()

    let funds = []
    if (type === 'fof') {
      funds = await db.getAllFunds('fof')
    } else if (type === 'excluded-fof') {
      // Get both main and merged tables for non-FOF view
      const mainFunds = await db.getAllFunds('main')
      const mergedFunds = await db.getAllFunds('merged')
      funds = [...mainFunds, ...mergedFunds]
    } else {
      funds = await db.getAllFunds()
    }

    // If history is requested, fetch it for each fund
    if (includeHistory) {
      const fundsWithHistory = await Promise.all(funds.map(async (fund) => {
        let history = await db.getFundHistory(fund.record_id)
        // Fallback: if no history found by record_id, try using name (as seen in imported data)
        if (!history || history.length === 0) {
          history = await db.getFundHistory(fund.name)
        }
        return { ...fund, history }
      }))
      funds = fundsWithHistory
    }

    const strategyStats = await db.getStrategyStats(type === 'fof' ? 'fof' : 'main')
    const managerStats = await db.getManagerStats(type === 'fof' ? 'fof' : 'main')
    return NextResponse.json({
      success: true,
      data: {
        funds,
        strategyStats,
        managerStats
      }
    })

  } catch (error) {
    console.error('获取基金数据失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '获取数据失败'
      },
      { status: 500 }
    )
  }
}

// 辅助函数已移除 - 现在使用数据库层面的统计