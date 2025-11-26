
import { LarkBitableAPI } from '../src/lib/lark-api'
import * as dotenv from 'dotenv'

dotenv.config()

async function main() {
    const api = new LarkBitableAPI({
        appId: process.env.LARK_APP_ID!,
        appSecret: process.env.LARK_APP_SECRET!
    })

    const tableId = 'tblcXqDbfgA0x533'
    console.log(`Fetching records from ${tableId}...`)
    const records = await api.getBitableRecords(process.env.LARK_APP_TOKEN!, tableId)

    if (records.length > 0) {
        console.log('Field names in first record:')
        console.log(JSON.stringify(Object.keys(records[0].fields), null, 2))
        process.exit(0)
    } else {
        console.log('No records found.')
    }
}

main().catch(console.error)
