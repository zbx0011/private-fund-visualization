require('dotenv').config();

const fs = require('fs');
const path = require('path');

// 简化的数据转换函数
function extractTextValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }

    const firstItem = value[0];
    if (firstItem && typeof firstItem === 'object' && firstItem.text) {
      return firstItem.text;
    }

    if (typeof firstItem === 'string') {
      return firstItem;
    }

    return String(firstItem);
  }

  if (typeof value === 'object') {
    if (value.text) {
      return value.text;
    }
  }

  return String(value);
}

function decodeStatusOptions() {
  console.log('🔍 解码状态选项ID...\n');

  try {
    const dataPath = path.join(process.cwd(), 'data', 'lark-data.json');

    if (!fs.existsSync(dataPath)) {
      console.error('❌ 未找到数据文件');
      return;
    }

    const rawData = fs.readFileSync(dataPath, 'utf8');
    const larkData = JSON.parse(rawData);

    console.log(`📊 分析 ${larkData.records.length} 条记录的状态字段\n`);

    // 收集所有唯一的状态ID
    const statusIds = new Set();
    const statusExamples = {};

    larkData.records.forEach((record, index) => {
      const fundName = record.fields['基金名称'] || record.fields['产品名称'] || '未知基金';
      const statusField = record.fields['状态'];

      if (statusField !== null && statusField !== undefined && statusField !== '') {
        const extractedText = extractTextValue(statusField);

        if (extractedText) {
          statusIds.add(extractedText);
          if (!statusExamples[extractedText]) {
            statusExamples[extractedText] = [];
          }
          statusExamples[extractedText].push(fundName);
        }

        // 如果是数组格式，也记录原始格式
        if (Array.isArray(statusField)) {
          statusField.forEach(item => {
            if (typeof item === 'string') {
              statusIds.add(item);
              if (!statusExamples[item]) {
                statusExamples[item] = [];
              }
              statusExamples[item].push(fundName);
            }
          });
        }
      }
    });

    console.log('🏷️  发现的状态ID:');
    Array.from(statusIds).forEach(id => {
      const examples = statusExamples[id] || [];
      console.log(`  ID: ${id}`);
      console.log(`  示例基金: ${examples.slice(0, 3).join(', ')}${examples.length > 3 ? '...' : ''}`);
      console.log('');
    });

    // 尝试从不同的记录中查找状态字段的完整结构
    console.log('🔍 查找状态字段的完整结构...');
    let foundDetailedStatus = false;

    for (let i = 0; i < Math.min(10, larkData.records.length); i++) {
      const record = larkData.records[i];
      const statusField = record.fields['状态'];

      if (statusField !== null && statusField !== undefined && typeof statusField === 'object') {
        console.log(`\n📋 记录 ${i + 1} (${record.fields['基金名称']}) 的状态字段结构:`);
        console.log(JSON.stringify(statusField, null, 2));
        foundDetailedStatus = true;
        break;
      }
    }

    if (!foundDetailedStatus) {
      console.log('\n⚠️  未找到详细的状态字段结构，可能需要从飞书API获取选项映射');
    }

  } catch (error) {
    console.error('❌ 解码失败:', error.message);
  }
}

decodeStatusOptions();