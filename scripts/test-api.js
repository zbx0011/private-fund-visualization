// const fetch = require('node-fetch'); // Built-in in Node 18+

async function testApi() {
    // Use the ID found in debug-fund-history.js
    const id = 'recv2XOIANs16L';
    const url = `http://localhost:3000/api/funds/${id}/history`;

    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        const status = response.status;
        console.log(`Status: ${status}`);

        if (status === 200) {
            const data = await response.json();
            console.log(`Data length: ${data.length}`);
            if (data.length > 0) {
                console.log('First item:', data[0]);
            } else {
                console.log('Data is empty array');
            }
        } else {
            const text = await response.text();
            try {
                const json = JSON.parse(text);
                console.log('Error response (JSON):', JSON.stringify(json, null, 2));
            } catch (e) {
                console.log('Error response (Text):', text);
            }
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testApi();
