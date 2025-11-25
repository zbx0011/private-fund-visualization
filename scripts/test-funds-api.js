// Test the funds API response format
fetch('http://localhost:3003/api/funds')
    .then(res => res.json())
    .then(data => {
        console.log('API Response:', data);
        console.log('data.success:', data.success);
        console.log('data.data type:', typeof data.data);
        console.log('data.data is array:', Array.isArray(data.data));
        if (data.data) {
            console.log('data.data keys:', Object.keys(data.data));
        }
    })
    .catch(err => console.error('Error:', err));
