require('dotenv').config({ path: '.env' });

async function testSync() {
    try {
        console.log('Testing sync via API endpoint...');

        const response = await fetch('http://localhost:3003/api/lark-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appId: process.env.LARK_APP_ID,
                appSecret: process.env.LARK_APP_SECRET,
                appToken: process.env.LARK_APP_TOKEN,
                autoDetectTable: false,
                tables: [
                    { id: 'tblcXqDbfgA0x533', type: 'main' }
                ]
            })
        });

        const result = await response.json();
        console.log('Sync result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

testSync();
