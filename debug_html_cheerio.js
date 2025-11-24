const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const filePath = path.join(__dirname, 'page_debug.html');
const content = fs.readFileSync(filePath, 'utf8');
const $ = cheerio.load(content);

const rows = $('tr.ant-table-row');
console.log(`Found ${rows.length} rows.`);

if (rows.length > 0) {
    const firstRow = $(rows[0]);
    console.log('--- First Row HTML ---');
    console.log(firstRow.html());
    console.log('--- End First Row HTML ---');

    const titleCell = firstRow.find('td.title');
    console.log('--- Title Cell HTML ---');
    console.log(titleCell.html());
    console.log('--- End Title Cell HTML ---');

    console.log('--- Links in Title Cell ---');
    titleCell.find('a').each((i, el) => {
        console.log(`Link ${i}: href="${$(el).attr('href')}", text="${$(el).text().trim()}"`);
    });

    console.log('--- Onclick in Title Cell ---');
    titleCell.find('*[onclick]').each((i, el) => {
        console.log(`Element ${i}: onclick="${$(el).attr('onclick')}"`);
    });
} else {
    console.log('No rows found with class .ant-table-row');
    // Try other selectors
    const trs = $('tr');
    console.log(`Total tr elements: ${trs.length}`);
    if (trs.length > 0) {
        console.log('First tr HTML:', $(trs[0]).html());
    }
}
