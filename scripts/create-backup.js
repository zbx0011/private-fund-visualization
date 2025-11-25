const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.join(__dirname, '..');
const date = new Date();
const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0') + '_' +
    String(date.getHours()).padStart(2, '0') +
    String(date.getMinutes()).padStart(2, '0');

const backupDirName = `backup_${dateStr}`;
const backupPath = path.join(projectRoot, 'backups', backupDirName);

// Ensure backups directory exists
if (!fs.existsSync(path.join(projectRoot, 'backups'))) {
    fs.mkdirSync(path.join(projectRoot, 'backups'));
}

// Create specific backup directory
if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath);
}

console.log(`🚀 Starting backup to: ${backupPath}`);

// Use robocopy for Windows (efficient and handles exclusions)
// /MIR :: MIRror a directory tree (equivalent to /E plus /PURGE).
// /XD :: eXclude Directories matching given names/paths.
// /XF :: eXclude Files matching given names/paths.
// /NFL :: No File List - don't log file names.
// /NDL :: No Directory List - don't log directory names.
// /NJH :: No Job Header.
// /NJS :: No Job Summary.
// /NP  :: No Progress - don't display percentage copied.

const source = projectRoot;
const dest = backupPath;
const excludeDirs = ['node_modules', '.git', '.next', 'backups', 'tmp', '.gemini'];
const excludeFiles = ['*.log', '.DS_Store'];

const command = `robocopy "${source}" "${dest}" /MIR /XD ${excludeDirs.join(' ')} /XF ${excludeFiles.join(' ')} /NFL /NDL /NJH /NJS /NP`;

try {
    // Robocopy exit codes:
    // 0: No errors occurred, and no copying was done. The source and destination directory trees are completely synchronized.
    // 1: One or more files were copied successfully (that is, new files have arrived).
    // 2: Some Extra files or directories were detected. No files were copied Examine the output log for details. 
    // 3: (2+1) Some files were copied. Additional files were present. No failure was encountered.
    // ... anything < 8 is usually success/partial success
    execSync(command, { stdio: 'inherit' });
    console.log('✅ Backup completed successfully!');
} catch (error) {
    // Robocopy throws error on exit code > 0 even if it's just "files copied" (code 1)
    // We need to check the status code
    if (error.status < 8) {
        console.log('✅ Backup completed successfully! (Files were copied)');
    } else {
        console.error('❌ Backup failed:', error.message);
    }
}

console.log(`\n📂 Backup location: ${backupPath}`);
