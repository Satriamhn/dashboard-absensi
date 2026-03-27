/**
 * config/initDB.js
 * ──────────────────────────────────────────────────────
 * Buat tabel-tabel yang diperlukan jika belum ada.
 * Dipanggil sekali saat server pertama kali start.
 * Aman dijalankan berkali-kali (idempotent).
 */

const pool = require('./db');

async function initDB() {
    try {
        // ─── Tabel settings ───────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                \`key\`     VARCHAR(100) NOT NULL UNIQUE,
                value       TEXT         NOT NULL,
                label       VARCHAR(200),
                updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        // ─── Tabel kirim_wajah ────────────────────────────────
        await pool.query(`
            CREATE TABLE IF NOT EXISTS kirim_wajah (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                user_id     INT NOT NULL,
                absensi_id  INT,
                tipe        ENUM('masuk','keluar') NOT NULL DEFAULT 'masuk',
                foto_base64 LONGTEXT NOT NULL,
                status      ENUM('terkirim','gagal','pending') NOT NULL DEFAULT 'terkirim',
                keterangan  VARCHAR(255),
                created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)    REFERENCES users(id_user) ON DELETE CASCADE,
                FOREIGN KEY (absensi_id) REFERENCES absensi(id_absen) ON DELETE SET NULL
            )
        `);

        console.log('✅ [DB INIT] Tabel kirim_wajah siap.');

        // ─── Seed nilai default jika tabel masih kosong ───────
        const defaults = [
            { key: 'company_name',     value: 'AbsensiPro',   label: 'Nama Perusahaan'         },
            { key: 'office_name',      value: 'Kantor Pusat', label: 'Nama Lokasi Kantor'       },
            { key: 'office_latitude',  value: '-6.200000',    label: 'Latitude Kantor'          },
            { key: 'office_longitude', value: '106.816666',   label: 'Longitude Kantor'         },
            { key: 'office_radius',    value: '100',          label: 'Radius Kantor (meter)'    },
        ];

        for (const row of defaults) {
            await pool.query(
                'INSERT IGNORE INTO settings (`key`, value, label) VALUES (?, ?, ?)',
                [row.key, row.value, row.label]
            );
        }

        console.log('✅ [DB INIT] Tabel settings siap.');
    } catch (err) {
        console.error('❌ [DB INIT] Gagal inisialisasi tabel settings:', err.message);
        // Tidak throw — server tetap jalan meski init gagal
    }
}

module.exports = initDB;
