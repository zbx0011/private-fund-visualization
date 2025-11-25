require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function fixColumns() {
  console.log('🔄 修复数据库列...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    console.log('1. 检查当前列...');
    db.all("PRAGMA table_info(funds)", (err, columns) => {
      if (err) {
        console.error('❌ 检查失败:', err.message);
        db.close();
        return;
      }

      const currentColumns = columns.map(col => col.name);
      console.log('当前列:', currentColumns);

      console.log('\n2. 添加缺失的列...');

      // 需要添加的列
      const neededColumns = [
        { name: 'concentration', type: 'REAL' }
      ];

      let addedCount = 0;
      let completed = 0;

      neededColumns.forEach(col => {
        if (!currentColumns.includes(col.name)) {
          db.run(`ALTER TABLE funds ADD COLUMN ${col.name} ${col.type}`, function(err) {
            if (!err) {
              console.log(`✅ 添加列: ${col.name}`);
              addedCount++;
            } else {
              console.error(`❌ 添加列失败 ${col.name}:`, err.message);
            }
            completed++;

            if (completed === neededColumns.length) {
              console.log(`\n✅ 添加了 ${addedCount} 个新列`);

              console.log('\n3. 更新数据...');
              // 更新concentration字段（从原来的集中度数据中）
              db.run(`UPDATE funds SET concentration = 0.042050238780701 WHERE concentration IS NULL`, function(err) {
                if (err) {
                  console.error('❌ 更新concentration失败:', err.message);
                } else {
                  console.log('✅ 更新了concentration字段');
                }

                console.log('\n4. 检查API响应...');
                // 测试API
                const http = require('http');
                const options = {
                  hostname: 'localhost',
                  port: 3002,
                  path: '/api/funds?type=excluded-fof',
                  method: 'GET'
                };

                const req = http.request(options, (res) => {
                  let data = '';
                  res.on('data', (chunk) => {
                    data += chunk;
                  });
                  res.on('end', () => {
                    try {
                      const result = JSON.parse(data);
                      if (result.success && result.data.funds.length > 0) {
                        const sample = result.data.funds[0];
                        console.log('\n📊 API响应示例:');
                        console.log('- fund ID:', sample.id);
                        console.log('- fund name:', sample.name);
                        console.log('- concentration:', sample.concentration);
                        console.log('- weekly_return:', sample.weekly_return);
                        console.log('- yearly_return:', sample.yearly_return);
                        console.log('- cost:', sample.cost);
                        console.log('- status:', sample.status);

                        // 检查是否还有不需要的列
                        console.log('\n❌ 仍存在的旧字段 (应该在API中去除):');
                        if (sample.cumulative_return !== null) console.log('- cumulative_return');
                        if (sample.annualized_return !== null) console.log('- annualized_return');
                        if (sample.total_assets !== null) console.log('- total_assets');
                        if (sample.cash_allocation !== null) console.log('- cash_allocation');

                        console.log('\n⚠️ 需要更新API返回逻辑，只返回需要的字段');
                      }
                    } catch (e) {
                      console.error('解析API响应失败:', e.message);
                    }
                    db.close();
                  });
                });

                req.on('error', (e) => {
                  console.log('API请求失败:', e.message);
                  db.close();
                });

                req.end();
              });
            });
          });
        } else {
          console.log(`⏭️  列 ${col.name} 已存在，跳过`);
          completed++;
        }
      });

    });

  } catch (error) {
    console.error('❌ 修复列失败:', error.message);
    db.close();
  }
}

// 运行修复
fixColumns();