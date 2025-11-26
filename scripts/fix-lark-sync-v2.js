
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/lark-sync.ts');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find the start of the syncNavHistory method
const splitIndex = lines.findIndex(line => line.includes('private async syncNavHistory'));

if (splitIndex !== -1) {
    console.log(`Found syncNavHistory at line ${splitIndex + 1}. Truncating and fixing...`);

    // Walk back to find the closing brace of the previous method (getBitableInfo)
    let cutIndex = splitIndex;
    for (let i = splitIndex - 1; i >= 0; i--) {
        if (lines[i].trim() === '}') {
            cutIndex = i + 1;
            break;
        }
    }

    console.log(`Cutting file at line ${cutIndex + 1}`);

    const cleanContent = lines.slice(0, cutIndex).join('\n');

    const newCode = `
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

          const stmt = dbInstance.prepare(\`
            INSERT INTO fund_nav_history (
              fund_id, nav_date, unit_nav, cumulative_nav, daily_return,
              total_assets, status, cost, market_value, position_change, daily_pnl
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          \`)

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
              const dailyPnl = this.parseNumber(fields['本日盈亏'])

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
                  console.error(\`插入历史数据失败 \${fundName}:\`, err)
                } else {
                  inserted++
                }
              })
            } catch (error) {
              console.warn(\`处理历史记录失败:\`, error)
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
      dbInstance.all(\`
        SELECT DISTINCT fund_id FROM fund_nav_history
      \`, async (err: Error | null, funds: any[]) => {
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
            console.error(\`计算基金 \${fund.fund_id} 指标失败:\`, error)
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
      db.all(\`
        SELECT nav_date, cumulative_nav, daily_return
        FROM fund_nav_history
        WHERE fund_id = ? AND cumulative_nav > 0
        ORDER BY nav_date ASC
      \`, [fundId], (err: Error | null, history: any[]) => {
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
          console.error(\`计算基金 \${fundId} 指标时出错:\`, error)
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
      db.run(\`
        UPDATE funds
        SET max_drawdown = ?, sharpe_ratio = ?, volatility = ?, annualized_return = ?
        WHERE name = ?
      \`, [
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
`;

    fs.writeFileSync(filePath, cleanContent + '\n' + newCode);
    console.log('File successfully repaired.');

} else {
    console.error('Could not find "private async syncNavHistory" in the file.');
}
