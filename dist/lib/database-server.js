"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
exports.getDatabase = getDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = require("path");
const DB_PATH = (0, path_1.join)(process.cwd(), 'data', 'funds.db');
class Database {
    constructor() {
        this.db = new sqlite3_1.default.Database(DB_PATH);
        this.initTables();
    }
    initTables() {
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
    `);
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
    `);
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
    `);
        // 创建索引
        this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_nav_date ON fund_nav_history (fund_id, nav_date)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_strategy ON funds (strategy)');
        this.db.run('CREATE INDEX IF NOT EXISTS idx_fund_manager ON funds (manager)');
    }
    // 基金相关操作
    async getAllFunds(source = 'main') {
        return new Promise((resolve, reject) => {
            this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.record_id = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [source], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async getFundById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM funds WHERE record_id = ?', [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
    }
    async getFundsByStrategy(strategy, source = 'main') {
        return new Promise((resolve, reject) => {
            this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.record_id = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.strategy = ? AND f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [strategy, source], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async getFundsByManager(manager, source = 'main') {
        return new Promise((resolve, reject) => {
            this.db.all(`
        SELECT f.*, h.daily_return as history_daily_return
        FROM funds f
        LEFT JOIN fund_nav_history h ON f.record_id = h.fund_id AND f.latest_nav_date = h.nav_date
        WHERE f.manager = ? AND f.source_table = ?
        ORDER BY f.yearly_return DESC
      `, [manager, source], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    // 统计相关操作
    async getStrategyStats(source = 'main') {
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
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async getManagerStats(source = 'main') {
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
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async getFundHistory(fundId) {
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
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    // 关闭数据库连接
    close() {
        this.db.close();
    }
}
exports.Database = Database;
// 创建全局数据库实例
let dbInstance;
function getDatabase() {
    if (!dbInstance) {
        dbInstance = new Database();
    }
    return dbInstance;
}
