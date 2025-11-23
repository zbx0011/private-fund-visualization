require('dotenv').config();

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  baseUrl: 'https://open.feishu.cn/open-apis',
  appId: process.env.LARK_APP_ID,
  appSecret: process.env.LARK_APP_SECRET
};

async function getAccessToken() {
  const response = await fetch(`${config.baseUrl}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      app_id: config.appId,
      app_secret: config.appSecret
    })
  });

  const data = await response.json();

  if (data.code === 0) {
    return data.tenant_access_token;
  } else {
    throw new Error(`获取访问令牌失败: ${data.msg}`);
  }
}

async function getRecords(appToken, tableId, accessToken) {
  const records = [];
  let pageToken;

  do {
    const params = new URLSearchParams({
      page_size: '500'
    });

    if (pageToken) {
      params.append('page_token', pageToken);
    }

    const response = await fetch(
      `${config.baseUrl}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (data.code === 0) {
      if (data.data.items) {
        records.push(...data.data.items);
      }
      pageToken = data.data.page_token;
    } else {
      throw new Error(`获取记录失败: ${data.msg}`);
    }
  } while (pageToken);

  return records;
}

async function syncSpecificTable(tableId, tableName, filename) {
  console.log(`=== 同步表格: ${tableName} ===`);

  try {
    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f';

    console.log('🔐 获取访问令牌...');
    const accessToken = await getAccessToken();

    console.log(`📊 获取表格数据: ${tableName}...`);
    const records = await getRecords(appToken, tableId, accessToken);

    const outputData = {
      timestamp: new Date().toISOString(),
      appToken: appToken,
      tableId: tableId,
      tableName: tableName,
      records: records
    };

    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.join(dataDir, filename);
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

    console.log(`✅ 已保存 ${records.length} 条记录到 ${filename}`);
    console.log(`📁 文件路径: ${outputPath}`);

    return records;

  } catch (error) {
    console.error(`❌ 同步表格 ${tableName} 失败:`, error.message);
    return [];
  }
}

async function syncAllTables() {
  // 配置要同步的表格
  const tables = [
    { name: '私募取数表', tableId: 'tblcXqDbfgA0x533', filename: 'lark-fetch-data.json' },
    { name: '私募盈亏一览表', tableId: 'tblcK2mWFtgob3Dg', filename: 'lark-profit-data.json' },
    { name: '私募其他字段原始数据', tableId: 'tblS9iESdy9PTdJj', filename: 'lark-other-data.json' },
    { name: '第一创业FOF', tableId: 'tblXwpq4lQzfymME', filename: 'lark-fof-data.json' }
  ];

  console.log('🚀 开始同步多个表格数据...\n');

  for (const table of tables) {
    await syncSpecificTable(table.tableId, table.name, table.filename);
    // 添加延迟避免API限制
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 所有表格同步完成！');
  console.log('💡 现在可以运行: node scripts/multi-table-sync.js 来合并数据');
}

// 运行同步
syncAllTables();