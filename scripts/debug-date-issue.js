const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/funds.db');
const db = new sqlite3.Database(dbPath);

const fundName = '世纪前沿量化对冲9号';

// Simulation of formatDate from ProfitAnalysisChart.tsx
const formatDate = (dateStr) => {
    if (!dateStr) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

db.serialize(() => {
    db.get('SELECT name, latest_nav_date FROM funds WHERE name = ?', [fundName], (err, row) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('Fund Record:', row);
        if (row) {
            console.log('Formatted Date:', formatDate(row.latest_nav_date));

            // Check if it's a timezone issue
            const d = new Date(row.latest_nav_date);
            console.log('Date Object:', d.toString());
            console.log('UTC Date:', d.toUTCString());
        }
    });

    db.all('SELECT nav_date FROM fund_nav_history WHERE fund_id = ? ORDER BY nav_date DESC LIMIT 3', [fundName], (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log('History Records:', rows);
    });
});

db.close();
