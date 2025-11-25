require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const APP_TOKEN = 'MKTubHkUKa13gbs9WdNcQNvsn3f';
const TABLE_ID = 'tblcXqDbfgA0x533'; // 私募取数表
const APP_ID = process.env.LARK_APP_ID;
const APP_SECRET = process.env.LARK_APP_SECRET;

const DB_PATH = path.join(__dirname, '../data/funds.db');

// --- Lark API Helpers ---
async function getTenantAccessToken() {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn',
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.code !== 0) reject(new Error(json.msg));
                else resolve(json.tenant_access_token);
            });
        });
        req.write(JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }));
        req.end();
    });
}

async function getRecords(token, tableId) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: 'open.feishu.cn',
            path: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${tableId}/records?page_size=20`, // Limit to 20 for debug
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const json = JSON.parse(data);
                if (json.code !== 0) reject(new Error(json.msg));
                else resolve(json.data.items);
            });
        });
        req.end();
    });
}

// --- Data Conversion Helpers (Simplified) ---
function parseNumber(val) {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    if (Array.isArray(val)) return parseNumber(val[0]);
    if (typeof val === 'object' && val.text) return parseNumber(val.text); // Handle text object
    return parseFloat(String(val).replace(/[%,¥]/g, '')) || 0;
}

function parseDate(val) {
    if (!val) return new Date().toISOString();
    if (typeof val === 'number') return new Date(val).toISOString(); // Timestamp
    return new Date(val).toISOString();
}

function convertRecord(record) {
    const f = record.fields;
    return {
        id: record.record_id,
        name: f['基金名称'] || f['产品名称'] || 'Unknown',
        strategy: f['策略'] || f['策略类型'] || 'Unknown',
        manager: f['投资经理'] || f['经理'] || 'Unknown',
        latestNavDate: parseDate(f['净值日期'] || f['最新净值日期']),
        cumulativeReturn: parseNumber(f['累计净值'] || f['累计收益率']),
        annualizedReturn: parseNumber(f['本年收益率'] || f['年化收益率']),
        maxDrawdown: parseNumber(f['最大回撤']),
        sharpeRatio: parseNumber(f['夏普比率']),
        volatility: parseNumber(f['波动率']),
        totalAssets: parseNumber(f['资产净值'] || f['总规模']),
        standingAssets: parseNumber(f['存续规模']),
        cashAllocation: parseNumber(f['站岗资金']),
        status: f['状态'] || '正常',
        establishmentDate: parseDate(f['成立日期']),
        cost: parseNumber(f['投资成本'] || f['成本']),
        scale: parseNumber(f['持有份额'] || f['当前规模']),
        weeklyReturn: parseNumber(f['本周收益率']),
        dailyReturn: parseNumber(f['日收益率']),
        dailyPnl: parseNumber(f['当日盈亏'] || f['本日盈亏']),
        source_table: 'main'
    };
}

// --- Database Logic ---
function saveToDatabase(funds) {
    const db = new sqlite3.Database(DB_PATH);

    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO funds (
                record_id, name, strategy, manager, latest_nav_date, cumulative_return,
                annualized_return, max_drawdown, sharpe_ratio, volatility,
                total_assets, standing_assets, cash_allocation, status,
                establishment_date, cost, scale, weekly_return, daily_return, daily_pnl, source_table
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        funds.forEach(fund => {
            console.log(`Inserting ${fund.name}...`);
            try {
                stmt.run([
                    fund.id,
                    fund.name,
                    fund.strategy,
                    fund.manager,
                    fund.latestNavDate,
                    fund.cumulativeReturn,
                    fund.annualizedReturn,
                    fund.maxDrawdown,
                    fund.sharpeRatio,
                    fund.volatility,
                    fund.totalAssets,
                    fund.standingAssets,
                    fund.cashAllocation,
                    fund.status,
                    fund.establishmentDate,
                    fund.cost,
                    fund.scale,
                    fund.weeklyReturn,
                    fund.dailyReturn,
                    fund.dailyPnl,
                    fund.source_table
                ], function (err) {
                    if (err) console.error('Error inserting:', err);
                });
            } catch (e) {
                console.error('Exception inserting:', e);
            }
        });

        stmt.finalize();
    });

    db.close();
}

async function main() {
    try {
        console.log('Getting token...');
        const token = await getTenantAccessToken();
        console.log('Getting records...');
        const records = await getRecords(token, TABLE_ID);
        console.log(`Got ${records.length} records.`);

        const funds = records.map(convertRecord);
        console.log('Saving to DB...');
        saveToDatabase(funds);

    } catch (err) {
        console.error('Main Error:', err);
    }
}

main();
