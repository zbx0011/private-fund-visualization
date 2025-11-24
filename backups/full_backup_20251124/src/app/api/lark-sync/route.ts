import { NextRequest, NextResponse } from 'next/server'
import { LarkSyncService } from '@/lib/lark-sync'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appId, appSecret, appToken, tableId, autoDetectTable = true } = body

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: '缺少必需参数: appId 和 appSecret' },
        { status: 400 }
      )
    }

    if (!appToken) {
      return NextResponse.json(
        { error: '缺少必需参数: appToken (多维表格应用令牌)' },
        { status: 400 }
      )
    }

    // 创建同步服务
    const syncService = new LarkSyncService(appId, appSecret)

    // 执行同步
    const result = await syncService.syncFromBitable({
      appToken,
      tableId,
      autoDetectTable
    })

    // 记录同步日志到数据库
    await logSyncResult({
      syncType: 'lark_bitable',
      status: result.success ? 'success' : 'error',
      recordsProcessed: result.recordsProcessed,
      recordsUpdated: result.recordsUpdated,
      recordsInserted: result.recordsInserted,
      errorMessage: result.errors.join('; ') || undefined,
      appToken,
      tableId: tableId || 'auto-detected'
    })

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error) {
    console.error('飞书同步失败:', error)

    // 记录错误日志
    await logSyncResult({
      syncType: 'lark_bitable',
      status: 'error',
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsInserted: 0,
      errorMessage: error instanceof Error ? error.message : '未知错误'
    })

    return NextResponse.json(
      {
        success: false,
        error: '同步失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    if (action === 'get-table-info') {
      const appToken = searchParams.get('appToken')
      const appId = searchParams.get('appId') || process.env.LARK_APP_ID
      const appSecret = searchParams.get('appSecret') || process.env.LARK_APP_SECRET

      if (!appToken || !appId || !appSecret) {
        return NextResponse.json(
          { error: '缺少必需参数: appToken, appId, appSecret' },
          { status: 400 }
        )
      }

      const syncService = new LarkSyncService(appId, appSecret)
      const tableInfo = await syncService.getBitableInfo(appToken)

      return NextResponse.json({
        success: true,
        data: tableInfo
      })
    }

    // 默认返回同步历史
    const db = require('@/lib/database-server').getDatabase()
    const history = await getSyncHistory()

    return NextResponse.json({
      success: true,
      data: {
        history
      }
    })

  } catch (error) {
    console.error('获取飞书信息失败:', error)
    return NextResponse.json(
      {
        success: false,
        error: '操作失败: ' + (error instanceof Error ? error.message : '未知错误')
      },
      { status: 500 }
    )
  }
}

// 辅助函数
async function logSyncResult(logData: {
  syncType: string
  status: string
  recordsProcessed: number
  recordsUpdated: number
  recordsInserted: number
  errorMessage?: string
  appToken?: string
  tableId?: string
}) {
  const sqlite3 = require('sqlite3')
  const path = require('path')

  const DB_PATH = path.join(process.cwd(), 'data', 'funds.db')
  const db = new sqlite3.Database(DB_PATH)

  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO sync_logs (
        sync_type, status, records_processed, records_updated,
        records_inserted, error_message, sync_start, sync_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const now = new Date()
    stmt.run([
      logData.syncType,
      logData.status,
      logData.recordsProcessed,
      logData.recordsUpdated,
      logData.recordsInserted,
      logData.errorMessage || null,
      now.toISOString(),
      new Date().toISOString()
    ], (err: Error | null) => {
      if (err) reject(err)
      else resolve(undefined)
    })

    stmt.finalize()
    db.close()
  })
}

async function getSyncHistory() {
  const sqlite3 = require('sqlite3')
  const path = require('path')

  const DB_PATH = path.join(process.cwd(), 'data', 'funds.db')
  const db = new sqlite3.Database(DB_PATH)

  return new Promise((resolve, reject) => {
    db.all(`
      SELECT * FROM sync_logs
      WHERE sync_type = 'lark_bitable'
      ORDER BY created_at DESC
      LIMIT 20
    `, (err: Error | null, rows: any[]) => {
      if (err) reject(err)
      else resolve(rows)
    })

    db.close()
  })
}