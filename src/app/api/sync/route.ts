import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'
import pandas from 'pandas-js'

export async function POST(request: NextRequest) {
  try {
    const { filePath } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: '请提供Excel文件路径' },
        { status: 400 }
      )
    }

    const db = getDatabase()
    const syncStart = new Date()

    // 读取Excel文件
    const workbook = await readExcelFile(filePath)

    let processedRecords = 0
    let updatedRecords = 0

    // 处理基金基本信息表
    if (workbook.sheets.includes('私募基金盈利一览表')) {
      const fundData = workbook.getSheet('私募基金盈利一览表')

      for (const row of fundData.data) {
        if (row['产品名称']) {
          const fund = {
            id: row['唯一标识'] || generateId(),
            name: row['产品名称'],
            strategy: row['投资策略'],
            manager: row['投资经理'],
            latestNavDate: row['最新净值日期'],
            cumulativeReturn: parseFloat(row['累计盈亏率']) || 0,
            annualizedReturn: parseFloat(row['年化收益率']) || 0,
            maxDrawdown: parseFloat(row['最大回撤']) || 0,
            sharpeRatio: parseFloat(row['夏普比率']) || 0,
            volatility: parseFloat(row['波动率']) || 0,
            totalAssets: parseCurrency(row['总规模']),
            standingAssets: parseCurrency(row['总规模']),
            cashAllocation: parseCurrency(row['站岗资金占用']),
            status: row['状态'] || '正常',
            establishmentDate: row['成立日期'],
            cost: parseCurrency(row['成本']),
            scale: parseCurrency(row['规模'])
          }

          await db.insertFund(fund)
          processedRecords++
          updatedRecords++
        }
      }
    }

    // 处理净值历史数据
    if (workbook.sheets.includes('私募基金取数')) {
      const navData = workbook.getSheet('私募基金取数')

      for (const row of navData.data) {
        if (row['产品名称'] && row['净值日期']) {
          const navHistory = {
            fundId: row['唯一标识'] || generateId(),
            navDate: new Date(row['净值日期']),
            unitNav: parseFloat(row['单位净值']) || 0,
            cumulativeNav: parseFloat(row['累计净值']) || 0,
            dailyReturn: parseFloat(row['日收益率']) || 0,
            totalAssets: parseCurrency(row['总规模']),
            status: row['状态'] || '正常',
            recordTime: new Date(row['录入时间']),
            cost: parseCurrency(row['成本']),
            marketValue: parseCurrency(row['市值']),
            positionChange: parseFloat(row['持仓变化']) || 0
          }

          await db.insertNavHistory(navHistory)
          processedRecords++
        }
      }
    }

    // 记录同步日志
    await logSyncResult(db, {
      syncType: 'excel_import',
      status: 'success',
      recordsProcessed: processedRecords,
      recordsUpdated: updatedRecords,
      syncStart,
      syncEnd: new Date()
    })

    return NextResponse.json({
      success: true,
      message: '数据同步成功',
      recordsProcessed: processedRecords,
      recordsUpdated: updatedRecords,
      syncTime: syncStart.toISOString()
    })

  } catch (error) {
    console.error('数据同步失败:', error)

    const db = getDatabase()
    await logSyncResult(db, {
      syncType: 'excel_import',
      status: 'error',
      recordsProcessed: 0,
      recordsUpdated: 0,
      errorMessage: error instanceof Error ? error.message : '未知错误',
      syncStart: new Date(),
      syncEnd: new Date()
    })

    return NextResponse.json(
      { error: '数据同步失败: ' + (error instanceof Error ? error.message : '未知错误') },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const db = getDatabase()

    // 获取最新的同步日志
    const lastSync = await new Promise<any>((resolve, reject) => {
      const dbInstance = (db as any).db
      dbInstance.get(
        'SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 1',
        (err: any, row: any) => {
          if (err) reject(err)
          else resolve(row)
        }
      )
    })

    return NextResponse.json({
      success: true,
      lastSync: lastSync || null,
      databaseInitialized: true
    })

  } catch (error) {
    console.error('获取同步状态失败:', error)
    return NextResponse.json(
      { error: '获取同步状态失败' },
      { status: 500 }
    )
  }
}

// 辅助函数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function parseCurrency(value: any): number {
  if (!value) return 0
  const cleanValue = value.toString().replace(/[¥,]/g, '').replace(/,/g, '')
  return parseFloat(cleanValue) || 0
}

async function readExcelFile(filePath: string): Promise<any> {
  // 这里需要实现Excel文件读取逻辑
  // 由于在Node.js环境中，可以使用node-xlsx或exceljs库

  // 暂时返回模拟数据结构
  return {
    sheets: ['私募基金盈利一览表', '私募基金取数'],
    getSheet: (name: string) => ({
      data: [] // 实际实现中这里会包含Excel数据
    })
  }
}

async function logSyncResult(db: any, logData: {
  syncType: string
  status: string
  recordsProcessed: number
  recordsUpdated: number
  syncStart: Date
  syncEnd: Date
  errorMessage?: string
}) {
  return new Promise<void>((resolve, reject) => {
    const dbInstance = (db as any).db
    const stmt = dbInstance.prepare(`
      INSERT INTO sync_logs (
        sync_type, status, records_processed, records_updated,
        error_message, sync_start, sync_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run([
      logData.syncType,
      logData.status,
      logData.recordsProcessed,
      logData.recordsUpdated,
      logData.errorMessage || null,
      logData.syncStart.toISOString(),
      logData.syncEnd.toISOString()
    ], (err: any) => {
      if (err) reject(err)
      else resolve()
    })

    stmt.finalize()
  })
}