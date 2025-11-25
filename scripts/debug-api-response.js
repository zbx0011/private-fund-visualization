const http = require('http');

const url = 'http://localhost:3000/api/funds?type=excluded-fof';

http.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success) {
        const funds = json.data.funds;
        console.log(`Total funds: ${funds.length}`);
        if (funds.length > 0) {
          console.log('First fund sample:');
          console.log(JSON.stringify(funds[0], null, 2));

          // Check daily_pnl specifically
          const pnl = funds.reduce((sum, f) => sum + (f.daily_pnl || 0), 0);
          console.log(`Total daily_pnl (snake_case): ${pnl}`);

          const pnlCamel = funds.reduce((sum, f) => sum + (f.dailyPnl || 0), 0);
          console.log(`Total dailyPnl (camelCase): ${pnlCamel}`);
        }
      } else {
        console.log('API returned error:', json);
      }
    } catch (e) {
      console.error('Error parsing JSON:', e);
      console.log('Raw data:', data.substring(0, 200));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err);
});