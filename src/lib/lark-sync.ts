import { LarkBitableAPI } from './lark-api'
import { DataConverter } from './data-converter'
import { getDatabase } from './database-server'

interface SyncConfig {
  appToken: string
  tables?: Array<{ id: string; type: 'main' | 'fof' }>
  tableId?: string
  autoDetectTable?: boolean
}

interface SyncResult {
  success: boolean
  recordsProcessed: number
  recordsUpdated: number
  recordsInserted: number
  errors: string[]
  warnings: string[]
}

export class LarkSyncService {
  private api: LarkBitableAPI

  constructor(appId?: string, appSecret?: string) {
    this.api = new LarkBitableAPI({
      appId: appId || process.env.LARK_APP_ID!,
      appSecret: appSecret || process.env.LARK_APP_SECRET!
    })
  }

  /**
   * 从飞书多维表格同步数据
   */
  async syncFromBitable(config: SyncConfig): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      recordsProcessed: 0,
      recordsUpdated: 0,
      recordsInserted: 0,
      errors: [],
      warnings: []
    }

    try {
      console.log('开始从飞书多维表格同步数据...')

      let tablesToSync = config.tables;

      // If specific tableId is provided, use it
      if (!tablesToSync && config.tableId) {
        tablesToSync = [{ id: config.tableId, type: 'main' }];
      }

      // Default tables if nothing specified
      if (!tablesToSync) {
        tablesToSync = [
          { id: 'tblcXqDbfgA0x533', type: 'main' }, // 私募取数表 (Primary data source)
          { id: 'tblcK2mWFtgob3Dg', type: 'main' }, // 私募盈亏一览表 (For concentration field)
          { id: 'tblXwpq4lQzfymME', type: 'fof' }   // 第一创业FOF
        ]
      }

      console.log(`配置的表格数量: ${tablesToSync.length}`)
      tablesToSync.forEach((t, i) => console.log(`  ${i + 1}. ${t.id} (${t.type})`))

      for (const table of tablesToSync) {
        console.log(`正在同步表格: ${table.id} (${table.type})...`)

        try {
          // 获取数据
          console.log(`  正在获取表格 ${table.id} 的数据...`)
          const records = await this.api.getBitableRecords(config.appToken, table.id)
          console.log(`  获取到 ${records.length} 条记录`)
          if (table.id === 'tblcK2mWFtgob3Dg') {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(process.cwd(), 'fund_names_dump.txt');
            let logContent = 'Fund Names Dump:\n';

            records.forEach((r, idx) => {
              const fields = r.fields;
              let nameFound = 'UNKNOWN';
              // Iterate to find the name field (string, length > 2)
              for (const key in fields) {
                const val = fields[key];
                if (typeof val === 'string' && val.length > 2 && val.length < 30 && !val.includes('http')) {
                  nameFound = val;
                  break;
                }
              }
              logContent += `${idx + 1}. ${nameFound}\n`;
            });
            fs.writeFileSync(logPath, logContent, 'utf8');
            console.log('DEBUG: Wrote fund names to fund_names_dump.txt');
          }

          if (records.length === 0) {
            result.warnings.push(`表格 ${table.id} 中没有数据`)
            console.log(`  ⚠️  表格 ${table.id} 中没有数据，跳过`)
            continue
          }

          result.recordsProcessed += records.length

          // 私募取数表作为历史数据处理
          if (table.id === 'tblcXqDbfgA0x533') {
            console.log('同步历史净值数据...')
            const historyResult = await this.syncNavHistory(records)
            console.log(`历史数据同步完成: ${historyResult.inserted} 条记录`)
          }

          // 转换数据格式
          const fieldMapping = DataConverter.analyzeFields(records)
          const fundData = await DataConverter.convertBitableToFundDataWithOptions(
            records,
            config.appToken,
            table.id
          )

          // 添加来源标记
          fundData.forEach(fund => {
            if (fund.name.includes('碧炼')) {
              console.log('DEBUG: Found 碧炼 in converted data:', fund.name);
            }
            (fund as any).source_table = table.type
          })

          // 保存到数据库
          const dbResult = await this.saveToDatabase(fundData)
          result.recordsUpdated += dbResult.updated
          result.recordsInserted += dbResult.inserted

          // 私募取数表：计算基金指标 (在保存基础数据后执行，以覆盖可能存在的错误数据)
          if (table.id === 'tblcXqDbfgA0x533') {
            console.log('计算基金指标...')
            const metricsResult = await this.calculateFundMetrics()
            console.log(`指标计算完成: ${metricsResult.fundsUpdated} 个基金`)
          }

        } catch (tableError) {
          console.error(`同步表格 ${table.id} 失败:`, tableError)
          result.errors.push(`表格 ${table.id} 同步失败: ${tableError}`)
        }
      }

      result.success = result.errors.length === 0
      console.log(`同步完成: 处理${result.recordsProcessed}条记录，更新${result.recordsUpdated}条，插入${result.recordsInserted}条`)

    } catch (error) {
      console.error('同步流程失败:', error)
      result.errors.push(`同步流程失败: ${error}`)
    }


    return result
  }

  /**
   * 自动检测基金数据表
   */
  private async detectFundTable(appToken: string): Promise<string | null> {
    try {
      const tables = await this.api.getBitableTables(appToken)

      // 优先查找包含"基金"、"私募"等关键词的表格
      const fundTables = tables.filter((table: any) => {
        const name = table.name.toLowerCase()
        return name.includes('基金') || name.includes('私募') || name.includes('投资')
      })

      if (fundTables.length > 0) {
        return fundTables[0].table_id
      }

      // 如果没找到，返回第一个表格
      if (tables.length > 0) {
        return tables[0].table_id
      }

      return null
    } catch (error) {
      console.error('检测表格失败:', error)
      return null
    }
  }

  /**
   * 保存数据到数据库
   */
  private async saveToDatabase(fundData: any[]): Promise<{ updated: number; inserted: number }> {
    const db = getDatabase()
    let updated = 0
    let inserted = 0

    try {
      for (const fund of fundData) {
        // 检查基金是否已存在
        const existingFund = await this.findExistingFund(db, fund.name, fund.manager)

        if (existingFund) {
          // 更新现有记录
          await this.updateFund(db, fund, existingFund.id)
          updated++
        } else {
          // 插入新记录
          await this.insertFund(db, fund)
          inserted++
        }
      }
    } catch (error) {
      console.error('保存数据失败:', error)
      throw error
    }

    return { updated, inserted }
  }

  /**
   * 查找已存在的基金
   */
  private async findExistingFund(db: any, name: string, manager: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const dbInstance = (db as any).db

      // 首先尝试通过名称查找
      dbInstance.all(
        'SELECT id, manager FROM funds WHERE name = ?',
        [name],
        (err: Error | null, rows: any[]) => {
          if (err) { reject(err); return }
          if (rows.length === 0) { resolve(null); return }
          if (rows.length === 1) { resolve(rows[0]); return }

          const exactMatch = rows.find(r => r.manager === manager)
          if (exactMatch) { resolve(exactMatch); return }

          const unknownManager = rows.find(r => !r.manager || r.manager === '未知')
          if (unknownManager) { resolve(unknownManager); return }

          resolve(rows[0])
        }
      )
    })
  }

  /**
   * 更新基金信息 (Partial Update)
   */
  private async updateFund(db: any, fund: any, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbInstance = (db as any).db

      // Build dynamic UPDATE query
      const fields: string[] = []
      const values: any[] = []

      // Helper to add field if present
      const addField = (col: string, val: any) => {
        if (val !== undefined && val !== null) {
          fields.push(`${col} = ?`)
          values.push(val)
        }
      }

      addField('name', fund.name)
      addField('strategy', fund.strategy)
      addField('manager', fund.manager)
      addField('latest_nav_date', fund.latestNavDate?.toISOString())
      addField('cumulative_return', fund.cumulativeReturn)
      // Removed calculated metrics to prevent overwriting with empty values from sync
      // addField('annualized_return', fund.annualizedReturn)
      // addField('max_drawdown', fund.maxDrawdown)
      // addField('sharpe_ratio', fund.sharpeRatio)
      // addField('volatility', fund.volatility)
      addField('total_assets', fund.totalAssets)
      addField('standing_assets', fund.standingAssets)
      addField('cash_allocation', fund.cashAllocation)
      addField('status', fund.status)
      addField('establishment_date', fund.establishmentDate?.toISOString())
      addField('cost', fund.cost)
      addField('scale', fund.scale)
      addField('weekly_return', fund.weeklyReturn)
      addField('yearly_return', fund.yearlyReturn)
      addField('daily_return', fund.dailyReturn)
      addField('daily_pnl', fund.dailyPnl)
      addField('concentration', fund.concentration)
      addField('source_table', (fund as any).source_table)

      if (fund.dailyCapitalUsage !== undefined) {
        fields.push('daily_capital_usage = ?')
        values.push(fund.dailyCapitalUsage)
      }

      if (fund.weeklyPnl !== undefined) {
        fields.push('weekly_pnl = ?')
        values.push(fund.weeklyPnl)
      }

      if (fund.yearlyPnl !== undefined) {
        fields.push('yearly_pnl = ?')
        values.push(fund.yearlyPnl)
      }

      // Always update timestamp
      fields.push('updated_at = CURRENT_TIMESTAMP')

      // Execute update if there are fields to update
      if (fields.length === 0) {
        resolve()
        return
      }

      const sql = `UPDATE funds SET ${fields.join(', ')} WHERE id = ?`
      values.push(id)

      const stmt = dbInstance.prepare(sql)

      stmt.run(values, (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })

      stmt.finalize()
    })
  }

  /**
   * 插入新基金
   */
  private async insertFund(db: any, fund: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbInstance = (db as any).db
      const stmt = dbInstance.prepare(`
        INSERT INTO funds (
          record_id, name, strategy, manager, latest_nav_date, cumulative_return,
          annualized_return, max_drawdown, sharpe_ratio, volatility,
          total_assets, standing_assets, cash_allocation, status,
          establishment_date, cost, scale, weekly_return, daily_return, daily_pnl, concentration, source_table
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run([
        fund.id, // fund.id is the Feishu record_id
        fund.name,
        fund.strategy,
        fund.manager,
        fund.latestNavDate?.toISOString(),
        fund.cumulativeReturn,
        fund.annualizedReturn,
        fund.maxDrawdown,
        fund.sharpeRatio,
        fund.volatility,
        fund.totalAssets,
        fund.standingAssets,
        fund.cashAllocation,
        fund.status,
        fund.establishmentDate?.toISOString(),
        fund.cost,
        fund.scale,
        fund.weeklyReturn || 0,
        fund.dailyReturn || 0,
        fund.dailyPnl || 0,
        fund.concentration || 0,
        (fund as any).source_table
      ], (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })

      stmt.finalize()
    })
  }

  /**
   * 生成ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * 获取应用信息
   */
  async getBitableInfo(appToken: string) {
    try {
      const [app, tables] = await Promise.all([
        this.api.getBitableApp(appToken),
        this.api.getBitableTables(appToken)
      ])

      return {
        app: {
          name: app.name,
          url: app.url,
          avatar: app.avatar
        },
        tables: tables.map((table: any) => ({
          table_id: table.table_id,
          name: table.name,
          revision: table.revision
        }))
      }
    } catch (error) {
      console.error('获取多维表格信息失败:', error)
      throw error
    }
  }

  /**
   * 同步净值历史数据
   */
  private async syncNavHistory(records: any[]): Promise<{ inserted: number }> {
    const db = getDatabase()
    const dbInstance = (db as any).db
    let inserted = 0

    return new Promise((resolve, reject) => {
      dbInstance.serialize(() => {
        // 清空历史数据表
        dbInstance.run('DELETE FROM fund_nav_history', (err: Error | null) => {
          if (err) {
            console.error('清空历史数据失败:', err)
            reject(err)
            return
          }

          const stmt = dbInstance.prepare(`
            INSERT INTO fund_nav_history (
              fund_id, nav_date, unit_nav, cumulative_nav, daily_return,
              total_assets, status, cost, market_value, position_change, daily_pnl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)

          for (const record of records) {
            try {
              const fields = record.fields
              const fundName = fields['基金名称'] || ''
              const navDate = this.parseNavDate(fields['净值日期'])
              const virtualNav = this.parseNumber(fields['虚拟净值'])
              const unitNav = this.parseNumber(fields['单位净值'])
              const cumulativeNav = this.parseNumber(fields['累计净值'])
              const dailyReturn = this.parseNumber(fields['本年收益率']) // 使用本年收益率作为日收益率
              const totalAssets = this.parseNumber(fields['资产净值'])
              const status = fields['状态'] || '正常'
              const cost = this.parseNumber(fields['投资成本'])
              const marketValue = this.parseNumber(fields['市值'])
              const positionChange = this.parseNumber(fields['持仓变化'])
              const dailyPnl = this.parseNumber(fields['当日盈亏'])

              if (!fundName || !navDate) continue

              stmt.run([
                fundName, // 使用基金名称作为fund_id
                navDate,
                unitNav,
                virtualNav, // 虚拟净值作为cumulative_nav
                dailyReturn,
                totalAssets,
                status,
                cost,
                marketValue,
                positionChange,
                dailyPnl
              ], (err: Error | null) => {
                if (err) {
                  console.error(`插入历史数据失败 ${fundName}:`, err)
                } else {
                  inserted++
                }
              })
            } catch (error) {
              console.warn(`处理历史记录失败:`, error)
            }
          }

          stmt.finalize((err: Error | null) => {
            if (err) reject(err)
            else resolve({ inserted })
          })
        })
      })
    })
  }

  /**
   * 计算基金指标
   */
  async calculateFundMetrics(): Promise<{ fundsUpdated: number }> {
    const db = getDatabase()
    const dbInstance = (db as any).db
    let fundsUpdated = 0

    return new Promise((resolve, reject) => {
      // 获取所有基金的历史数据
      dbInstance.all(`
        SELECT DISTINCT fund_id FROM fund_nav_history
      `, async (err: Error | null, funds: any[]) => {
        if (err) {
          reject(err)
          return
        }

        for (const fund of funds) {
          try {
            const metrics = await this.calculateMetricsForFund(dbInstance, fund.fund_id)
            await this.updateFundMetrics(dbInstance, fund.fund_id, metrics)
            fundsUpdated++
          } catch (error) {
            console.error(`计算基金 ${fund.fund_id} 指标失败:`, error)
          }
        }

        resolve({ fundsUpdated })
      })
    })
  }

  /**
   * 计算单个基金的指标
   */
  private async calculateMetricsForFund(db: any, fundId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT nav_date, cumulative_nav, daily_return
        FROM fund_nav_history
        WHERE fund_id = ? AND cumulative_nav > 0
        ORDER BY nav_date ASC
      `, [fundId], (err: Error | null, history: any[]) => {
        if (err) {
          reject(err)
          return
        }

        if (history.length < 2) {
          resolve({ maxDrawdown: 0, volatility: 0, sharpeRatio: 0, annualizedReturn: 0 })
          return
        }

        try {
          // 计算最大回撤
          let maxDrawdown = 0
          let peak = history[0].cumulative_nav
          for (const point of history) {
            const nav = parseFloat(point.cumulative_nav)
            if (isNaN(nav) || nav <= 0) continue

            if (nav > peak) {
              peak = nav
            }
            const drawdown = (peak - nav) / peak
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown
            }
          }

          // 计算日收益率序列
          const returns: number[] = []
          for (let i = 1; i < history.length; i++) {
            const prevNav = parseFloat(history[i - 1].cumulative_nav)
            const currNav = parseFloat(history[i].cumulative_nav)
            if (isNaN(prevNav) || isNaN(currNav) || prevNav <= 0 || currNav <= 0) continue

            returns.push((currNav - prevNav) / prevNav)
          }

          // 计算波动率（年化）
          let volatility = 0
          if (returns.length > 1) {
            const mean = returns.reduce((a, b) => a + b, 0) / returns.length
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
            volatility = Math.sqrt(variance) * Math.sqrt(252) // 年化
          }

          // 计算年化收益率
          const firstNav = parseFloat(history[0].cumulative_nav)
          const lastNav = parseFloat(history[history.length - 1].cumulative_nav)
          const firstDate = new Date(history[0].nav_date)
          const lastDate = new Date(history[history.length - 1].nav_date)
          const days = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)

          let annualizedReturn = 0
          if (days > 0 && firstNav > 0 && lastNav > 0) {
            const totalReturn = (lastNav / firstNav) - 1
            annualizedReturn = Math.pow(1 + totalReturn, 365 / days) - 1
          }

          // 计算夏普比率（假设无风险利率为2%）
          const riskFreeRate = 0.02
          const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0

          resolve({
            maxDrawdown, // 已经是小数形式 (如0.15表示15%)
            volatility,  // 已经是小数形式
            sharpeRatio, // 夏普比率不需要百分比格式
            annualizedReturn // 已经是小数形式
          })
        } catch (error) {
          console.error(`计算基金 ${fundId} 指标时出错:`, error)
          resolve({ maxDrawdown: 0, volatility: 0, sharpeRatio: 0, annualizedReturn: 0 })
        }
      })
    })
  }

  /**
   * 更新基金指标
   */
  private async updateFundMetrics(db: any, fundId: string, metrics: any): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE funds
        SET max_drawdown = ?, sharpe_ratio = ?, volatility = ?, annualized_return = ?
        WHERE name = ?
      `, [
        metrics.maxDrawdown,
        metrics.sharpeRatio,
        metrics.volatility,
        metrics.annualizedReturn,
        fundId
      ], (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  /**
   * 解析净值日期
   */
  private parseNavDate(value: any): string | null {
    if (!value) return null

    if (typeof value === 'number') {
      // 时间戳（毫秒）
      const date = new Date(value)
      // 使用本地时间（假设服务器运行在UTC+8或需要强制UTC+8）
      // 飞书返回的时间戳通常是UTC+8的0点对应的UTC时间
      // 我们需要将其转换为UTC+8的日期字符串
      const offset = 8 * 60 * 60 * 1000 // UTC+8
      const localDate = new Date(date.getTime() + offset)
      return localDate.toISOString().split('T')[0]
    }

    if (typeof value === 'string') {
      return value.split('T')[0]
    }

    return null
  }

  /**
   * 解析数字
   */
  private parseNumber(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      const cleaned = value.replace(/[%,¥]/g, '')
      return parseFloat(cleaned) || 0
    }
    return 0
  }
}
