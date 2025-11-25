require('dotenv').config();

const { DataConverter } = require('./src/lib/data-converter.js');
const { getDatabase } = require('./src/lib/database-server.js');
const fs = require('fs');
const path = require('path');

async function debugFullSync() {
  console.log('=== 调试完整同步过程 ===\n');

  try {
    // 1. 加载飞书数据
    console.log('1. 加载飞书数据...');
    const larkDataPath = path.join(process.cwd(), 'data', 'lark-data.json');
    const larkData = JSON.parse(fs.readFileSync(larkDataPath, 'utf8'));
    console.log(`   获取到 ${larkData.records.length} 条记录`);

    // 2. 获取字段映射
    console.log('\n2. 分析字段映射...');
    const fieldMapping = DataConverter.analyzeFields(larkData.records);
    console.log('   字段映射:', fieldMapping);

    // 3. 创建选项映射
    console.log('\n3. 创建选项映射...');
    const optionMappings = await DataConverter.createOptionMapping(larkData.appToken, larkData.tableId);
    console.log('   选项映射数量:', Object.keys(optionMappings).length);

    // 4. 转换数据
    console.log('\n4. 转换数据...');
    const fundData = await DataConverter.convertBitableToFundDataWithOptions(
      larkData.records,
      larkData.appToken,
      larkData.tableId
    );

    console.log(`   转换了 ${fundData.length} 条基金数据`);

    // 5. 检查第一条记录的详细信息
    if (fundData.length > 0) {
      console.log('\n5. 第一条记录详细信息:');
      const firstFund = fundData[0];
      console.log('   - 基金名称:', firstFund.name);
      console.log('   - 投资经理:', firstFund.manager);
      console.log('   - 本周收益率:', firstFund.weeklyReturn);
      console.log('   - 日收益率:', firstFund.dailyReturn);
      console.log('   - 本年收益率:', firstFund.annualizedReturn);
      console.log('   - 成本:', firstFund.cost);

      // 检查对应的原始数据
      const firstRecord = larkData.records[0];
      console.log('\n   原始数据字段:');
      Object.keys(firstRecord.fields).forEach(key => {
        console.log(`   - ${key}:`, JSON.stringify(firstRecord.fields[key]));
      });
    }

    // 6. 检查有多少记录有财务数据
    console.log('\n6. 财务数据统计:');
    const withWeeklyReturn = fundData.filter(f => f.weeklyReturn !== undefined && f.weeklyReturn !== 0).length;
    const withDailyReturn = fundData.filter(f => f.dailyReturn !== undefined && f.dailyReturn !== 0).length;
    const withAnnualReturn = fundData.filter(f => f.annualizedReturn !== undefined && f.annualizedReturn !== 0).length;

    console.log(`   - 有本周收益率: ${withWeeklyReturn}/${fundData.length} 条`);
    console.log(`   - 有日收益率: ${withDailyReturn}/${fundData.length} 条`);
    console.log(`   - 有年化收益率: ${withAnnualReturn}/${fundData.length} 条`);

    // 7. 模拟保存到数据库
    console.log('\n7. 检查数据库保存...');
    const db = getDatabase();

    // 查找第一条记录是否存在于数据库
    if (fundData.length > 0) {
      const firstFund = fundData[0];
      console.log(`   查找基金: ${firstFund.name}`);

      const existingFund = await new Promise((resolve, reject) => {
        const dbInstance = db.db;
        dbInstance.get(
          'SELECT * FROM funds WHERE name = ? AND (manager = ? OR manager IS NULL) LIMIT 1',
          [firstFund.name, firstFund.manager || ''],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingFund) {
        console.log('   数据库中的记录:');
        console.log(`   - ID: ${existingFund.id}`);
        console.log(`   - 投资经理: ${existingFund.manager}`);
        console.log(`   - 本周收益率: ${existingFund.weekly_return}`);
        console.log(`   - 日收益率: ${existingFund.daily_return}`);
        console.log(`   - 本年收益率: ${existingFund.annualized_return}`);
        console.log(`   - 成本: ${existingFund.cost}`);

        // 检查数据是否一致
        console.log('\n   数据一致性检查:');
        console.log(`   - 投资经理一致: ${firstFund.manager === existingFund.manager ? '✅' : '❌'}`);
        console.log(`   - 本周收益率一致: ${firstFund.weeklyReturn === existingFund.weekly_return ? '✅' : '❌'}`);
        console.log(`   - 日收益率一致: ${firstFund.dailyReturn === existingFund.daily_return ? '✅' : '❌'}`);
        console.log(`   - 本年收益率一致: ${firstFund.annualizedReturn === existingFund.annualized_return ? '✅' : '❌'}`);
      } else {
        console.log('   ⚠️  数据库中未找到该记录');
      }
    }

    console.log('\n✅ 调试完成');

  } catch (error) {
    console.error('❌ 调试失败:', error);
  }
}

// 运行调试
debugFullSync();