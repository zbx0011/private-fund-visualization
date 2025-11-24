const fs = require('fs');
const data = JSON.parse(fs.readFileSync('api_response.json', 'utf8'));

console.log('Total API responses:', data.length);
console.log('='.repeat(60));

data.forEach((item, idx) => {
    console.log(`\n${idx + 1}. ${item.url}`);

    // Check for records array
    if (item.data && item.data.data) {
        const apiData = item.data.data;

        if (apiData.records && Array.isArray(apiData.records)) {
            console.log(`   ✓ Has ${apiData.records.length} records`);

            // Show first record structure
            if (apiData.records.length > 0) {
                const firstRecord = apiData.records[0];
                console.log('   First record keys:', Object.keys(firstRecord).join(', '));

                // Check for URL fields
                if (firstRecord.url || firstRecord.link || firstRecord.originalUrl) {
                    console.log('   ✓ Contains URL field!');
                    console.log('   Sample URL:', firstRecord.url || firstRecord.link || firstRecord.originalUrl);
                }
            }
        } else if (apiData.list && Array.isArray(apiData.list)) {
            console.log(`   ✓ Has ${apiData.list.length} list items`);
        } else {
            console.log('   Structure:', Object.keys(apiData).join(', '));
        }
    }
});
