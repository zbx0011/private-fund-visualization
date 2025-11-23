require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function fixDatabaseStructure() {
  console.log('🔄 修复数据库结构...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 备份现有数据...');
    db.all('SELECT * FROM funds', (err, rows) => {
      if (err) {
        console.error('❌ 备份失败:', err.message);
        db.close();
        return;
      }

      console.log(`   备份了 ${rows.length} 条记录`);

      console.log('\n2. 删除旧表...');
      db.run('DROP TABLE IF EXISTS funds', function(err) {
        if (err) {
          console.error('❌ 删除旧表失败:', err.message);
          db.close();
          return;
        }

        console.log('✅ 删除旧表成功');

        console.log('\n3. 创建新表结构...');
        const createTableSQL = `
          CREATE TABLE funds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id TEXT UNIQUE,
            name TEXT NOT NULL,
            strategy TEXT,
            manager TEXT,
            latest_nav_date TEXT,

            -- 需要的字段
            weekly_return REAL DEFAULT 0,
            daily_return REAL DEFAULT 0,
            yearly_return REAL DEFAULT 0,
            concentration REAL DEFAULT 0,
            cost REAL DEFAULT 0,
            status TEXT DEFAULT '正常',

            -- 需要计算的字段
            max_drawdown REAL DEFAULT 0,
            sharpe_ratio REAL DEFAULT 0,
            volatility REAL DEFAULT 0,

            -- 保留的字段
            establishment_date TEXT,
            scale REAL DEFAULT 0,
            source_table TEXT DEFAULT 'main',

            -- 时间戳
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        db.run(createTableSQL, function(err) {
          if (err) {
            console.error('❌ 创建新表失败:', err.message);
            db.close();
            return;
          }

          console.log('✅ 创建新表成功');

          console.log('\n4. 恢复数据...');
          let insertedCount = 0;

          rows.forEach((row, index) => {
            // 转换数据到新结构
            const newData = {
              record_id: row.record_id || row.id,
              name: row.name,
              strategy: row.strategy,
              manager: row.manager,
              latest_nav_date: row.latest_nav_date,
              weekly_return: row.weekly_return || 0,
              daily_return: row.daily_return || 0,
              yearly_return: row.annualized_return || row.yearly_return || 0, // 优先使用yearly_return
              concentration: row.concentration || 0,
              cost: row.cost || row.cash_allocation || 0, // 如果没有cost，使用cash_allocation
              status: row.status || '正常',
              max_drawdown: row.max_drawdown || 0,
              sharpe_ratio: row.sharpe_ratio || 0,
              volatility: row.volatility || 0,
              establishment_date: row.establishment_date,
              scale: row.scale || 0,
              source_table: row.source_table || 'main'
            };

            const stmt = db.prepare(`
              INSERT INTO funds (
                record_id, name, strategy, manager, latest_nav_date,
                weekly_return, daily_return, yearly_return,
                concentration, cost, status,
                max_drawdown, sharpe_ratio, volatility,
                establishment_date, scale, source_table
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run([
              newData.record_id, newData.name, newData.strategy, newData.manager, newData.latest_nav_date,
              newData.weekly_return, newData.daily_return, newData.yearly_return,
              newData.concentration, newData.cost, newData.status,
              newData.max_drawdown, newData.sharpe_ratio, newData.volatility,
              newData.establishment_date, newData.scale, newData.source_table
            ], (err) => {
              if (!err) {
                insertedCount++;
              }
            });

            stmt.finalize();
          });

          // 等待插入完成
          setTimeout(() => {
            console.log(`   恢复了 ${insertedCount} 条记录`);

            console.log('\n5. 验证新表结构...');
            db.all("PRAGMA table_info(funds)", (err, columns) => {
              if (err) {
                console.error('❌ 验证失败:', err.message);
                db.close();
                return;
              }

              const columnNames = columns.map(col => col.name);
              console.log('   新表列:', columnNames);

              // 检查是否还有不需要的列
              const unwantedColumns = ['cumulative_return', 'annualized_return', 'total_assets', 'cash_allocation'];
              const foundUnwanted = unwantedColumns.filter(col => columnNames.includes(col));

              if (foundUnwanted.length === 0) {
                console.log('✅ 已成功移除所有不需要的列');
              } else {
                console.log('❌ 仍存在不需要的列:', foundUnwanted);
              }

              // 检查需要的列是否存在
              const requiredColumns = ['weekly_return', 'daily_return', 'yearly_return', 'concentration', 'cost'];
              const missingRequired = requiredColumns.filter(col => !columnNames.includes(col));

              if (missingRequired.length === 0) {
                console.log('✅ 所有需要的列都已添加');
              } else {
                console.log('❌ 缺少需要的列:', missingRequired);
              }

              console.log('\n✅ 数据库结构修复完成!');
              db.close();
            });
          }, 2000);
        });
      });
    });

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    db.close();
  }
}

// 运行修复
fixDatabaseStructure();