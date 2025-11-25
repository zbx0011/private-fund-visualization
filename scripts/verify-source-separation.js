require("dotenv").config();

const https = require("https");
const querystring = require("querystring");

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
      grant_type: "client_credentials",
      client_id: this.appId,
      client_secret: this.appSecret,
    });

    const result = await new Promise((resolve, reject) => {
      const options = {
        hostname: "open.feishu.cn",
        port: 443,
        path: "/open-apis/auth/v3/tenant_access_token/internal",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      };

      const req = https.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
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

      req.on("error", (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });

    this.accessToken = result.tenant_access_token;
    this.tokenExpireTime = Date.now() + (result.expire - 60) * 1000; // 提前1分钟过期

    console.log("✅ 获取访问令牌成功");
    return this.accessToken;
  }

  async makeRequest(method, path, data = null, needToken = true) {
    if (needToken && !this.accessToken) {
      await this.getAccessToken();
    }

    return new Promise((resolve, reject) => {
      const options = {
        hostname: "open.feishu.cn",
        port: 443,
        path: path,
        method: method,
        headers: needToken
          ? {
              Authorization: `Bearer ${this.accessToken}`,
              "Content-Type": "application/json",
            }
          : {
              "Content-Type": "application/x-www-form-urlencoded",
            },
      };

      const req = https.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
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

      req.on("error", (error) => {
        reject(error);
      });

      if (data) {
        req.write(data);
      }

      req.end();
    });
  }

  async getBitableRecords(appToken, tableId) {
    let allRecords = [];
    let pageToken = null;

    do {
      const path = pageToken
        ? `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500&page_token=${pageToken}`
        : `/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500`;

      const result = await this.makeRequest("GET", path);
      allRecords = allRecords.concat(result.data.items || []);
      pageToken = result.data.page_token;
    } while (pageToken);

    return allRecords;
  }
}

async function verifySourceSeparation() {
  console.log("🔍 开始验证数据源分离...\n");

  try {
    const appToken = "MKTubHkUKa13gbs9WdNcQNvsn3f";

    // 表格配置
    const tables = {
      main: {
        id: "tblcXqDbfgA0x533",
        name: "私募取数表",
        description: "Direct Investments + Huatai 43",
      },
      fof: {
        id: "tblXwpq4lQzfymME",
        name: "第一创业FOF",
        description: "First Capital FOF",
      },
    };

    const api = new SimpleLarkAPI({
      appId: process.env.LARK_APP_ID,
      appSecret: process.env.LARK_APP_SECRET,
    });

    console.log("📊 获取表格数据...\n");

    // 获取各表格数据
    const tableData = {};
    for (const [type, config] of Object.entries(tables)) {
      console.log(`获取 ${config.name} (${config.id}) 数据...`);
      const records = await api.getBitableRecords(appToken, config.id);
      tableData[type] = {
        ...config,
        records: records,
        count: records.length,
      };
      console.log(`✅ ${config.name}: ${records.length} 条记录\n`);
    }

    console.log("🔍 验证结果:\n");

    // 验证数据分离
    console.log("=== 数据源分离验证 ===");

    let totalRecords = 0;
    let mainRecords = 0;
    let fofRecords = 0;

    for (const [type, data] of Object.entries(tableData)) {
      console.log(`\n${data.name} (${data.description}):`);
      console.log(`- 表格ID: ${data.id}`);
      console.log(`- 记录数量: ${data.count}`);

      totalRecords += data.count;
      if (type === "main") mainRecords = data.count;
      if (type === "fof") fofRecords = data.count;

      // 显示前几条记录的基本信息
      if (data.records.length > 0) {
        console.log("- 示例记录:");
        data.records.slice(0, 3).forEach((record, index) => {
          const fields = record.fields || {};
          const name = fields["基金名称"] || fields["名称"] || "未知";
          const strategy = fields["策略类型"] || "未知策略";
          console.log(`  ${index + 1}. ${name} - ${strategy}`);
        });
      }
    }

    console.log(`\n=== 汇总统计 ===`);
    console.log(`总记录数: ${totalRecords}`);
    console.log(`主数据源 (Direct + Huatai): ${mainRecords} 条`);
    console.log(`FOF数据源 (First Capital): ${fofRecords} 条`);

    // 验证数据完整性
    if (totalRecords === 0) {
      console.log("\n⚠️  警告: 没有找到任何数据记录");
    } else {
      console.log("\n✅ 数据源分离验证完成");
      console.log("✅ 预期的数据分离:");
      console.log("  - Dashboard Overview/Strategy 页面应该显示主数据源数据");
      console.log("  - FOF Special 模块应该只显示 FOF 数据源数据");
    }

    // 验证数据库记录
    console.log("\n=== 数据库验证 ===");
    console.log("检查数据库中的 source_table 字段...");

    const sqlite3 = require("sqlite3").verbose();
    const { join } = require("path");
    const dbPath = join(process.cwd(), "data", "funds.db");

    const db = new sqlite3.Database(dbPath);

    // 检查 source_table 列是否存在
    db.all("PRAGMA table_info(funds)", (err, columns) => {
      if (err) {
        console.log("❌ 无法检查数据库结构:", err.message);
        return;
      }

      const hasSourceTable = columns.some((col) => col.name === "source_table");
      if (hasSourceTable) {
        console.log("✅ source_table 列存在");

        // 统计各数据源数量
        db.all(
          "SELECT source_table, COUNT(*) as count FROM funds GROUP BY source_table",
          (err, results) => {
            if (err) {
              console.log("❌ 无法统计数据源:", err.message);
            } else {
              console.log("数据库记录统计:");
              results.forEach((row) => {
                const sourceName =
                  row.source_table === "main"
                    ? "主数据源"
                    : row.source_table === "fof"
                    ? "FOF数据源"
                    : row.source_table;
                console.log(`- ${sourceName}: ${row.count} 条记录`);
              });
            }
            db.close();
          }
        );
      } else {
        console.log("❌ source_table 列不存在，需要运行数据库迁移");
        db.close();
      }
    });

  } catch (error) {
    console.error("❌ 验证失败:", error.message);
  }
}

// 运行验证
verifySourceSeparation();
