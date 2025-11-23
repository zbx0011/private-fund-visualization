require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function insertTestData() {
  console.log('🔄 插入测试数据...\n');

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

    // 插入测试数据
    const testData = [
      {
        record_id: 'test001',
        name: '世纪前沿量化优选18号',
        strategy: '量化中性策略',
        manager: '彭思宇',
        latest_nav_date: '2025-11-18T16:23:18.000Z',
        weekly_return: -0.0137454909276001,
        daily_return: -0.019638162783793954,
        yearly_return: 0.1653947308076,
        concentration: 0.042050238780701,
        cost: 5013067.47,
        status: '正常',
        max_drawdown: 0.05,
        sharpe_ratio: 1.2,
        volatility: 0.08,
        establishment_date: '2023-01-15',
        scale: 10000000,
        source_table: 'main'
      },
      {
        record_id: 'test002',
        name: '平方和衡盛36号',
        strategy: '指数增强策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-18T16:23:18.000Z',
        weekly_return: 0.00178899544853576,
        daily_return: -0.002155807792129507,
        yearly_return: 0.148790648738383,
        concentration: 0.0165860339264938,
        cost: 5106923.86,
        status: '正常',
        max_drawdown: 0.08,
        sharpe_ratio: 1.5,
        volatility: 0.12,
        establishment_date: '2022-06-20',
        scale: 15000000,
        source_table: 'main'
      },
      {
        record_id: 'test003',
        name: '黑翼恒享CTA-T8号',
        strategy: 'CTA策略',
        manager: '张鹏',
        latest_nav_date: '2025-11-14T16:23:18.000Z',
        weekly_return: 0.000387797311199829,
        daily_return: 0.000387797311199828,
        yearly_return: 0.0946871766323999,
        concentration: 0.0103301236275836,
        cost: 5000000,
        status: '已赎回',
        max_drawdown: 0.12,
        sharpe_ratio: 0.9,
        volatility: 0.15,
        establishment_date: '2021-09-10',
        scale: 8000000,
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

    testData.forEach((fund, index) => {
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

        if (index === testData.length - 1) {
          stmt.finalize();

          setTimeout(() => {
            console.log(`\n✅ 完成！插入了 ${insertedCount} 条测试记录`);

            // 验证数据
            db.all('SELECT name, weekly_return, daily_return, yearly_return, concentration, cost, status FROM funds', (err, rows) => {
              if (err) {
                console.error('❌ 验证失败:', err.message);
              } else {
                console.log('\n📊 插入的数据:');
                rows.forEach(row => {
                  console.log(`- ${row.name}: 本周收益率=${row.weekly_return}, 本年收益率=${row.yearly_return}, 集中度=${row.concentration}, 成本=${row.cost}, 状态=${row.status}`);
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

// 运行插入测试数据
insertTestData();