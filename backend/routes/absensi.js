const express = require('express');
const { body, query, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper: format errors
const validate = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return true;
    }
    return false;
};

// ─── GET /api/absensi ────────────────────────────────
// Admin: semua absensi | Pegawai: absensi sendiri
// Query: ?tanggal=YYYY-MM-DD&status=Hadir&user_id=2
router.get('/', authenticate, async (req, res) => {
    try {
        const { tanggal, status, user_id, page = 1, limit = 20 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let where = [];
        let params = [];

        // Pegawai hanya bisa lihat data sendiri
        if (req.user.role !== 'admin') {
            where.push('a.user_id = ?');
            params.push(req.user.id_user);
        } else if (user_id) {
            where.push('a.user_id = ?');
            params.push(user_id);
        }

        if (tanggal) { where.push('a.tanggal = ?'); params.push(tanggal); }
        if (status) { where.push('a.status = ?'); params.push(status); }

        const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const [rows] = await pool.query(
            `SELECT a.id_absen, a.user_id, u.nama, u.email, j.nama_jabatan AS jabatan,
                    a.tanggal, a.jam_masuk, a.jam_keluar, a.status, a.latitude, a.longitude, a.keterangan
             FROM absensi a
             JOIN users u ON a.user_id = u.id_user
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             ${whereSQL}
             ORDER BY a.tanggal DESC, a.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM absensi a ${whereSQL}`,
            params
        );

        return res.json({
            success: true,
            data: rows,
            pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('[ABSENSI GET]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data absensi.' });
    }
});

// ─── GET /api/absensi/today ──────────────────────────
// Cek apakah user sudah absen hari ini (Sequence Diagram step ②)
router.get('/today', authenticate, async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);
        const userId = req.user.role === 'admin'
            ? (req.query.user_id || req.user.id_user)
            : req.user.id_user;

        const [rows] = await pool.query(
            `SELECT a.id_absen, a.tanggal, a.jam_masuk, a.jam_keluar, a.status, a.latitude, a.longitude
             FROM absensi a
             WHERE a.user_id = ? AND a.tanggal = ?`,
            [userId, today]
        );

        return res.json({
            success: true,
            sudah_absen: rows.length > 0,
            data: rows[0] || null,
            tanggal: today,
        });
    } catch (err) {
        console.error('[ABSENSI TODAY]', err);
        return res.status(500).json({ success: false, message: 'Gagal cek absensi hari ini.' });
    }
});

// ─── POST /api/absensi ───────────────────────────────
// Simpan absensi masuk (dengan validasi duplikasi & lokasi)
router.post(
    '/',
    authenticate,
    [
        body('latitude').notEmpty().withMessage('Latitude diperlukan'),
        body('longitude').notEmpty().withMessage('Longitude diperlukan'),
        body('type').isIn(['masuk', 'keluar']).withMessage('Type harus masuk atau keluar'),
    ],
    async (req, res) => {
        if (validate(req, res)) return;

        const { latitude, longitude, type } = req.body;
        const userId = req.user.id_user;
        const today = new Date().toISOString().slice(0, 10);
        const now = new Date().toTimeString().slice(0, 8); // HH:MM:SS

        try {
            // ── Sequence Diagram: Cek absensi hari ini ──
            const [existing] = await pool.query(
                'SELECT * FROM absensi WHERE user_id = ? AND tanggal = ?',
                [userId, today]
            );

            if (type === 'masuk') {
                if (existing.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Kamu sudah absen masuk hari ini.',
                        data: existing[0],
                    });
                }

                // Tentukan status berdasarkan jam
                const [hour, minute] = now.split(':').map(Number);
                const totalMin = hour * 60 + minute;
                const status = totalMin > 8 * 60 + 30 ? 'Telat' : 'Hadir';

                // ── Sequence Diagram: simpan jam_masuk ke DB ──
                const [result] = await pool.query(
                    `INSERT INTO absensi (user_id, tanggal, jam_masuk, status, latitude, longitude)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [userId, today, now, status, latitude, longitude]
                );

                const [newRow] = await pool.query(
                    'SELECT * FROM absensi WHERE id_absen = ?',
                    [result.insertId]
                );

                return res.status(201).json({
                    success: true,
                    message: `Absensi berhasil! Status: ${status}`,
                    data: newRow[0],
                });
            }

            if (type === 'keluar') {
                if (existing.length === 0) {
                    return res.status(400).json({ success: false, message: 'Kamu belum absen masuk hari ini.' });
                }
                if (existing[0].jam_keluar) {
                    return res.status(400).json({ success: false, message: 'Kamu sudah absen keluar hari ini.', data: existing[0] });
                }

                await pool.query(
                    'UPDATE absensi SET jam_keluar = ? WHERE user_id = ? AND tanggal = ?',
                    [now, userId, today]
                );

                const [updated] = await pool.query(
                    'SELECT * FROM absensi WHERE user_id = ? AND tanggal = ?',
                    [userId, today]
                );

                return res.json({ success: true, message: 'Absen keluar berhasil!', data: updated[0] });
            }
        } catch (err) {
            console.error('[ABSENSI POST]', err);
            return res.status(500).json({ success: false, message: 'Gagal menyimpan absensi.' });
        }
    }
);

// ─── GET /api/absensi/summary ────────────────────────
// Rekap statistik hari ini (untuk dashboard admin)
router.get('/summary', authenticate, adminOnly, async (req, res) => {
    try {
        const today = new Date().toISOString().slice(0, 10);

        const [[stats]] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM users WHERE role='pegawai')          AS total_pegawai,
                SUM(CASE WHEN status='Hadir' THEN 1 ELSE 0 END)            AS hadir,
                SUM(CASE WHEN status='Telat'  THEN 1 ELSE 0 END)            AS telat,
                SUM(CASE WHEN status='Izin'   THEN 1 ELSE 0 END)            AS izin,
                SUM(CASE WHEN status='Alpha'  THEN 1 ELSE 0 END)            AS alpha
             FROM absensi WHERE tanggal = ?`,
            [today]
        );

        return res.json({ success: true, tanggal: today, data: stats });
    } catch (err) {
        console.error('[ABSENSI SUMMARY]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil summary.' });
    }
});

module.exports = router;
