import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/database-server'
import path from 'path'

export async function GET() {
    try {
        const db = getDatabase()
        const dbInstance = (db as any).db

        const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data/funds.db')

        const count = await new Promise((resolve, reject) => {
            dbInstance.get("SELECT COUNT(*) as c FROM basic_pool_history", (err: any, row: any) => {
                if (err) resolve({ error: err.message })
                else resolve(row)
            })
        })

        const sample = await new Promise((resolve, reject) => {
            dbInstance.all("SELECT * FROM basic_pool_history LIMIT 5", (err: any, rows: any[]) => {
                if (err) resolve({ error: err.message })
                else resolve(rows)
            })
        })

        return NextResponse.json({
            cwd: process.cwd(),
            dbPath,
            tableCount: count,
            sampleData: sample
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
    }
}
