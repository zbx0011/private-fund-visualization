// Test if the modal receives correct data
console.log('Testing modal data flow...');

// Simulate what the modal should receive
const testData = {
    historyData: [
        { nav_date: '2025-06-12', cumulative_nav: 1.5854, market_value: 5123448.809804 },
        { nav_date: '2025-06-19', cumulative_nav: 1.5927, market_value: 5147039.812902 }
    ],
    fundCost: 5000000
};

console.log('\nTest data:', testData);

// Test date formatting
const formatDateSafe = (dateStr) => {
    if (!dateStr) return '无日期';
    try {
        const date = new Date(dateStr + 'T00:00:00');
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('zh-CN');
        }
        return dateStr;
    } catch (e) {
        return dateStr;
    }
};

console.log('\nDate formatting test:');
console.log('Input: "2025-06-12"');
console.log('Output:', formatDateSafe('2025-06-12'));

// Test chart series generation
const chartSeries = testData.historyData.length > 0 && testData.fundCost > 0 ? [{
    name: '累计收益率',
    data: testData.historyData.map(item => {
        const virtualNav = parseFloat(item.cumulative_nav || 0);
        const marketValue = parseFloat(item.market_value || 0);
        const shares = marketValue > 0 && virtualNav > 0 ? marketValue / virtualNav : 0;
        const returnRate = shares > 0 && testData.fundCost > 0
            ? ((virtualNav * shares - testData.fundCost) / testData.fundCost) * 100
            : 0;
        return {
            date: item.nav_date,
            value: parseFloat(returnRate.toFixed(4))
        };
    })
}] : [];

console.log('\nChart series:', chartSeries);
console.log('Data points:', chartSeries.length > 0 ? chartSeries[0].data.length : 0);
if (chartSeries.length > 0 && chartSeries[0].data.length > 0) {
    console.log('First point:', chartSeries[0].data[0]);
    console.log('Last point:', chartSeries[0].data[chartSeries[0].data.length - 1]);
}
