const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));

// Check response 7 and 8 (indexes 6 and 7)
[6, 7].forEach(idx => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`API Response ${idx + 1}:`);
    console.log(data[idx].url);
    console.log('='.repeat(60));

    const apiData = data[idx].data.data;
    console.log(`Total items: ${apiData.total}`);
    console.log(`Items in response: ${apiData.items ? apiData.items.length : 0}\n`);

    if (apiData.items && apiData.items.length > 0) {
        const firstItem = apiData.items[0];
        console.log('First item structure:');
        console.log(JSON.stringify(firstItem, null, 2));
    }
});
