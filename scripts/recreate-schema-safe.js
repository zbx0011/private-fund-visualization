const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'funds.db');

console.log('=== Recreating Database Schema (Without Deleting File) ===\n');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Dropping existing tables...');

    db.run('DROP TABLE IF EXISTS funds', (err) => {
        if (err) console.error('Error dropping funds:', err);
        else console.log('✓ funds table dropped');
    });

    db.run('DROP TABLE IF EXISTS fund_nav_history', (err) => {
        if (err) console.error('Error dropping fund_nav_history:', err);
        else console.log('✓ fund_nav_history table dropped');

        console.log('\nCreating tables with correct schema...\n');

        // Create funds table with TEXT id
        db.run(`
      CREATE TABLE funds (
        id TEXT PRIMARY KEY,
        record_id TEXT,
        name TEXT NOT NULL,
        strategy TEXT,
        manager TEXT,
        latest_nav_date TEXT,
        cumulative_return REAL,
        annualized_return REAL,
        max_drawdown REAL,
        sharpe_ratio REAL,
        volatility REAL,
        total_assets REAL,
        standing_assets REAL,
        cash_allocation REAL,
        status TEXT,
        establishment_date TEXT,
        cost REAL,
        scale REAL,
        weekly_return REAL,
        daily_return REAL,
        daily_pnl REAL,
        yearly_return REAL,
        concentration REAL,
        source_table TEXT DEFAULT 'main',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
            if (err) {
                console.error('Error creating funds table:', err);
                db.close();
                return;
            }
            console.log('✓ funds table created');

            // Create fund_nav_history table
            db.run(`
        CREATE TABLE fund_nav_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fund_id TEXT NOT NULL,
          nav_date TEXT NOT NULL,
          unit_nav REAL,
          cumulative_nav REAL,
          daily_return REAL,
          total_assets REAL,
          status TEXT,
          cost REAL,
          market_value REAL,
          position_change REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(fund_id, nav_date)
        )
      `, (err) => {
                if (err) {
                    console.error('Error creating fund_nav_history table:', err);
                } else {
                    console.log('✓ fund_nav_history table created');
                }

                console.log('\n✓ Database schema recreated successfully');
                console.log('\nNow you can run the sync again.');
                db.close();
            });
        });
    });
});
