const fs = require('fs');

function checkNewStatus() {
  console.log('🔍 检查新同步数据中的状态字段...\n');

  try {
    const data = JSON.parse(fs.readFileSync('data/lark-profit-data.json', 'utf8'));

    let statusCounts = {};
    let fundsWithStatus = [];

    data.records.forEach((record, index) => {
      const fundName = record.fields['基金名称'] || record.fields['产品名称'] || '未知基金';
      const statusField = record.fields['状态'];

      if (statusField === null || statusField === undefined || statusField === '') {
        statusCounts['null/空'] = (statusCounts['null/空'] || 0) + 1;
      } else {
        const statusText = JSON.stringify(statusField);
        fundsWithStatus.push({ name: fundName, status: statusText, index: index + 1 });

        if (statusText.includes('已赎回') || statusText.includes('赎回')) {
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
      fundsWithStatus.forEach(fund => {
        console.log(`  ${fund.index}. ${fund.name} - 状态: ${fund.status}`);
      });
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkNewStatus();