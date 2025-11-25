// Debug: check what data we're passing to YieldCurveChart
const testSeries = [{
    name: '累计收益率',
    data: [
        { date: '2025-06-12', value: 2.469 },
        { date: '2025-06-19', value: 2.9408 }
    ]
}];

console.log('Test series structure:');
console.log(JSON.stringify(testSeries, null, 2));

console.log('\nData format check:');
console.log('- series is array:', Array.isArray(testSeries));
console.log('- first series has name:', testSeries[0].name);
console.log('- first series has data array:', Array.isArray(testSeries[0].data));
console.log('- first data point:', testSeries[0].data[0]);
