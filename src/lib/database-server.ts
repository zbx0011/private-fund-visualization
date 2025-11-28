import sqlite3 from 'sqlite3'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'funds.db')

export class Database {
  private db: sqlite3.Database

  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
    this.initTables()
  }

  private initTables() {
    // 基金基本信息表 - 更新为新的列结构
    this.db.run(`
      CREATE TABLE IF NOT EXISTS funds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id TEXT UNIQUE,
        name TEXT NOT NULL,
        strategy TEXT,
        manager TEXT,
        latest_nav_date DATE,

        -- 新的收益率字段
        weekly_return REAL DEFAULT 0,
        daily_return REAL DEFAULT 0,
        daily_pnl REAL DEFAULT 0,
        yearly_return REAL DEFAULT 0,
        cumulative_return REAL DEFAULT 0,
        annualized_return REAL DEFAULT 0,

        -- 新的集中度和成本字段
        concentration REAL DEFAULT 0,
        cost REAL DEFAULT 0,
        total_assets REAL DEFAULT 0,
        standing_assets REAL DEFAULT 0,
        cash_allocation REAL DEFAULT 0,

        -- 状态字段
        status TEXT DEFAULT '正常',

        -- 需要计算的字段
        max_drawdown REAL DEFAULT 0,
        sharpe_ratio REAL DEFAULT 0,
        volatility REAL DEFAULT 0,

        -- 保留字段
        establishment_date DATE,
        scale REAL DEFAULT 0,
        source_table TEXT DEFAULT 'main',

        -- 时间戳
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 基金净值历史表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS fund_nav_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fund_id TEXT,
        nav_date DATE,
        unit_nav REAL,
        cumulative_nav REAL,
        daily_return REAL,
        total_assets REAL,
        status TEXT,
        record_time DATETIME,
        cost REAL,
        market_value REAL,
        position_change REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (fund_id) REFERENCES funds (id)
      )
    `)

    // 数据同步日志表
    this.db.run(`
      CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT,
        status TEXT,
        records_processed INTEGER,
        records_updated INTEGER,
        error_message TEXT,
        sync_start DATETIME,
        sync_end DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建索引
    this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_nav_date ON fund_nav_history (fund_id, nav_date)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_strategy ON funds (strategy)')
    this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_manager ON funds (manager)')
  }

  // 基金相关操作
  async getAllFunds(source: string = 'main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.name = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [source], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getFundById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM funds WHERE record_id = ?', [id], (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    })
  }

  async getFundsByStrategy(strategy: string, source: string = 'main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.name = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.strategy = ? AND f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [strategy, source], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getFundsByManager(manager: string, source: string = 'main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.name = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.manager = ? AND f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [manager, source], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  // 统计相关操作
  async getStrategyStats(source: string = 'main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT
          strategy,
          COUNT(*) as fund_count,
          AVG(yearly_return) as avg_return,
          AVG(max_drawdown) as avg_max_drawdown,
          AVG(sharpe_ratio) as avg_sharpe_ratio,
          AVG(volatility) as avg_volatility,
          SUM(cost) as total_cost
        FROM funds
        WHERE strategy IS NOT NULL AND source_table = ?
        GROUP BY strategy
        ORDER BY avg_return DESC
      `, [source], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getManagerStats(source: string = 'main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT
          manager,
          COUNT(*) as fund_count,
          SUM(cost) as total_cost,
          AVG(yearly_return) as avg_return,
          MAX(yearly_return) as best_return,
          (SELECT name FROM funds f2 WHERE f2.manager = f1.manager AND f2.source_table = ? ORDER BY yearly_return DESC LIMIT 1) as best_fund_name
        FROM funds f1
        WHERE manager IS NOT NULL AND source_table = ?
        GROUP BY manager
        ORDER BY avg_return DESC
      `, [source, source], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getFundHistory(fundId: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          nav_date as date, 
          nav_date,
          daily_return as value, 
          daily_return,
          unit_nav, 
          cumulative_nav, 
          market_value
        FROM fund_nav_history
        WHERE fund_id = ?
        ORDER BY nav_date ASC
      `, [fundId], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  async getLastSyncTime(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT sync_end FROM sync_logs WHERE status = ? ORDER BY sync_end DESC LIMIT 1', ['success'], (err, row: any) => {
        if (err) reject(err)
        else resolve(row ? row.sync_end : null)
      })
    })
  }

  // 插入数据操作
  async insertFund(fund: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO funds (
          record_id, name, strategy, manager, latest_nav_date, 
          cumulative_return, annualized_return, max_drawdown, sharpe_ratio, volatility,
          total_assets, standing_assets, cash_allocation, status,
          establishment_date, cost, scale
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run([
        fund.id,
        fund.name,
        fund.strategy,
        fund.manager,
        fund.latestNavDate,
        fund.cumulativeReturn,
        fund.annualizedReturn,
        fund.maxDrawdown,
        fund.sharpeRatio,
        fund.volatility,
        fund.totalAssets,
        fund.standingAssets,
        fund.cashAllocation,
        fund.status,
        fund.establishmentDate,
        fund.cost,
        fund.scale
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
      stmt.finalize()
    })
  }

  async insertNavHistory(history: any): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO fund_nav_history (
          fund_id, nav_date, unit_nav, cumulative_nav, daily_return,
          total_assets, status, record_time, cost, market_value, position_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      stmt.run([
        history.fundId,
        history.navDate,
        history.unitNav,
        history.cumulativeNav,
        history.dailyReturn,
        history.totalAssets,
        history.status,
        history.recordTime,
        history.cost,
        history.marketValue,
        history.positionChange
      ], (err) => {
        if (err) reject(err)
        else resolve()
      })
      stmt.finalize()
    })
  }


  async getYieldCurveData(startDate: string = '2025-01-01'): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          h.nav_date as date,
          h.cumulative_nav,
          h.fund_id,
          f.strategy,
          f.name
        FROM fund_nav_history h
        JOIN funds f ON (h.fund_id = f.record_id OR h.fund_id = f.name)
        WHERE h.nav_date >= ? AND f.status != '已赎回'
        ORDER BY h.nav_date ASC
      `, [startDate], (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }

  // 关闭数据库连接
  close(): void {
    this.db.close()
  }
}

// 创建全局数据库实例
let dbInstance: Database

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database()
  }
  return dbInstance
}