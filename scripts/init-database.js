const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '..', 'data', 'funds.db');

// 示例基金数据
const sampleFunds = [
  {
    id: 'fund_001',
    name: '正瀛骐骥指数增强17号',
    strategy: '指数增强',
    manager: '张经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 15.2,
    annualized_return: 18.5,
    max_drawdown: -8.2,
    sharpe_ratio: 1.85,
    volatility: 12.3,
    total_assets: 220866614.30,
    standing_assets: 200000000,
    cash_allocation: 5013067.47,
    status: '正常',
    establishment_date: '2023-06-15',
    cost: 200000000,
    scale: 220866614.30
  },
  {
    id: 'fund_002',
    name: '平方和衡盛36号',
    strategy: '指数增强',
    manager: '王经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 11.5,
    annualized_return: 14.2,
    max_drawdown: -7.8,
    sharpe_ratio: 1.67,
    volatility: 11.5,
    total_assets: 263406404.41,
    standing_assets: 250000000,
    cash_allocation: 5106923.86,
    status: '正常',
    establishment_date: '2023-08-20',
    cost: 250000000,
    scale: 263406404.41
  },
  {
    id: 'fund_003',
    name: '世纪前沿量化对冲9号',
    strategy: '市场中性',
    manager: '李经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 8.7,
    annualized_return: 10.8,
    max_drawdown: -5.2,
    sharpe_ratio: 1.92,
    volatility: 8.7,
    total_assets: 635316974.28,
    standing_assets: 600000000,
    cash_allocation: 5013067.47,
    status: '正常',
    establishment_date: '2023-04-10',
    cost: 600000000,
    scale: 635316974.28
  },
  {
    id: 'fund_004',
    name: '千衍三涛15号',
    strategy: 'CTA策略',
    manager: '赵经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 12.8,
    annualized_return: 15.6,
    max_drawdown: -12.1,
    sharpe_ratio: 1.23,
    volatility: 15.8,
    total_assets: 142566565.10,
    standing_assets: 140000000,
    cash_allocation: 4972602.74,
    status: '正常',
    establishment_date: '2023-09-05',
    cost: 140000000,
    scale: 142566565.10
  },
  {
    id: 'fund_005',
    name: '远澜翠柏1号',
    strategy: '宏观策略',
    manager: '陈经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 9.3,
    annualized_return: 11.7,
    max_drawdown: -9.5,
    sharpe_ratio: 1.45,
    volatility: 13.2,
    total_assets: 128636539.71,
    standing_assets: 120000000,
    cash_allocation: 4726027.40,
    status: '正常',
    establishment_date: '2023-07-12',
    cost: 120000000,
    scale: 128636539.71
  },
  {
    id: 'fund_006',
    name: '第一创业FOF优选1号',
    strategy: 'FOF',
    manager: '刘经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 9.2,
    annualized_return: 11.2,
    max_drawdown: -6.8,
    sharpe_ratio: 1.68,
    volatility: 9.5,
    total_assets: 183742966.04,
    standing_assets: 180000000,
    cash_allocation: 5013067.47,
    status: '正常',
    establishment_date: '2023-05-18',
    cost: 180000000,
    scale: 183742966.04
  },
  {
    id: 'fund_007',
    name: '华泰优选43号FOF',
    strategy: 'FOF',
    manager: '孙经理',
    latest_nav_date: '2025-11-17',
    cumulative_return: 7.8,
    annualized_return: 9.6,
    max_drawdown: -5.5,
    sharpe_ratio: 1.72,
    volatility: 8.2,
    total_assets: 215616648.80,
    standing_assets: 210000000,
    cash_allocation: 10636153.78,
    status: '正常',
    establishment_date: '2023-06-25',
    cost: 210000000,
    scale: 215616648.80
  }
];

// 生成示例净值历史数据
function generateNavHistory(fundId, fundName, baseReturn) {
  const history = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);

  let cumulativeNav = 1.0;

  for (let i = 0; i < 365; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);

    // 生成日收益率 (基于年化收益率)
    const dailyReturn = (baseReturn / 365 / 100) + (Math.random() - 0.5) * 0.02;
    cumulativeNav *= (1 + dailyReturn);

    history.push({
      fund_id: fundId,
      nav_date: currentDate.toISOString().split('T')[0],
      unit_nav: cumulativeNav,
      cumulative_nav: cumulativeNav,
      daily_return: dailyReturn * 100,
      total_assets: 100000000 + Math.random() * 50000000,
      status: '正常',
      record_time: currentDate.toISOString(),
      cost: 100000000,
      market_value: cumulativeNav * 100000000,
      position_change: 0
    });
  }

  return history;
}

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
      console.log('正在初始化数据库...');

      // 创建表结构
      db.run(`
        CREATE TABLE IF NOT EXISTS funds (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          strategy TEXT,
          manager TEXT,
          latest_nav_date DATE,
          cumulative_return REAL,
          annualized_return REAL,
          max_drawdown REAL,
          sharpe_ratio REAL,
          volatility REAL,
          total_assets REAL,
          standing_assets REAL,
          cash_allocation REAL,
          status TEXT,
          establishment_date DATE,
          cost REAL,
          scale REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
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

      db.run(`
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
      db.run('CREATE INDEX IF NOT EXISTS idx_fund_nav_date ON fund_nav_history (fund_id, nav_date)');
      db.run('CREATE INDEX IF NOT EXISTS idx_fund_strategy ON funds (strategy)');
      db.run('CREATE INDEX IF NOT EXISTS idx_fund_manager ON funds (manager)');

      // 插入示例基金数据
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO funds (
          id, name, strategy, manager, latest_nav_date, cumulative_return,
          annualized_return, max_drawdown, sharpe_ratio, volatility,
          total_assets, standing_assets, cash_allocation, status,
          establishment_date, cost, scale, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);

      sampleFunds.forEach(fund => {
        stmt.run([
          fund.id, fund.name, fund.strategy, fund.manager, fund.latest_nav_date,
          fund.cumulative_return, fund.annualized_return, fund.max_drawdown,
          fund.sharpe_ratio, fund.volatility, fund.total_assets, fund.standing_assets,
          fund.cash_allocation, fund.status, fund.establishment_date,
          fund.cost, fund.scale
        ]);
      });

      stmt.finalize();

      // 插入净值历史数据
      const navStmt = db.prepare(`
        INSERT OR REPLACE INTO fund_nav_history (
          fund_id, nav_date, unit_nav, cumulative_nav, daily_return,
          total_assets, status, record_time, cost, market_value, position_change
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleFunds.forEach(fund => {
        const navHistory = generateNavHistory(fund.id, fund.name, fund.annualized_return);

        navHistory.forEach(nav => {
          navStmt.run([
            nav.fund_id, nav.nav_date, nav.unit_nav, nav.cumulative_nav,
            nav.daily_return, nav.total_assets, nav.status, nav.record_time,
            nav.cost, nav.market_value, nav.position_change
          ]);
        });
      });

      navStmt.finalize();

      // 记录初始化日志
      db.run(`
        INSERT INTO sync_logs (
          sync_type, status, records_processed, records_updated,
          sync_start, sync_end
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'database_init',
        'success',
        sampleFunds.length,
        sampleFunds.length,
        new Date().toISOString(),
        new Date().toISOString()
      ]);

      console.log(`数据库初始化完成！插入了 ${sampleFunds.length} 支基金的数据`);
    });

    db.close((err) => {
      if (err) {
        console.error('关闭数据库连接失败:', err);
        reject(err);
      } else {
        console.log('数据库连接已关闭');
        resolve();
      }
    });
  });
}

// 运行初始化
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('数据库初始化成功完成！');
      process.exit(0);
    })
    .catch((err) => {
      console.error('数据库初始化失败:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase, sampleFunds };