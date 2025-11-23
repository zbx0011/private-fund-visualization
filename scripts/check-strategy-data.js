const fs = require('fs');

function checkStrategyData() {
  console.log('🔍 检查私募盈亏一览表中的策略数据...\n');

  try {
    const data = JSON.parse(fs.readFileSync('data/lark-profit-data.json', 'utf8'));

    // 查找可能包含策略信息的字段
    const allFields = new Set();
    data.records.forEach(record => {
      Object.keys(record.fields).forEach(key => {
        allFields.add(key);
      });
    });

    console.log('📋 所有字段列表:');
    Array.from(allFields).forEach(field => {
      console.log(`  ${field}`);
    });

    console.log('\n🔍 检查是否有策略相关字段...');
    const strategyRelatedFields = Array.from(allFields).filter(field =>
      field.toLowerCase().includes('策略') ||
      field.toLowerCase().includes('strategy') ||
      field.toLowerCase().includes('type')
    );

    console.log('📊 策略相关字段:', strategyRelatedFields);

    if (strategyRelatedFields.length > 0) {
      strategyRelatedFields.forEach(field => {
        console.log(`\n${field} 示例数据:`);
        data.records.slice(0, 3).forEach((record, index) => {
          const value = record.fields[field];
          console.log(`  记录 ${index + 1}: ${JSON.stringify(value)}`);
        });
      });
    }

    // 检查第一条记录的详细内容
    console.log('\n📋 第一条记录详细内容:');
    const firstRecord = data.records[0];
    Object.keys(firstRecord.fields).forEach(key => {
      const value = firstRecord.fields[key];
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkStrategyData();