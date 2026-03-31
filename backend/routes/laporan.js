const express = require('express');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');
const { todayWIB } = require('../utils/timezone');

const router = express.Router();

// ─── GET /api/laporan/rekap-harian ───────────────────
// Statistik absensi hari ini
router.get('/rekap-harian', authenticate, adminOnly, async (req, res) => {
    try {
        const tanggal = req.query.tanggal || todayWIB(); // ✅ default ke hari ini WIB

        const [[stats]] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM users WHERE role = 'pegawai')           AS total_pegawai,
                COALESCE(SUM(CASE WHEN a.status = 'Hadir' THEN 1 ELSE 0 END), 0) AS hadir,
                COALESCE(SUM(CASE WHEN a.status = 'Telat'  THEN 1 ELSE 0 END), 0) AS telat,
                COALESCE(SUM(CASE WHEN a.status = 'Izin'   THEN 1 ELSE 0 END), 0) AS izin,
                COALESCE(SUM(CASE WHEN a.status = 'Alpha'  THEN 1 ELSE 0 END), 0) AS alpha
             FROM absensi a
             WHERE a.tanggal = ?`,
            [tanggal]
        );

        // Daftar pegawai belum absen
        const [belumAbsen] = await pool.query(
            `SELECT u.id_user, u.nama, j.nama_jabatan AS jabatan
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             WHERE u.role = 'pegawai'
               AND u.id_user NOT IN (SELECT user_id FROM absensi WHERE tanggal = ?)`,
            [tanggal]
        );

        return res.json({
            success: true,
            tanggal,
            data: { ...stats, belum_absen: belumAbsen.length, detail_belum_absen: belumAbsen },
        });
    } catch (err) {
        console.error('[LAPORAN HARIAN]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil rekap harian.' });
    }
});

// ─── GET /api/laporan/rekap-bulanan ──────────────────
// Rekap per bulan (untuk grafik dashboard)
router.get('/rekap-bulanan', authenticate, adminOnly, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                DATE_FORMAT(tanggal, '%Y-%m') AS bulan_key,
                DATE_FORMAT(tanggal, '%b')    AS bulan,
                COUNT(*)                       AS total,
                SUM(CASE WHEN status='Hadir' THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN status='Telat'  THEN 1 ELSE 0 END) AS telat,
                SUM(CASE WHEN status='Izin'   THEN 1 ELSE 0 END) AS izin,
                SUM(CASE WHEN status='Alpha'  THEN 1 ELSE 0 END) AS alpha
             FROM absensi
             WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY DATE_FORMAT(tanggal, '%Y-%m'), DATE_FORMAT(tanggal, '%b')
             ORDER BY bulan_key ASC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[LAPORAN BULANAN]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil rekap bulanan.' });
    }
});

// ─── GET /api/laporan/per-pegawai ────────────────────
// Rekap kehadiran per pegawai (tabel laporan)
router.get('/per-pegawai', authenticate, adminOnly, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT
                u.id_user, u.nama, u.email,
                j.nama_jabatan AS jabatan,
                COUNT(a.id_absen)                                  AS total,
                SUM(CASE WHEN a.status='Hadir' THEN 1 ELSE 0 END) AS hadir,
                SUM(CASE WHEN a.status='Telat'  THEN 1 ELSE 0 END) AS telat,
                SUM(CASE WHEN a.status='Izin'   THEN 1 ELSE 0 END) AS izin,
                SUM(CASE WHEN a.status='Alpha'  THEN 1 ELSE 0 END) AS alpha,
                ROUND(
                    SUM(CASE WHEN a.status IN ('Hadir','Telat') THEN 1 ELSE 0 END) * 100.0
                    / NULLIF(COUNT(a.id_absen), 0), 1
                ) AS pct_hadir
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             LEFT JOIN absensi a ON a.user_id = u.id_user
             WHERE u.role = 'pegawai'
             GROUP BY u.id_user, u.nama, u.email, j.nama_jabatan
             ORDER BY pct_hadir DESC`
        );
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[LAPORAN PER PEGAWAI]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil laporan per pegawai.' });
    }
});

// ─── GET /api/laporan/export ─────────────────────────
// Export data CSV (raw data JSON untuk di-convert di frontend)
router.get('/export', authenticate, adminOnly, async (req, res) => {
    try {
        const { bulan } = req.query; // format: YYYY-MM
        let where = '';
        let params = [];

        if (bulan) {
            where = 'WHERE DATE_FORMAT(a.tanggal, "%Y-%m") = ?';
            params.push(bulan);
        }

        const [rows] = await pool.query(
            `SELECT u.nama, u.email, j.nama_jabatan AS jabatan,
                    a.tanggal, a.jam_masuk, a.jam_keluar, a.status, a.latitude, a.longitude
             FROM absensi a
             JOIN users u ON a.user_id = u.id_user
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             ${where}
             ORDER BY a.tanggal DESC, u.nama ASC`,
            params
        );

        // Set header untuk CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="laporan_absensi${bulan ? '_' + bulan : ''}.csv"`);

        const header = ['Nama', 'Email', 'Jabatan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status', 'Latitude', 'Longitude'];
        const csvRows = [
            header.join(','),
            ...rows.map(r =>
                [r.nama, r.email, r.jabatan, r.tanggal, r.jam_masuk || '-', r.jam_keluar || '-', r.status, r.latitude || '-', r.longitude || '-'].join(',')
            ),
        ];

        return res.send(csvRows.join('\n'));
    } catch (err) {
        console.error('[LAPORAN EXPORT]', err);
        return res.status(500).json({ success: false, message: 'Gagal export laporan.' });
    }
});

module.exports = router;
