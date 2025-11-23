require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function rebuildDatabaseStructure() {
  console.log('🔄 重建数据库结构...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 备份现有数据...');
    const backupPath = join(process.cwd(), 'data', 'funds_backup.db');

    // 备份现有数据
    db.all('SELECT * FROM funds', (err, rows) => {
      if (err) {
        console.error('❌ 备份数据失败:', err.message);
        db.close();
        return;
      }

      const backupDb = new sqlite3.Database(backupPath);
      backupDb.serialize(() => {
        // 创建新的表结构
        backupDb.run(`
          CREATE TABLE IF NOT EXISTS funds (
            id TEXT PRIMARY KEY,
            name TEXT,
            strategy TEXT,
            manager TEXT,
            latest_nav_date TEXT,
            max_drawdown REAL DEFAULT 0,
            sharpe_ratio REAL DEFAULT 0,
            volatility REAL DEFAULT 0,
            standing_assets REAL DEFAULT 0,
            status TEXT DEFAULT '正常',
            establishment_date TEXT,
            cost REAL DEFAULT 0,
            scale REAL DEFAULT 0,
            concentration REAL DEFAULT 0,
            weekly_return REAL DEFAULT 0,
            daily_return REAL DEFAULT 0,
            yearly_return REAL DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            source_table TEXT
          )
        `);

        console.log(`✅ 备份了 ${rows.length} 条记录`);

        console.log('\n2. 删除旧表...');
        db.run('DROP TABLE funds', function(err) {
          if (err) {
            console.error('❌ 删除旧表失败:', err.message);
            db.close();
            backupDb.close();
            return;
          }

          console.log('✅ 已删除旧表');

          console.log('\n3. 创建新表结构...');
          db.run(`
            CREATE TABLE funds (
              id TEXT PRIMARY KEY,
              name TEXT,
              strategy TEXT,
              manager TEXT,
              latest_nav_date TEXT,
              max_drawdown REAL DEFAULT 0,
              sharpe_ratio REAL DEFAULT 0,
              volatility REAL DEFAULT 0,
              standing_assets REAL DEFAULT 0,
              status TEXT DEFAULT '正常',
              establishment_date TEXT,
              cost REAL DEFAULT 0,
              scale REAL DEFAULT 0,
              concentration REAL DEFAULT 0,
              weekly_return REAL DEFAULT 0,
              daily_return REAL DEFAULT 0,
              yearly_return REAL DEFAULT 0,
              created_at TEXT DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
              source_table TEXT
            )
          `, function(err) {
            if (err) {
              console.error('❌ 创建新表失败:', err.message);
              db.close();
              backupDb.close();
              return;
            }

            console.log('✅ 已创建新表结构');

            console.log('\n4. 迁移数据到新表...');

            let migratedCount = 0;
            rows.forEach(row => {
              db.run(`
                INSERT INTO funds (
                  id, name, strategy, manager, latest_nav_date,
                  max_drawdown, sharpe_ratio, volatility, standing_assets, status,
                  establishment_date, cost, scale, concentration,
                  weekly_return, daily_return, yearly_return, source_table
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `, [
                row.id,
                row.name,
                row.strategy,
                row.manager,
                row.latest_nav_date,
                row.max_drawdown || 0,
                row.sharpe_ratio || 0,
                row.volatility || 0,
                row.standing_assets || 0,
                row.status || '正常',
                row.establishment_date,
                row.cost || 0,
                row.scale || 0,
                row.concentration || 0,
                row.weekly_return || 0,
                row.daily_return || 0,
                row.yearly_return || 0,
                row.source_table
              ], function(err) {
                if (err) {
                  console.error(`❌ 迁移记录失败 ${row.id}:`, err.message);
                } else {
                  migratedCount++;
                }

                if (migratedCount === rows.length) {
                  console.log(`✅ 成功迁移 ${migratedCount} 条记录`);

                  console.log('\n5. 检查新表结构...');
                  db.all("PRAGMA table_info(funds)", (err, columns) => {
                    if (!err) {
                      console.log('\n📋 新的数据库列:');
                      columns.forEach(col => {
                        console.log(`  - ${col.name} (${col.type})`);
                      });
                    }

                    console.log('\n📊 字段映射总结:');
                    console.log('  ✅ 保留: id, name, strategy, manager, latest_nav_date');
                    console.log('  ✅ 保留: max_drawdown, sharpe_ratio, volatility, standing_assets, status');
                    console.log('  ✅ 保留: establishment_date, created_at, updated_at, source_table');
                    console.log('  ✅ 新增: cost (成本), concentration (集中度)');
                    console.log('  ✅ 新增: weekly_return (本周收益率), daily_return (本日收益率), yearly_return (本年收益率)');
                    console.log('  ✅ 新增: scale (规模)');
                    console.log('  ❌ 删除: cumulative_return (累计收益率)');
                    console.log('  ❌ 删除: annualized_return (年化收益率)');
                    console.log('  ❌ 删除: total_assets (总规模)');
                    console.log('  ❌ 删除: cash_allocation (站岗资金)');

                    backupDb.close();
                    db.close();

                    console.log('\n🎉 数据库结构重建完成!');
                    console.log('\n现在数据库中应该有您要求的字段结构。');
                  }
                });
              });
            });
          });
        });
      });
    });

  } catch (error) {
    console.error('❌ 重建数据库结构失败:', error.message);
    db.close();
  }
}

// 运行重建
rebuildDatabaseStructure();