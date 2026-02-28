const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─── GET /api/izin ───────────────────────────────────
// Admin: semua izin | Pegawai: izin sendiri
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, user_id } = req.query;
        let where = [];
        let params = [];

        if (req.user.role !== 'admin') {
            where.push('i.user_id = ?');
            params.push(req.user.id_user);
        } else if (user_id) {
            where.push('i.user_id = ?');
            params.push(user_id);
        }

        if (status) { where.push('i.status = ?'); params.push(status); }

        const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const [rows] = await pool.query(
            `SELECT i.id_izin, i.user_id, u.nama, i.tanggal, i.jenis_izin,
                    i.keterangan, i.status, i.created_at,
                    ua.nama AS diproses_oleh_nama
             FROM izin i
             JOIN users u ON i.user_id = u.id_user
             LEFT JOIN users ua ON i.diproses_oleh = ua.id_user
             ${whereSQL}
             ORDER BY i.created_at DESC`,
            params
        );

        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[IZIN GET]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data izin.' });
    }
});

// ─── POST /api/izin ──────────────────────────────────
// Pegawai ajukan izin
router.post(
    '/',
    authenticate,
    [
        body('tanggal').isDate().withMessage('Format tanggal tidak valid (YYYY-MM-DD)'),
        body('jenis_izin').isIn(['Sakit', 'Cuti', 'Dinas']).withMessage('Jenis izin tidak valid'),
        body('keterangan').optional().isLength({ max: 500 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { tanggal, jenis_izin, keterangan } = req.body;
        const userId = req.user.id_user;

        try {
            // Cek duplikasi izin pada tanggal yang sama
            const [existing] = await pool.query(
                'SELECT id_izin FROM izin WHERE user_id = ? AND tanggal = ?',
                [userId, tanggal]
            );

            if (existing.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Kamu sudah mengajukan izin pada tanggal tersebut.',
                });
            }

            const [result] = await pool.query(
                'INSERT INTO izin (user_id, tanggal, jenis_izin, keterangan) VALUES (?, ?, ?, ?)',
                [userId, tanggal, jenis_izin, keterangan || null]
            );

            const [newRow] = await pool.query(
                `SELECT i.*, u.nama FROM izin i JOIN users u ON i.user_id = u.id_user WHERE i.id_izin = ?`,
                [result.insertId]
            );

            return res.status(201).json({
                success: true,
                message: 'Pengajuan izin berhasil dikirim. Menunggu persetujuan.',
                data: newRow[0],
            });
        } catch (err) {
            console.error('[IZIN POST]', err);
            return res.status(500).json({ success: false, message: 'Gagal mengajukan izin.' });
        }
    }
);

// ─── PUT /api/izin/:id/status ────────────────────────
// Admin: setujui atau tolak izin
router.put('/:id/status', authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Disetujui', 'Ditolak'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status harus Disetujui atau Ditolak.' });
    }

    try {
        const [existing] = await pool.query('SELECT * FROM izin WHERE id_izin = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Data izin tidak ditemukan.' });
        }

        await pool.query(
            'UPDATE izin SET status = ?, diproses_oleh = ? WHERE id_izin = ?',
            [status, req.user.id_user, id]
        );

        // Jika disetujui, update tabel absensi dengan status Izin
        if (status === 'Disetujui') {
            const izin = existing[0];
            // Upsert absensi dengan status Izin
            await pool.query(
                `INSERT INTO absensi (user_id, tanggal, status, keterangan)
                 VALUES (?, ?, 'Izin', ?)
                 ON DUPLICATE KEY UPDATE status = 'Izin', keterangan = ?`,
                [izin.user_id, izin.tanggal, `Izin: ${izin.jenis_izin}`, `Izin: ${izin.jenis_izin}`]
            );
        }

        const [updated] = await pool.query(
            `SELECT i.*, u.nama FROM izin i JOIN users u ON i.user_id = u.id_user WHERE i.id_izin = ?`,
            [id]
        );

        return res.json({
            success: true,
            message: `Izin ${status === 'Disetujui' ? 'disetujui' : 'ditolak'} oleh ${req.user.nama}.`,
            data: updated[0],
        });
    } catch (err) {
        console.error('[IZIN STATUS]', err);
        return res.status(500).json({ success: false, message: 'Gagal memperbarui status izin.' });
    }
});

// ─── DELETE /api/izin/:id ────────────────────────────
// Pegawai hapus pengajuan izin (hanya yang masih Pending)
router.delete('/:id', authenticate, async (req, res) => {
    const { id } = req.params;

    try {
        const [existing] = await pool.query('SELECT * FROM izin WHERE id_izin = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });

        const izin = existing[0];

        // Hanya pemilik atau admin yang bisa hapus
        if (req.user.role !== 'admin' && izin.user_id !== req.user.id_user) {
            return res.status(403).json({ success: false, message: 'Tidak diizinkan.' });
        }

        if (izin.status !== 'Pending') {
            return res.status(400).json({ success: false, message: 'Hanya izin berstatus Pending yang bisa dihapus.' });
        }

        await pool.query('DELETE FROM izin WHERE id_izin = ?', [id]);
        return res.json({ success: true, message: 'Pengajuan izin berhasil dihapus.' });
    } catch (err) {
        console.error('[IZIN DELETE]', err);
        return res.status(500).json({ success: false, message: 'Gagal menghapus izin.' });
    }
});

module.exports = router;
