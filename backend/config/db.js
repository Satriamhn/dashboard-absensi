const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_absensi',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+07:00',
    dateStrings: true,
});

// Test koneksi saat startup
pool.getConnection()
    .then(conn => {
        console.log('✅  MySQL terhubung ke database:', process.env.DB_NAME);
        conn.release();
    })
    .catch(err => {
        console.error('❌  Gagal koneksi MySQL:', err.message);
    });

module.exports = pool;
