const { DataConverter } = require('./src/lib/data-converter.ts');
require('dotenv').config();

// 测试数据（从lark-data.json中复制）
const testRecord = {
  record_id: "test123",
  fields: {
    "基金名称": "世纪前沿量化优选18号",
    "策略类型": ["opteZ8clPp"], // 这应该被转换为可读名称
    "投资经理": "彭思宇"
  }
};

async function testOptionMapping() {
  try {
    console.log('测试选项映射...');

    // 模拟创建选项映射
    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f';
    const tableId = 'tblcK2mWFtgob3Dg';

    // 测试字段映射
    const mapping = DataConverter.analyzeFields([testRecord]);
    console.log('字段映射:', mapping);

    // 获取策略类型字段值
    const fieldValue = DataConverter.getFieldValue(testRecord.fields, 'strategy', mapping);
    console.log('策略字段原始值:', fieldValue);

  } catch (error) {
    console.error('测试失败:', error);
  }
}

testOptionMapping();