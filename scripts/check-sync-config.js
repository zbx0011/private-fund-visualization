console.log('=== Checking Sync Configuration ===\n');

const tablesToSync = [
    { id: 'tblcXqDbfgA0x533', type: 'main' }, // 私募取数表 (Primary data source)
    { id: 'tblcK2mWFtgob3Dg', type: 'main' }, // 私募盈亏一览表 (For concentration field)
    { id: 'tblXwpq4lQzfymME', type: 'fof' }   // 第一创业FOF
];

console.log('Tables to sync:');
tablesToSync.forEach((table, i) => {
    console.log(`${i + 1}. ${table.id} (${table.type})`);
});

console.log('\nTotal:', tablesToSync.length);
