

import { NextRequest, NextResponse } from 'next/server'
import { LarkBitableAPI } from '@/lib/lark-api'
import { getDatabase } from '@/lib/database-server'

export const dynamic = 'force-dynamic'

const APP_TOKEN = 'MKTubHkUKa13gbs9WdNcQNvsn3f'
const TABLE_ID = 'tblx87kYtZf70vOf' // 基础池产品

export async function GET() {
    try {
        console.log('开始同步基础池数据...')

        // 初始化飞书API
        const api = new LarkBitableAPI({
            appId: process.env.LARK_APP_ID || '',
            appSecret: process.env.LARK_APP_SECRET || ''
        })

        // 获取飞书表格数据
        console.log('正在获取飞书表格数据...')
        const records = await api.getBitableRecords(APP_TOKEN, TABLE_ID)
        console.log(`获取到 ${records.length} 条记录`)

        if (records.length === 0) {
            return NextResponse.json({
                success: true,
                message: '飞书表格中没有数据',
                inserted: 0,
                duplicatesRemoved: 0
            })
        }

        // 获取数据库连接
        const db = getDatabase()
        const dbInstance = (db as any).db

        // 1. 先去重：删除 basic_pool_history 中的重复数据
        console.log('正在去除数据库中的重复数据...')
        const removeDuplicatesSql = `
      DELETE FROM basic_pool_history 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM basic_pool_history 
        GROUP BY fund_name, nav_date
      )
    `

        let duplicatesRemoved = 0
        await new Promise<void>((resolve, reject) => {
            dbInstance.run(removeDuplicatesSql, function (this: any, err: Error | null) {
                if (err) {
                    console.error('去重失败:', err)
                    reject(err)
                } else {
                    duplicatesRemoved = this.changes || 0
                    console.log(`去除了 ${duplicatesRemoved} 条重复记录`)
                    resolve()
                }
            })
        })

        // 2. 处理并插入新数据
        console.log('正在处理并插入新数据...')
        let inserted = 0
        let skipped = 0

        // 使用 INSERT OR IGNORE 避免重复
        const insertSql = `
      INSERT OR IGNORE INTO basic_pool_history 
      (fund_name, strategy, nav_date, cumulative_nav, unit_nav) 
      VALUES (?, ?, ?, ?, ?)
    `

        for (const record of records) {
            const fields = record.fields

            // 提取字段 - 根据飞书表格结构
            const fundName = fields['产品名称'] || fields['基金名称'] || ''
            const strategy = fields['策略'] || fields['策略类型'] || ''
            const navDate = fields['日期'] || fields['净值日期'] || ''
            const cumulativeNav = parseFloat(fields['累计净值'] || fields['累计单位净值'] || '0') || null
            const unitNav = parseFloat(fields['单位净值'] || '0') || null

            if (!fundName || !navDate) {
                skipped++
                continue
            }

            // 格式化日期
            let formattedDate = navDate
            if (typeof navDate === 'number') {
                // 飞书时间戳是毫秒
                formattedDate = new Date(navDate).toISOString().split('T')[0]
            } else if (typeof navDate === 'string' && navDate.includes('/')) {
                // 处理 2025/01/01 格式
                formattedDate = navDate.replace(/\//g, '-')
            }

            await new Promise<void>((resolve, reject) => {
                dbInstance.run(insertSql, [fundName, strategy, formattedDate, cumulativeNav, unitNav], function (this: any, err: Error | null) {
                    if (err) {
                        console.warn(`插入失败 ${fundName}:`, err.message)
                    } else if (this.changes > 0) {
                        inserted++
                    }
                    resolve()
                })
            })
        }

        console.log(`同步完成: 插入 ${inserted} 条, 跳过 ${skipped} 条, 去重 ${duplicatesRemoved} 条`)

        return NextResponse.json({
            success: true,
            message: '同步成功',
            recordsFetched: records.length,
            inserted,
            skipped,
            duplicatesRemoved,
            syncTime: new Date().toISOString()
        })

    } catch (error) {
        console.error('同步基础池数据失败:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : '同步失败'
        }, { status: 500 })
    }
}
