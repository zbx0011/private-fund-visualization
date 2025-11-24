const { spawn } = require('child_process');
const path = require('path');

console.log('🕒 Scheduler started. Waiting for 12:00 PM to run scraper...');

function runScraper() {
    console.log('🚀 Starting scheduled scraper job...');
    const scriptPath = path.join(__dirname, 'scrape-qyyjt-with-login.js');

    const scraper = spawn('node', [scriptPath], {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    scraper.on('close', (code) => {
        console.log(`🏁 Scraper finished with code ${code}`);
    });
}

// Check every minute
setInterval(() => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Run at 12:00 PM
    if (hours === 12 && minutes === 0) {
        runScraper();
    }
}, 60 * 1000);

// Optional: Run immediately on start for testing if needed (commented out)
// runScraper();
