const axios = require('axios');

async function checkAPIData() {
    try {
        const response = await axios.get('http://localhost:3000/api/funds?type=excluded-fof&includeHistory=true');
        const fund = response.data.data.funds[0];

        console.log('基金名称:', fund.name);
        console.log('\n最近10条历史数据的日期:');
        fund.history.slice(-10).forEach(h => {
            console.log(`  ${h.date} (nav_date: ${h.nav_date}) - daily_return: ${(h.daily_return * 100).toFixed(2)}%`);
        });

    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkAPIData();
