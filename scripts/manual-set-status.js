require('dotenv').config();

const sqlite3 = require('sqlite3').verbose();
const { join } = require('path');

function manualSetStatus() {
  console.log('🔧 手动设置基金状态...\n');

  const dbPath = join(process.cwd(), 'data', 'funds.db');
  const db = new sqlite3.Database(dbPath);

  // 根据状态ID optFl1SLci 来设置状态
  // 目前这个ID的含义不明，我们暂时设为"正常"，但可以手动覆盖

  const statusMapping = {
    'optFl1SLci': '正常'  // 您可以修改这个映射
  };

  // 或者您可以指定特定的基金设为"已赎回"
  const manualRedeemedFunds = [
    // 示例：远澜翠柏1号, 德贝尊享CTA8号 等
    // 您可以在这里添加应该设为"已赎回"的基金名称
    // '远澜翠柏1号',
    // '德贝尊享CTA8号'
  ];

  console.log('📋 更新基于状态ID的状态...');

  // 先更新状态ID映射
  db.all('SELECT name, record_id FROM funds', (err, allFunds) => {
    if (err) {
      console.error('❌ 获取基金列表失败:', err.message);
      db.close();
      return;
    }

    console.log(`📊 处理 ${allFunds.length} 只基金的状态`);

    let updatedCount = 0;
    const stmt = db.prepare('UPDATE funds SET status = ? WHERE record_id = ?');

    // 从原始数据文件中读取状态信息
    const fs = require('fs');
    const dataPath = join(process.cwd(), 'data', 'lark-data.json');

    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const larkData = JSON.parse(rawData);

      allFunds.forEach((fund) => {
        const record = larkData.records.find(r => {
          const fundName = r.fields['基金名称'] || r.fields['产品名称'] || '';
          return fundName === fund.name;
        });

        let status = '正常'; // 默认状态

        if (record && record.fields['状态']) {
          const statusField = record.fields['状态'];

          // 检查是否是状态ID
          if (Array.isArray(statusField) && statusField.length > 0 && typeof statusField[0] === 'string') {
            const statusId = statusField[0];
            status = statusMapping[statusId] || '正常';
          } else if (statusField === null || statusField === undefined || statusField === '') {
            status = '正常';
          } else {
            // 其他情况，检查是否包含"已赎回"
            const statusText = String(statusField).toLowerCase();
            if (statusText.includes('已赎回') || statusText.includes('赎回')) {
              status = '已赎回';
            } else {
              status = '正常';
            }
          }
        }

        // 手动覆盖指定的基金
        if (manualRedeemedFunds.includes(fund.name)) {
          status = '已赎回';
        }

        stmt.run([status, fund.record_id], (err) => {
          if (err) {
            console.error(`❌ 更新基金 ${fund.name} 失败:`, err.message);
          } else {
            updatedCount++;

            // 只显示有状态变化的基金
            if (status !== '正常') {
              console.log(`✅ ${fund.name}: 状态 = ${status}`);
            }
          }
        });
      });
    }

    setTimeout(() => {
      stmt.finalize();

      // 验证结果
      db.all('SELECT name, status FROM funds WHERE status != "正常"', (err, redeemedFunds) => {
        if (err) {
          console.error('❌ 验证失败:', err.message);
        } else {
          console.log(`\n📊 状态更新完成！`);
          console.log(`✅ 更新了 ${updatedCount} 条基金记录`);
          console.log(`🔴 已赎回基金: ${redeemedFunds.length} 只`);

          if (redeemedFunds.length > 0) {
            console.log('\n🔴 已赎回基金列表:');
            redeemedFunds.forEach((fund, index) => {
              console.log(`  ${index + 1}. ${fund.name} - 状态: ${fund.status}`);
            });
          }
        }

        db.close();
      });
    }, 1000);
  });
}

manualSetStatus();