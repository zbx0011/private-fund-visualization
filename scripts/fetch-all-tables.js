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
  const response = await fetch(`${config.baseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
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

async function getTables(appToken, accessToken) {
  const response = await fetch(`${config.baseUrl}/open-apis/bitable/v1/apps/${appToken}/tables`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();

  if (data.code === 0) {
    return data.data.items || [];
  } else {
    throw new Error(`获取表格列表失败: ${data.msg}`);
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

async function fetchAllTables() {
  console.log('=== 获取所有表格数据 ===');

  try {
    // 验证配置
    if (!config.appId || !config.appSecret) {
      throw new Error('未配置 LARK_APP_ID 或 LARK_APP_SECRET');
    }

    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f'; // 您提供的App Token

    console.log('🔐 获取访问令牌...');
    const accessToken = await getAccessToken();

    console.log('📊 获取表格信息...');
    const tables = await getTables(appToken, accessToken);

    console.log(`📋 找到 ${tables.length} 个表格:`);
    tables.forEach(table => {
      console.log(`  - ${table.name} (${table.table_id})`);
    });

    // 目标表格配置
    const targetTables = [
      { name: '私募盈亏一览表', tableId: 'tblcK2mWFtgob3Dg', filename: 'lark-profit-data.json' },
      { name: '私募取数表', tableId: 'tblcXqDbfgA0x533', filename: 'lark-fetch-data.json' },
      { name: '私募其他字段原始数据', tableId: 'tblS9iESdy9PTdJj', filename: 'lark-other-data.json' },
      { name: '第一创业FOF', tableId: 'tblXwpq4lQzfymME', filename: 'lark-fof-data.json' }
    ];

    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    for (const targetTable of targetTables) {
      console.log(`\n📥 获取表格: ${targetTable.name}...`);

      try {
        const records = await getRecords(appToken, targetTable.tableId, accessToken);

        const outputData = {
          timestamp: new Date().toISOString(),
          appToken: appToken,
          tableId: targetTable.tableId,
          tableName: targetTable.name,
          records: records
        };

        const outputPath = path.join(dataDir, targetTable.filename);
        fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));

        console.log(`✅ 已保存 ${records.length} 条记录到 ${targetTable.filename}`);

      } catch (error) {
        console.error(`❌ 获取表格 ${targetTable.name} 失败:`, error.message);
      }
    }

    console.log('\n🎉 所有表格数据获取完成！');

  } catch (error) {
    console.error('💥 获取数据失败:', error.message);
  }
}

// 运行获取所有表格数据
fetchAllTables();