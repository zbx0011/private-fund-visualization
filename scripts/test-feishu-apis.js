require('dotenv').config();

async function testFeishuApis() {
  console.log('🔍 测试飞书API端点...\n');

  const config = {
    baseUrl: 'https://open.feishu.cn/open-apis',
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET
  };

  console.log(`📋 App ID: ${config.appId}`);
  console.log(`📋 App Secret: ${config.appSecret ? '已设置' : '未设置'}\n`);

  // 尝试不同的API端点
  const apiEndpoints = [
    '/open-apis/auth/v3/tenant_access_token/internal',
    '/open-apis/auth/v3/app_access_token/internal',
    '/auth/v3/tenant_access_token/internal',
    '/auth/v3/app_access_token/internal'
  ];

  for (const endpoint of apiEndpoints) {
    console.log(`🔐 尝试端点: ${config.baseUrl}${endpoint}`);

    try {
      const response = await fetch(`${config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_id: config.appId,
          app_secret: config.appSecret
        })
      });

      console.log(`   状态码: ${response.status}`);

      if (response.ok) {
        const text = await response.text();
        console.log(`   响应: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);

        try {
          const data = JSON.parse(text);
          if (data.code === 0) {
            console.log(`   ✅ 成功! 获取到令牌: ${data.tenant_access_token || data.app_access_token}`);

            // 如果成功，测试获取数据
            const accessToken = data.tenant_access_token || data.app_access_token;
            await testTableData(accessToken);
            return;
          } else {
            console.log(`   ❌ API返回错误: ${data.msg}`);
          }
        } catch (parseError) {
          console.log(`   ❌ JSON解析失败: ${parseError.message}`);
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ HTTP错误 ${response.status}: ${text}`);
      }
    } catch (error) {
      console.log(`   ❌ 网络错误: ${error.message}`);
    }

    console.log('');
  }

  console.log('❌ 所有端点都失败了');
}

async function testTableData(accessToken) {
  console.log('\n📊 测试获取表格数据...');

  const appToken = process.env.LARK_APP_TOKEN || 'MKTubHkUKa13gbs9WdNcQNvsn3f';
  const tableId = 'tblcK2mWFtgob3Dg';

  // 尝试不同的数据API端点
  const dataEndpoints = [
    `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`,
    `/bitable/v1/apps/${appToken}/tables/${tableId}/records`
  ];

  for (const endpoint of dataEndpoints) {
    console.log(`📊 尝试数据端点: ${endpoint}`);

    try {
      const response = await fetch(`https://open.feishu.cn${endpoint}?page_size=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(`   状态码: ${response.status}`);

      if (response.ok) {
        const text = await response.text();
        console.log(`   响应: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);

        try {
          const data = JSON.parse(text);
          if (data.code === 0) {
            console.log(`   ✅ 成功获取数据! 总记录数: ${data.data.total || '未知'}`);
            return;
          } else {
            console.log(`   ❌ 数据API返回错误: ${data.msg}`);
          }
        } catch (parseError) {
          console.log(`   ❌ 数据JSON解析失败: ${parseError.message}`);
        }
      } else {
        const text = await response.text();
        console.log(`   ❌ 数据HTTP错误 ${response.status}: ${text}`);
      }
    } catch (error) {
      console.log(`   ❌ 数据网络错误: ${error.message}`);
    }

    console.log('');
  }
}

testFeishuApis();