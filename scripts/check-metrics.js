const Database = require('better-sqlite3')
const db = new Database('./data/funds.db')

console.log('=== 数据库指标检查 ===\n')

// 获取所有非FOF的产品
const funds = db.prepare(`
    SELECT name, status, cost, daily_capital_usage, daily_pnl, weekly_pnl, yearly_pnl, yearly_return, weekly_return
    FROM funds 
    WHERE source_table IN ('main', 'merged')
`).all()

console.log(`总产品数: ${funds.length}`)

const normalFunds = funds.filter(f => f.status !== '已赎回')
console.log(`正常产品数 (排除已赎回): ${normalFunds.length}`)

// 计算各项指标
const totalCost = normalFunds.reduce((sum, f) => sum + (f.cost || 0), 0)
const totalDailyCapitalUsage = funds.reduce((sum, f) => sum + (f.daily_capital_usage || 0), 0)
const todayReturn = normalFunds.reduce((sum, f) => sum + (f.daily_pnl || 0), 0)
const totalWeeklyPnl = normalFunds.reduce((sum, f) => sum + (f.weekly_pnl || 0), 0)
const totalYearlyPnl = funds.reduce((sum, f) => sum + (f.yearly_pnl || 0), 0)

console.log('\n--- 当前计算方式 ---')
console.log(`总规模 (normalFunds的cost之和): ¥${totalCost.toLocaleString()}`)
console.log(`总日均资金占用 (所有funds的daily_capital_usage之和): ¥${totalDailyCapitalUsage.toLocaleString()}`)
console.log(`今日收益 (normalFunds的daily_pnl之和): ¥${todayReturn.toLocaleString()}`)
console.log(`本周收益 (normalFunds的weekly_pnl之和): ¥${totalWeeklyPnl.toLocaleString()}`)
console.log(`本年收益 (所有funds的yearly_pnl之和): ¥${totalYearlyPnl.toLocaleString()}`)

const weeklyReturn = totalCost ? totalWeeklyPnl / totalCost : 0
const annualReturn = totalDailyCapitalUsage ? totalYearlyPnl / totalDailyCapitalUsage : 0

console.log(`\n七天内收益率 (weekly_pnl/cost): ${(weeklyReturn * 100).toFixed(2)}%`)
console.log(`本年收益率 (yearly_pnl/daily_capital_usage): ${(annualReturn * 100).toFixed(2)}%`)

// 检查正确的本年收益率计算: yearly_pnl / daily_capital_usage (只用正常基金)
const normalDailyCapitalUsage = normalFunds.reduce((sum, f) => sum + (f.daily_capital_usage || 0), 0)
const normalYearlyPnl = normalFunds.reduce((sum, f) => sum + (f.yearly_pnl || 0), 0)
console.log(`\n--- 仅正常基金 ---`)
console.log(`正常基金日均资金占用: ¥${normalDailyCapitalUsage.toLocaleString()}`)
console.log(`正常基金本年收益: ¥${normalYearlyPnl.toLocaleString()}`)
console.log(`本年收益率 (正常基金): ${((normalYearlyPnl / normalDailyCapitalUsage) * 100).toFixed(2)}%`)

// 显示前10个产品详情
console.log('\n--- 前10个产品详情 ---')
console.log('名称 | 状态 | 成本 | 日均资金占用 | 本年收益 | 本年收益率')
funds.slice(0, 10).forEach(f => {
  console.log(`${f.name} | ${f.status || '正常'} | ¥${(f.cost || 0).toLocaleString()} | ¥${(f.daily_capital_usage || 0).toLocaleString()} | ¥${(f.yearly_pnl || 0).toLocaleString()} | ${((f.yearly_return || 0) * 100).toFixed(2)}%`)
})

// 检查已赎回产品
const redeemedFunds = funds.filter(f => f.status === '已赎回')
console.log(`\n--- 已赎回产品 (${redeemedFunds.length}个) ---`)
redeemedFunds.forEach(f => {
  console.log(`${f.name} | 日均资金占用: ¥${(f.daily_capital_usage || 0).toLocaleString()} | 本年收益: ¥${(f.yearly_pnl || 0).toLocaleString()}`)
})

db.close()
