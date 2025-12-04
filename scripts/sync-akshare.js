require('dotenv').config({ path: '.env' });
const { spawn } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/funds.db');

async function runPythonScript() {
    return new Promise((resolve, reject) => {
        const python = spawn('python', [path.join(__dirname, 'fetch-index-akshare.py')], {
            env: {
                ...process.env,
                NO_PROXY: '*',
                no_proxy: '*'
            }
        });

        let stdout = '';
        let stderr = '';

        python.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        python.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(data.toString()); // Print progress
        });

        python.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script exited with code ${code}: ${stderr}`));
            } else {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                } catch (e) {
                    reject(new Error(`Failed to parse JSON: ${e.message}\nOutput: ${stdout}`));
                }
            }
        });
    });
}

async function syncIndices() {
    console.log('Fetching index data using AKShare...');

    try {
        const data = await runPythonScript();

        const db = new sqlite3.Database(DB_PATH);

        // Ensure table exists with correct schema
        db.run(`
            CREATE TABLE IF NOT EXISTS market_indices (
                date TEXT,
                code TEXT,
                name TEXT,
                close REAL,
                change_pct REAL,
                PRIMARY KEY (date, code)
            )
        `);

        // Use column names that match the existing table schema
        const insert = db.prepare(`
            INSERT OR REPLACE INTO market_indices (date, code, name, close)
            VALUES (?, ?, ?, ?)
        `);

        let totalInserted = 0;

        db.serialize(() => {
            db.run('BEGIN TRANSACTION');

            for (const [code, indexData] of Object.entries(data)) {
                console.log(`Inserting ${indexData.data.length} records for ${indexData.name} (${code})...`);

                for (const record of indexData.data) {
                    insert.run(
                        record.date,
                        code,
                        indexData.name,
                        record.close
                    );
                    totalInserted++;
                }
            }

            db.run('COMMIT');
            insert.finalize();

            console.log(`\nSync completed! Total records: ${totalInserted}`);
        });

        db.close();

    } catch (error) {
        console.error('Sync failed:', error);
    }
}

syncIndices();
