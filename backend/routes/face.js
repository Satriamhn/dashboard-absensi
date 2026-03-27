const express = require('express');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// ─── POST /api/face/kirim ─────────────────────────────
// Simpan foto wajah ke tabel kirim_wajah
// Body: { foto_base64: string, tipe: 'masuk'|'keluar', absensi_id?: number }
router.post('/kirim', authenticate, async (req, res) => {
    try {
        const { foto_base64, tipe = 'masuk', absensi_id = null, keterangan = null } = req.body;
        const userId = req.user.id_user;

        if (!foto_base64) {
            return res.status(400).json({ success: false, message: 'Data foto wajah diperlukan.' });
        }

        // Validasi tipe
        if (!['masuk', 'keluar'].includes(tipe)) {
            return res.status(400).json({ success: false, message: 'Tipe harus masuk atau keluar.' });
        }

        // Simpan ke tabel kirim_wajah
        const [result] = await pool.query(
            `INSERT INTO kirim_wajah (user_id, absensi_id, tipe, foto_base64, status, keterangan)
             VALUES (?, ?, ?, ?, 'terkirim', ?)`,
            [userId, absensi_id || null, tipe, foto_base64, keterangan]
        );

        return res.status(201).json({
            success: true,
            message: 'Foto wajah berhasil disimpan.',
            data: {
                id: result.insertId,
                user_id: userId,
                absensi_id,
                tipe,
                status: 'terkirim',
                created_at: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error('[FACE KIRIM]', err);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan foto wajah.' });
    }
});

// ─── GET /api/face/riwayat ────────────────────────────
// Ambil riwayat foto wajah user (atau semua jika admin)
router.get('/riwayat', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 10, user_id } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        let where = [];
        let params = [];

        if (req.user.role !== 'admin') {
            where.push('kw.user_id = ?');
            params.push(req.user.id_user);
        } else if (user_id) {
            where.push('kw.user_id = ?');
            params.push(user_id);
        }

        const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const [rows] = await pool.query(
            `SELECT kw.id, kw.user_id, u.nama, kw.absensi_id, kw.tipe, kw.status,
                    kw.keterangan, kw.created_at,
                    LEFT(kw.foto_base64, 100) AS foto_preview
             FROM kirim_wajah kw
             JOIN users u ON kw.user_id = u.id_user
             ${whereSQL}
             ORDER BY kw.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, Number(limit), offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM kirim_wajah kw ${whereSQL}`,
            params
        );

        return res.json({
            success: true,
            data: rows,
            pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('[FACE RIWAYAT]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil riwayat foto wajah.' });
    }
});

// ─── GET /api/face/:id/foto ───────────────────────────
// Ambil data foto lengkap berdasarkan ID (hanya admin atau pemilik)
router.get('/:id/foto', authenticate, async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT kw.*, u.nama FROM kirim_wajah kw
             JOIN users u ON kw.user_id = u.id_user
             WHERE kw.id = ?`,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Data foto tidak ditemukan.' });
        }

        const foto = rows[0];

        // Pegawai hanya bisa akses fotonya sendiri
        if (req.user.role !== 'admin' && foto.user_id !== req.user.id_user) {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }

        return res.json({ success: true, data: foto });
    } catch (err) {
        console.error('[FACE GET FOTO]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil foto wajah.' });
    }
});

module.exports = router;
