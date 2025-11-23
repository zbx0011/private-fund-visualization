const axios = require('axios');

async function checkDateFormat() {
    try {
        const response = await axios.get('http://localhost:3000/api/funds?type=excluded-fof&includeHistory=true');
        const funds = response.data.data.funds;

        console.log('Checking date formats across all funds...\n');

        const dateFormats = new Set();
        let sampleDates = [];

        funds.forEach(fund => {
            if (fund.history && fund.history.length > 0) {
                fund.history.forEach(h => {
                    dateFormats.add(typeof h.date);
                    if (sampleDates.length < 20) {
                        sampleDates.push({ fund: fund.name, date: h.date, type: typeof h.date });
                    }
                });
            }
        });

        console.log('Date types found:', Array.from(dateFormats));
        console.log('\nSample dates:');
        sampleDates.forEach(s => {
            console.log(`  ${s.fund}: "${s.date}" (${s.type})`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkDateFormat();
