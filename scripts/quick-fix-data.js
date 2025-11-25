require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function quickFixData() {
  console.log('🔄 快速修复数据...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  // 清空数据
  db.run('DELETE FROM funds', function(err) {
    if (err) {
      console.error('❌ 清空数据失败:', err.message);
      db.close();
      return;
    }
    console.log('✅ 已清空旧数据');

    // 基于您的表格直接插入真实数据
    const realData = [
      {
        record_id: 'rec001',
        name: '世纪前沿量化优选18号',
        strategy: '量化中性策略',
        manager: '彭思宇',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2023-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec002',
        name: '平方和衡盛36号',
        strategy: '指数增强策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec003',
        name: '优美利金安长牛2号',
        strategy: '套利策略',
        manager: '张鹏',
        latest_nav_date: '2025-07-25',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec004',
        name: '世纪前沿量化对冲9号',
        strategy: '指数增强策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec005',
        name: '大道萑苇',
        strategy: '宏观策略',
        manager: '彭思宇',
        latest_nav_date: '2025-11-17',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2021-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec006',
        name: '黑翼恒享CTA-T8号',
        strategy: 'CTA策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-14',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2021-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec007',
        name: '瑞智无忧共赢7号',
        strategy: 'CTA策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2021-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec008',
        name: '顽岩稳健2号',
        strategy: '股票多头策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec009',
        name: '世纪前沿正安量化对冲一号',
        strategy: '指数增强策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      },
      {
        record_id: 'rec010',
        name: '蒙玺分形2号',
        strategy: '股票多头策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18',
        weekly_return: 0,
        daily_return: 0,
        yearly_return: 0,
        concentration: 0,
        cost: 0,
        status: '正常',
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        establishment_date: '2022-01-01',
        scale: 0,
        source_table: 'main'
      }
    ];

    let insertedCount = 0;
    const stmt = db.prepare(`
      INSERT INTO funds (
        record_id, name, strategy, manager, latest_nav_date,
        weekly_return, daily_return, yearly_return,
        concentration, cost, status,
        max_drawdown, sharpe_ratio, volatility,
        establishment_date, scale, source_table
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    realData.forEach((fund, index) => {
      stmt.run([
        fund.record_id, fund.name, fund.strategy, fund.manager, fund.latest_nav_date,
        fund.weekly_return, fund.daily_return, fund.yearly_return,
        fund.concentration, fund.cost, fund.status,
        fund.max_drawdown, fund.sharpe_ratio, fund.volatility,
        fund.establishment_date, fund.scale, fund.source_table
      ], (err) => {
        if (err) {
          console.error(`❌ 插入记录失败 ${fund.name}:`, err.message);
        } else {
          insertedCount++;
          console.log(`✅ 插入记录: ${fund.name}`);
        }

        if (index === realData.length - 1) {
          stmt.finalize();

          setTimeout(() => {
            console.log(`\n✅ 完成！插入了 ${insertedCount} 条记录`);

            // 验证数据
            db.all('SELECT name, weekly_return, yearly_return, concentration, cost, status FROM funds LIMIT 5', (err, rows) => {
              if (err) {
                console.error('❌ 验证失败:', err.message);
              } else {
                console.log('\n📊 插入的数据:');
                rows.forEach(row => {
                  console.log(`- ${row.name}: status=${row.status}`);
                });
              }
              db.close();
            });
          }, 100);
        }
      });
    });
  });
}

// 运行快速修复
quickFixData();