require('dotenv').config();

const fs = require('fs');
const path = require('path');

function checkStatusData() {
  console.log('🔍 检查飞书数据中的状态字段...\n');

  try {
    const dataPath = path.join(process.cwd(), 'data', 'lark-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ 未找到数据文件');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);

    console.log(`📊 总共检查 ${larkData.records.length} 条记录\n`);

    // 检查所有状态字段
    const statusCounts = {};
    const fundsWithStatus = [];
    const fundsWithNullStatus = [];

    larkData.records.forEach((record, index) => {
      const fundName = record.fields['基金名称'] || record.fields['产品名称'] || '未知基金';
      const statusField = record.fields['状态'];

      if (statusField === null || statusField === undefined || statusField === '') {
        fundsWithNullStatus.push({ name: fundName, index: index + 1 });
        statusCounts['null/空'] = (statusCounts['null/空'] || 0) + 1;
      } else {
        const statusText = JSON.stringify(statusField);
        fundsWithStatus.push({
          name: fundName,
          status: statusText,
          index: index + 1
        });

        // 检查是否包含"已赎回"
        const statusLower = statusText.toLowerCase();
        if (statusLower.includes('已赎回') || statusLower.includes('赎回')) {
          statusCounts['已赎回'] = (statusCounts['已赎回'] || 0) + 1;
        } else {
          statusCounts['其他'] = (statusCounts['其他'] || 0) + 1;
        }
      }
    });

    console.log('📈 状态统计:');
    Object.keys(statusCounts).forEach(status => {
      console.log(`  ${status}: ${statusCounts[status]} 只基金`);
    });

    if (fundsWithStatus.length > 0) {
      console.log('\n✅ 有状态数据的基金:');
      fundsWithStatus.slice(0, 10).forEach(fund => {
        console.log(`  ${fund.index}. ${fund.name} - 状态: ${fund.status}`);
      });

      if (fundsWithStatus.length > 10) {
        console.log(`  ... 还有 ${fundsWithStatus.length - 10} 只基金有状态数据`);
      }
    }

    if (fundsWithNullStatus.length > 0) {
      console.log(`\n⚠️  有 ${fundsWithNullStatus.length} 只基金状态为空:`);
      fundsWithNullStatus.slice(0, 10).forEach(fund => {
        console.log(`  ${fund.index}. ${fund.name}`);
      });

      if (fundsWithNullStatus.length > 10) {
        console.log(`  ... 还有 ${fundsWithNullStatus.length - 10} 只基金状态为空`);
      }
    }

    // 数据来源信息
    console.log('\n📋 数据来源信息:');
    console.log(`  时间戳: ${larkData.timestamp}`);
    console.log(`  应用Token: ${larkData.appToken}`);
    console.log(`  表格ID: ${larkData.tableId}`);

    // 检查是否有其他字段可以判断状态
    console.log('\n🔍 检查可能的替代状态字段...');
    const firstRecord = larkData.records[0];
    if (firstRecord) {
      console.log('第一条记录的所有字段:');
      Object.keys(firstRecord.fields).forEach(key => {
        const value = firstRecord.fields[key];
        const valueType = Array.isArray(value) ? `array[${value.length}]` : typeof value;
        console.log(`  ${key}: ${valueType}`);
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkStatusData();