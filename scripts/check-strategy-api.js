const http = require('http');

http.get('http://localhost:3003/api/funds?type=excluded-fof', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    const funds = result.data.funds;

    console.log('📊 基金策略统计:');
    const strategyCounts = {};
    funds.forEach(fund => {
      const strategy = fund.strategy || '未知策略';
      strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    });

    Object.keys(strategyCounts).sort().forEach(strategy => {
      console.log(`  ${strategy}: ${strategyCounts[strategy]} 只基金`);
    });

    console.log('\n🔍 前几只基金的策略信息:');
    funds.slice(0, 10).forEach((fund, index) => {
      console.log(`  ${index + 1}. ${fund.name}: ${fund.strategy || '无策略'}`);
    });

    console.log('\n📊 状态和策略组合统计:');
    const statusStrategyCounts = {};
    funds.forEach(fund => {
      const status = fund.status || '未知';
      const strategy = fund.strategy || '未知策略';
      const key = `${status} - ${strategy}`;
      statusStrategyCounts[key] = (statusStrategyCounts[key] || 0) + 1;
    });

    Object.keys(statusStrategyCounts).forEach(key => {
      console.log(`  ${key}: ${statusStrategyCounts[key]} 只`);
    });
  });
});