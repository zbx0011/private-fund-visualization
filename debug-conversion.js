const data = require('./data/lark-data.json');

// 简单的数据转换测试
function extractTextValue(value) {
  if (value === null || value === undefined) {
    return '未知'
  }

  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '未知'
    }

    // 如果数组中的元素是对象且有text属性
    const firstItem = value[0]
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return firstItem.text
    }

    // 如果数组中的元素是字符串
    if (typeof firstItem === 'string') {
      return firstItem
    }

    // 默认返回对象的字符串表示
    return String(firstItem)
  }

  if (typeof value === 'object') {
    // 如果是对象且有text属性
    if (value.text) {
      return value.text
    }
  }

  return String(value)
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0
  }

  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    // 移除百分号并转换
    const cleanValue = value.toString().replace(/[%,¥]/g, '').trim()
    const parsed = parseFloat(cleanValue)
    return isNaN(parsed) ? 0 : parsed
  }

  if (Array.isArray(value) && value.length > 0) {
    // 如果是数组，取第一个元素
    return parseNumber(value[0])
  }

  return 0
}

console.log('=== 调试数据转换 ===');

const record = data.records[0];
const fields = record.fields;

console.log('\n原始数据:');
console.log('投资经理:', JSON.stringify(fields['投资经理']));
console.log('本周收益率:', JSON.stringify(fields['本周收益率']));
console.log('本年收益率:', JSON.stringify(fields['本年收益率']));
console.log('本日盈亏:', JSON.stringify(fields['本日盈亏']));
console.log('日均资金占用:', JSON.stringify(fields['日均资金占用']));

console.log('\n处理结果:');
console.log('投资经理处理后:', extractTextValue(fields['投资经理']));
console.log('本周收益率处理后:', parseNumber(fields['本周收益率']));
console.log('本年收益率处理后:', parseNumber(fields['本年收益率']));
console.log('本日盈亏处理后:', parseNumber(fields['本日盈亏']));
console.log('日均资金占用处理后:', parseNumber(fields['日均资金占用']));