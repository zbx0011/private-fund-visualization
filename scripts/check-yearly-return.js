const Database = require('better-sqlite3')
const db = new Database('./data/funds.db')

const funds = db.prepare(`
    SELECT name, yearly_return, yearly_pnl, cost, daily_capital_usage 
    FROM funds 
    WHERE source_table IN ('main', 'merged') 
    LIMIT 10
`).all()

console.log('Sample fund data:')
console.log(JSON.stringify(funds, null, 2))

// Calculate totals
const allFunds = db.prepare(`
    SELECT yearly_return, yearly_pnl, cost, daily_capital_usage, status
    FROM funds 
    WHERE source_table IN ('main', 'merged')
`).all()

let totalYearlyPnl = 0
let totalDailyCapitalUsage = 0
let weightedReturn = 0
let totalCost = 0

allFunds.forEach(f => {
    totalYearlyPnl += f.yearly_pnl || 0
    totalDailyCapitalUsage += f.daily_capital_usage || 0
    if (f.status !== '已赎回') {
        weightedReturn += (f.yearly_return || 0) * (f.cost || 0)
        totalCost += f.cost || 0
    }
})

console.log('\n--- Calculation Results ---')
console.log('Total Yearly PnL:', totalYearlyPnl)
console.log('Total Daily Capital Usage:', totalDailyCapitalUsage)
console.log('Current Calculation (yearly_pnl / daily_capital_usage):', totalYearlyPnl / totalDailyCapitalUsage)
console.log('')
console.log('Total Cost:', totalCost)
console.log('Weighted Return (sum of yearly_return * cost):', weightedReturn)
console.log('Correct Calculation (weighted_return / total_cost):', weightedReturn / totalCost)

db.close()
