require('dotenv').config();

const https = require('https');
const querystring = require('querystring');

// 使用与 sync-cli 相同的实现
async function getAccessToken() {
  const data = querystring.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.LARK_APP_ID,
    client_secret: process.env.LARK_APP_SECRET
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: '/open-apis/auth/v3/tenant_access_token/internal',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code !== 0) {
            reject(new Error(`获取访问令牌失败: ${result.msg} (${result.code})`));
            return;
          }
          resolve(result.tenant_access_token);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function makeRequest(path, accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'open.feishu.cn',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          if (result.code !== 0) {
            reject(new Error(`API请求失败: ${result.msg} (${result.code})`));
            return;
          }
          resolve(result.data);
        } catch (error) {
          reject(new Error(`解析响应失败: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function debugLookupField() {
  try {
    console.log('=== 调试查找字段 ===');

    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f';
    const tableId = 'tblcK2mWFtgob3Dg';

    console.log('🔐 获取访问令牌...');
    const accessToken = await getAccessToken();

    console.log('📊 获取字段信息...');
    const fields = await makeRequest(`/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, accessToken);

    console.log(`获取到 ${fields.items.length} 个字段`);

    // 查找策略类型字段
    const strategyField = fields.items.find(field => field.field_name === '策略类型');
    console.log('\n🔍 策略类型字段:');
    console.log(JSON.stringify(strategyField, null, 2));

    if (strategyField && strategyField.ui_type === 'Lookup') {
      console.log('\n✅ 确认是查找字段');
      console.log('目标表格:', strategyField.property.target_table);
      console.log('目标字段:', strategyField.property.target_field);

      console.log('\n📊 获取目标表格字段...');
      const targetFields = await makeRequest(
        `/open-apis/bitable/v1/apps/${appToken}/tables/${strategyField.property.target_table}/fields`,
        accessToken
      );

      console.log(`目标表格 ${strategyField.property.target_table} 的字段数量:`, targetFields.items.length);

      let foundTargetField = false;
      for (const targetField of targetFields.items) {
        console.log(`目标字段: ${targetField.field_name}, ID: ${targetField.field_id}`);

        if (targetField.field_id === strategyField.property.target_field) {
          console.log('\n✅ 找到匹配的目标字段:', targetField.field_name);
          console.log('字段类型:', targetField.type);
          console.log('UI类型:', targetField.ui_type);

          if (targetField.property && targetField.property.options) {
            console.log('\n✅ 找到选项配置:');
            console.log(JSON.stringify(targetField.property.options, null, 2));

            // 手动创建选项映射
            const mapping = {};
            for (const option of targetField.property.options) {
              mapping[option.name] = option.name;
              if (option.option_id) {
                mapping[option.option_id] = option.name;
                console.log(`映射选项: ${option.option_id} -> ${option.name}`);
              }
              if (option.id) {
                mapping[option.id] = option.name;
              }
            }

            console.log('\n完整映射:', mapping);

            // 测试转换
            const testOptionId = 'opteZ8clPp';
            console.log(`\n测试转换 ${testOptionId}:`, mapping[testOptionId] || '未找到');
            foundTargetField = true;
            break;
          } else {
            console.log('❌ 目标字段没有选项配置');
          }
        }
      }

      if (!foundTargetField) {
        console.log('❌ 未找到匹配的目标字段');
      }
    } else {
      console.log('❌ 不是查找字段或字段不存在');
    }

  } catch (error) {
    console.error('调试失败:', error);
  }
}

debugLookupField();