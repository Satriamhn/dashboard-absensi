/**
 * fix_password.js
 * Generate hash bcrypt baru dan update password semua user di Railway
 * Jalankan: node fix_password.js
 */
const bcrypt    = require('bcryptjs');
const mysql     = require('mysql2/promise');

const DB_URL = 'mysql://root:KrehuUxgpZBAKMkjuHKPclNGkCOtADXV@gondola.proxy.rlwy.net:35542/railway';

// Password yang ingin diset untuk semua akun demo
const ADMIN_PASSWORD   = 'admin123';
const PEGAWAI_PASSWORD = 'admin123';

async function fix() {
    console.log('🔐  Membuat hash bcrypt...');

    const adminHash   = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const pegawaiHash = await bcrypt.hash(PEGAWAI_PASSWORD, 10);

    console.log(`  admin@absensi.com  → hash: ${adminHash}`);
    console.log(`  budi@absensi.com   → hash: ${pegawaiHash}`);
    console.log(`  sari@absensi.com   → hash: ${pegawaiHash}`);

    const conn = await mysql.createConnection(DB_URL);
    console.log('\n✅  Terhubung ke Railway MySQL\n');

    await conn.query(
        `UPDATE users SET password = ? WHERE email = 'admin@absensi.com'`,
        [adminHash]
    );
    console.log('  ✅ Password admin@absensi.com diupdate');

    await conn.query(
        `UPDATE users SET password = ? WHERE email IN ('budi@absensi.com', 'sari@absensi.com')`,
        [pegawaiHash]
    );
    console.log('  ✅ Password budi & sari diupdate');

    // Verifikasi
    const [rows] = await conn.query('SELECT email, role FROM users');
    console.log('\n📋  Daftar user di database:');
    rows.forEach(r => console.log(`  - ${r.email} (${r.role})`));

    await conn.end();
    console.log('\n🎉  Selesai! Coba login dengan:');
    console.log('  Email   : admin@absensi.com');
    console.log('  Password: admin123');
}

fix().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
