/**
 * migrate.js — Jalankan: node migrate.js "mysql://user:pass@host:port/db"
 */
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

const url = process.argv[2];

if (!url) {
    console.error('❌  Harap sertakan URL MySQL sebagai argumen.');
    console.error('    Contoh: node migrate.js "mysql://root:pass@host:port/db"');
    process.exit(1);
}

async function migrate() {
    console.log('🔌  Menghubungkan ke database Railway...');

    const conn = await mysql.createConnection(url + '?ssl={"rejectUnauthorized":true}').catch(() =>
        mysql.createConnection(url)
    );

    console.log('✅  Terhubung!\n');

    const sqlFile = path.join(__dirname, 'database_railway.sql');
    const sql     = fs.readFileSync(sqlFile, 'utf8');

    // Pisahkan per statement, hapus komentar, jalankan satu-satu
    const statements = sql
        .split(';')
        .map(s => s.replace(/--.*$/gm, '').trim())
        .filter(s => s.length > 0);

    console.log(`📋  Menjalankan ${statements.length} statement SQL...\n`);

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        const preview = stmt.substring(0, 60).replace(/\n/g, ' ');
        try {
            await conn.query(stmt);
            console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
        } catch (err) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_ENTRY') {
                console.log(`  ⚠️  [${i + 1}/${statements.length}] Skip (sudah ada): ${preview}...`);
            } else {
                console.error(`  ❌ [${i + 1}/${statements.length}] Error: ${err.message}`);
                console.error(`     Statement: ${stmt.substring(0, 100)}`);
            }
        }
    }

    await conn.end();
    console.log('\n🎉  Migrasi selesai! Semua tabel sudah dibuat.');
}

migrate().catch(err => {
    console.error('❌  Fatal error:', err.message);
    process.exit(1);
});
