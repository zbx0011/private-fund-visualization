const http = require('http');

http.get('http://localhost:3003/api/funds?type=excluded-fof', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    const funds = result.data.funds;

    console.log('📊 基金状态统计:');
    const statusCounts = {};
    funds.forEach(fund => {
      const status = fund.status || '未知';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    Object.keys(statusCounts).forEach(status => {
      console.log(`  ${status}: ${statusCounts[status]} 只基金`);
    });

    console.log('\n🔴 已赎回基金列表:');
    funds.filter(fund => fund.status === '已赎回').forEach((fund, index) => {
      console.log(`  ${index + 1}. ${fund.name}`);
    });
  });
});