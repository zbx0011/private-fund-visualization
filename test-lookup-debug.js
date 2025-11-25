require('dotenv').config();

const https = require('https');
const querystring = require('querystring');

class SimpleLarkAPI {
  constructor(config) {
    this.appId = config.appId;
    this.appSecret = config.appSecret;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpireTime) {
      return this.accessToken;
    }

    const data = querystring.stringify({
      grant_type: 'client_credentials',
      client_id: this.appId,
      client_secret: this.appSecret
    });

    // 直接获取token，不调用makeRequest避免循环
    const result = await new Promise((resolve, reject) => {
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

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.code !== 0) {
              reject(new Error(`API请求失败: ${result.msg} (${result.code})`));
              return;
            }
            resolve(result);
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });

    this.accessToken = result.tenant_access_token;
    this.tokenExpireTime = Date.now() + (result.expire - 60) * 1000; // 提前1分钟过期

    console.log('✅ 获取访问令牌成功');
    return this.accessToken;
  }

  async makeRequest(method, path, data = null, needToken = true) {
    if (needToken && !this.accessToken) {
      await this.getAccessToken();
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'open.feishu.cn',
        port: 443,
        path: path,
        method: method,
        headers: needToken ? {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.code !== 0) {
              reject(new Error(`API请求失败: ${result.msg} (${result.code})`));
              return;
            }
            resolve(result);
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }

  async getBitableFields(appToken, tableId) {
    const result = await this.makeRequest('GET', `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
    return result.data || result;
  }
}

async function debugLookupField() {
  try {
    console.log('开始调试查找字段...');

    const appToken = 'MKTubHkUKa13gbs9WdNcQNvsn3f';
    const tableId = 'tblcK2mWFtgob3Dg';

    // 创建API实例
    const api = new SimpleLarkAPI({
      appId: process.env.LARK_APP_ID,
      appSecret: process.env.LARK_APP_SECRET
    });

    console.log('获取字段信息...');
    const fields = await api.getBitableFields(appToken, tableId);

    // 查找策略类型字段
    const fieldsArray = fields.items || fields;
    const strategyField = fieldsArray.find(field => field.field_name === '策略类型');
    console.log('策略类型字段:', JSON.stringify(strategyField, null, 2));

    if (strategyField && strategyField.ui_type === 'Lookup') {
      console.log('✅ 确认是查找字段');
      console.log('目标表格:', strategyField.property.target_table);
      console.log('目标字段:', strategyField.property.target_field);

      console.log('获取目标表格字段...');
      const targetFields = await api.getBitableFields(appToken, strategyField.property.target_table);

      const targetFieldsArray = targetFields.items || targetFields;
      console.log(`目标表格 ${strategyField.property.target_table} 的字段数量:`, targetFieldsArray.length);

      for (const targetField of targetFieldsArray) {
        console.log(`目标字段: ${targetField.field_name}, ID: ${targetField.field_id}`);

        if (targetField.field_id === strategyField.property.target_field) {
          console.log('✅ 找到匹配的目标字段:', targetField.field_name);
          console.log('字段类型:', targetField.type);
          console.log('UI类型:', targetField.ui_type);

          if (targetField.property && targetField.property.options) {
            console.log('✅ 找到选项配置:', JSON.stringify(targetField.property.options, null, 2));

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

            console.log('完整映射:', mapping);

            // 测试转换
            const testOptionId = 'opteZ8clPp';
            console.log(`测试转换 ${testOptionId}:`, mapping[testOptionId] || '未找到');

          } else {
            console.log('❌ 目标字段没有选项配置');
          }
          break;
        }
      }

      if (!targetFieldsArray.find(field => field.field_id === strategyField.property.target_field)) {
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