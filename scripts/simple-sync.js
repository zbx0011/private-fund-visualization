require('dotenv').config();

const fs = require('fs');
const path = require('path');

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

    const url = `${config.baseUrl}/bitable/v1/apps/${appToken}/tables/${tableId}/records?${params}`;
    console.log(`📡 请求: ${url}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.code === 0) {
      if (data.data.items) {
        records.push(...data.data.items);
        console.log(`✅ 获取 ${data.data.items.length} 条记录`);
      }
      pageToken = data.data.page_token;
    } else {
      throw new Error(`获取记录失败: ${data.msg}`);
    }
  } while (pageToken);

  return records;
}

async function syncTable(tableName, tableId, filename) {
  console.log(`\n🚀 同步表格: ${tableName}`);

  try {
    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f';

    console.log('🔐 获取访问令牌...');
    const accessToken = await getAccessToken();
    console.log('✅ 访问令牌获取成功');

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

    // 先写入到一个临时文件，确保JSON是有效的
    const tempPath = outputPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(outputData, null, 2));

    // 验证临时文件是否可以读取
    const testRead = fs.readFileSync(tempPath, 'utf8');
    JSON.parse(testRead); // 验证JSON是否有效

    // 重命名为最终文件
    fs.renameSync(tempPath, outputPath);

    console.log(`✅ 已保存 ${records.length} 条记录到 ${filename}`);
    console.log(`📁 文件路径: ${outputPath}`);

    return records;

  } catch (error) {
    console.error(`❌ 同步表格 ${tableName} 失败:`, error.message);
    console.error('错误详情:', error.stack);
    return [];
  }
}

async function main() {
  const tables = [
    { name: '私募盈亏一览表', tableId: 'tblcK2mWFtgob3Dg', filename: 'lark-profit-data.json' }
  ];

  console.log('🚀 开始同步私募盈亏一览表数据...\n');

  for (const table of tables) {
    await syncTable(table.name, table.tableId, table.filename);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🎉 同步完成！');
}

main().catch(console.error);