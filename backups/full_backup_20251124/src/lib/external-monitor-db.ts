import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'funds.db')
const db = new Database(dbPath)

// Initialize external_monitor table
const initExternalMonitorTable = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS external_monitor (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT,
            source TEXT,
            related_enterprise TEXT,
            importance TEXT,
            sentiment TEXT,
            level1_category TEXT,
            level2_category TEXT,
            url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)
}

// Insert external monitor record
export function insertExternalMonitorRecord(record: {
    date: string
    title: string
    summary?: string
    source?: string
    related_enterprise?: string
    importance?: string
    sentiment?: string
    level1_category?: string
    level2_category?: string
    url?: string
}) {
    const stmt = db.prepare(`
        INSERT INTO external_monitor (
            date, title, summary, source, related_enterprise,
            importance, sentiment, level1_category, level2_category, url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    return stmt.run(
        record.date,
        record.title,
        record.summary || null,
        record.source || null,
        record.related_enterprise || null,
        record.importance || null,
        record.sentiment || null,
        record.level1_category || null,
        record.level2_category || null,
        record.url || null
    )
}

// Get external monitor records with filters
export function getExternalMonitorRecords(filters?: {
    importance?: string
    sentiment?: string
    enterprise?: string
    limit?: number
    offset?: number
}) {
    let query = 'SELECT * FROM external_monitor WHERE 1=1'
    const params: any[] = []

    if (filters?.importance) {
        query += ' AND importance = ?'
        params.push(filters.importance)
    }

    if (filters?.sentiment) {
        query += ' AND sentiment = ?'
        params.push(filters.sentiment)
    }

    if (filters?.enterprise) {
        query += ' AND related_enterprise LIKE ?'
        params.push(`%${filters.enterprise}%`)
    }

    query += ' ORDER BY date DESC'

    if (filters?.limit) {
        query += ' LIMIT ?'
        params.push(filters.limit)
    }

    if (filters?.offset) {
        query += ' OFFSET ?'
        params.push(filters.offset)
    }

    const stmt = db.prepare(query)
    return stmt.all(...params)
}

// Count total records
export function countExternalMonitorRecords(filters?: {
    importance?: string
    sentiment?: string
    enterprise?: string
}) {
    let query = 'SELECT COUNT(*) as count FROM external_monitor WHERE 1=1'
    const params: any[] = []

    if (filters?.importance) {
        query += ' AND importance = ?'
        params.push(filters.importance)
    }

    if (filters?.sentiment) {
        query += ' AND sentiment = ?'
        params.push(filters.sentiment)
    }

    if (filters?.enterprise) {
        query += ' AND related_enterprise LIKE ?'
        params.push(`%${filters.enterprise}%`)
    }

    const stmt = db.prepare(query)
    const result = stmt.get(...params) as { count: number }
    return result.count
}

// Initialize table on module load
initExternalMonitorTable()
