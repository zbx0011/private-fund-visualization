// 获取飞书所有表格列表，找到基础池产品表的ID
const https = require('https')

const APP_ID = 'cli_a81419422b37901c'
const APP_SECRET = 'eP5Gc83r0Avd20kKLVqyHbAiaZMdvFKa'
const APP_TOKEN = 'MKTubHkUKa13gbs9WdNcQNvsn3f'

async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            app_id: APP_ID,
            app_secret: APP_SECRET
        })

        const options = {
            hostname: 'open.feishu.cn',
            path: '/open-apis/auth/v3/tenant_access_token/internal',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        }

        const req = https.request(options, (res) => {
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => {
                const result = JSON.parse(body)
                resolve(result.tenant_access_token)
            })
        })
        req.on('error', reject)
        req.write(data)
        req.end()
    })
}

async function getTables(token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'open.feishu.cn',
            path: `/open-apis/bitable/v1/apps/${APP_TOKEN}/tables`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        const req = https.request(options, (res) => {
            let body = ''
            res.on('data', chunk => body += chunk)
            res.on('end', () => {
                const result = JSON.parse(body)
                resolve(result)
            })
        })
        req.on('error', reject)
        req.end()
    })
}

async function main() {
    console.log('获取飞书 Access Token...')
    const token = await getAccessToken()
    
    console.log('获取表格列表...')
    const result = await getTables(token)
    
    if (result.data && result.data.items) {
        console.log('\n所有表格:')
        result.data.items.forEach((table, i) => {
            console.log(`${i + 1}. ${table.name} - ID: ${table.table_id}`)
        })
    } else {
        console.log('未获取到表格:', result)
    }
}

main().catch(console.error)
