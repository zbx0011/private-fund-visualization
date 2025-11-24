const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'page_debug.html');
const content = fs.readFileSync(filePath, 'utf8');

const keyword = 'ant-table-row';
const index = content.indexOf(keyword);

if (index !== -1) {
    console.log(`Found "${keyword}" at index ${index}`);
    const start = Math.max(0, index - 100);
    const end = Math.min(content.length, index + 3000);
    console.log('--- Context ---');
    console.log(content.substring(start, end));
    console.log('--- End Context ---');
} else {
    console.log(`"${keyword}" not found in file.`);
}
