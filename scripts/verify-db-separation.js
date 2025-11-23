require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function verifyDatabaseSeparation() {
  console.log('🔍 验证数据库数据源分离...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  try {
    // 检查 source_table 列是否存在
    console.log('=== 检查数据库结构 ===');
    db.all("PRAGMA table_info(funds)", (err, columns) => {
      if (err) {
        console.log('❌ 无法检查数据库结构:', err.message);
        return;
      }

      const hasSourceTable = columns.some(col => col.name === 'source_table');
      console.log(`source_table 列: ${hasSourceTable ? '✅ 存在' : '❌ 不存在'}`);

      if (hasSourceTable) {
        // 统计各数据源数量
        console.log('\n=== 数据源统计 ===');
        db.all("SELECT source_table, COUNT(*) as count FROM funds GROUP BY source_table", (err, results) => {
          if (err) {
            console.log('❌ 无法统计数据源:', err.message);
          } else {
            if (results.length === 0) {
              console.log('⚠️  数据库中没有记录');
            } else {
              results.forEach(row => {
                const sourceName = row.source_table === 'main' ? '主数据源 (Direct + Huatah)' :
                                 row.source_table === 'fof' ? 'FOF数据源 (First Capital)' :
                                 row.source_table || '未知数据源';
                console.log(`- ${sourceName}: ${row.count} 条记录`);
              });
            }

            // 检查数据样本
            console.log('\n=== 数据样本检查 ===');
            db.all("SELECT name, strategy, manager, source_table FROM funds LIMIT 5", (err, samples) => {
              if (err) {
                console.log('❌ 无法获取数据样本:', err.message);
              } else {
                samples.forEach((sample, index) => {
                  const sourceName = sample.source_table === 'main' ? '主' :
                                   sample.source_table === 'fof' ? 'FOF' : '?';
                  console.log(`${index + 1}. [${sourceName}] ${sample.name} - ${sample.strategy || '未知策略'}`);
                });
              }

              console.log('\n✅ 数据库验证完成');
              console.log('\n📋 预期结果:');
              console.log('- 主数据源记录应来自 "私募取数表" (tblcXqDbfgA0x533)');
              console.log('- FOF数据源记录应来自 "第一创业FOF" (tblXwpq4lQzfymME)');
              console.log('- API调用 type=excluded-fof 应返回主数据源数据');
              console.log('- API调用 type=fof 应返回FOF数据源数据');
            });
          }
        });
      } else {
        console.log('❌ 需要运行数据同步来创建 source_table 列');
      }
    });

  } catch (error) {
    console.error('❌ 验证失败:', error.message);
  } finally {
    setTimeout(() => {
      db.close();
    }, 2000);
  }
}

// 运行验证
verifyDatabaseSeparation();