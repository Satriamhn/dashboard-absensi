const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// ─────────────────────────────────────────────────────
// PENTING: route statis HARUS dideklarasi SEBELUM /:id
// agar Express tidak salah tangkap
// ─────────────────────────────────────────────────────

// ─── GET /api/users/jabatan/all ──────────────────────
router.get('/jabatan/all', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM jabatan ORDER BY nama_jabatan');
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[JABATAN ALL]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data jabatan.' });
    }
});

// ─── GET /api/users/shift/all ────────────────────────
router.get('/shift/all', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM shift ORDER BY nama_shift');
        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[SHIFT ALL]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data shift.' });
    }
});

// ─── GET /api/users ──────────────────────────────────
// Admin: lihat semua pegawai
router.get('/', authenticate, adminOnly, async (req, res) => {
    try {
        const { role, search } = req.query;
        let where = [];
        let params = [];

        if (role) { where.push('u.role = ?'); params.push(role); }
        if (search) {
            where.push('(u.nama LIKE ? OR u.email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        const whereSQL = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

        const [rows] = await pool.query(
            `SELECT u.id_user, u.nama, u.email, u.role, u.created_at,
                    j.id_jabatan, j.nama_jabatan AS jabatan,
                    s.id_shift, s.nama_shift
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             LEFT JOIN shift   s ON u.shift_id   = s.id_shift
             ${whereSQL}
             ORDER BY u.created_at DESC`,
            params
        );

        return res.json({ success: true, data: rows });
    } catch (err) {
        console.error('[USERS GET]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data pegawai.' });
    }
});

// ─── GET /api/users/:id ──────────────────────────────
router.get('/:id', authenticate, adminOnly, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id_user, u.nama, u.email, u.role, u.jabatan_id, u.shift_id,
                    j.nama_jabatan AS jabatan, s.nama_shift
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             LEFT JOIN shift   s ON u.shift_id   = s.id_shift
             WHERE u.id_user = ?`,
            [req.params.id]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        return res.json({ success: true, data: rows[0] });
    } catch (err) {
        console.error('[USER GET ID]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data user.' });
    }
});

// ─── POST /api/users ─────────────────────────────────
// Admin: tambah pegawai baru
router.post(
    '/',
    authenticate,
    adminOnly,
    [
        body('nama').notEmpty().withMessage('Nama wajib diisi'),
        body('email').isEmail().withMessage('Email tidak valid'),
        body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
        body('role').optional().isIn(['admin', 'pegawai']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { nama, email, password, role = 'pegawai', jabatan_id, shift_id } = req.body;

        try {
            const [existing] = await pool.query('SELECT id_user FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
            }

            const hashed = await bcrypt.hash(password, 10);

            const [result] = await pool.query(
                'INSERT INTO users (nama, email, password, role, jabatan_id, shift_id) VALUES (?, ?, ?, ?, ?, ?)',
                [nama, email, hashed, role, jabatan_id || null, shift_id || null]
            );

            return res.status(201).json({
                success: true,
                message: 'Pegawai berhasil ditambahkan.',
                id_user: result.insertId,
            });
        } catch (err) {
            console.error('[USER POST]', err);
            return res.status(500).json({ success: false, message: 'Gagal menambahkan pegawai.' });
        }
    }
);

// ─── PUT /api/users/:id ──────────────────────────────
// Admin: edit data pegawai
router.put(
    '/:id',
    authenticate,
    [
        body('nama').optional().notEmpty(),
        body('email').optional().isEmail(),
        body('password').optional().isLength({ min: 6 }),
        body('role').optional().isIn(['admin', 'pegawai']),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { id } = req.params;
        let { nama, email, password, role, jabatan_id, shift_id, avatar, telepon } = req.body;

        // Authorization Check
        if (req.user.role !== 'admin' && req.user.id_user !== Number(id)) {
            return res.status(403).json({ success: false, message: 'Akses ditolak.' });
        }

        // Prevent non-admin from changing critical fields
        if (req.user.role !== 'admin') {
            role = undefined;
            jabatan_id = undefined;
            shift_id = undefined;
        }

        try {
            const [existing] = await pool.query('SELECT * FROM users WHERE id_user = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

            if (email) {
                const [dup] = await pool.query('SELECT id_user FROM users WHERE email = ? AND id_user != ?', [email, id]);
                if (dup.length > 0) return res.status(400).json({ success: false, message: 'Email sudah dipakai user lain.' });
            }

            const updates = [];
            const values = [];

            if (nama) { updates.push('nama = ?'); values.push(nama); }
            if (email) { updates.push('email = ?'); values.push(email); }
            if (role) { updates.push('role = ?'); values.push(role); }
            if (jabatan_id) { updates.push('jabatan_id = ?'); values.push(jabatan_id); }
            if (shift_id) { updates.push('shift_id = ?'); values.push(shift_id); }
            if (avatar) { updates.push('avatar = ?'); values.push(avatar); }
            if (telepon !== undefined) { updates.push('telepon = ?'); values.push(telepon || null); }
            if (password) {
                const hashed = await bcrypt.hash(password, 10);
                updates.push('password = ?');
                values.push(hashed);
            }

            if (updates.length === 0) return res.status(400).json({ success: false, message: 'Tidak ada data yang diubah.' });

            values.push(id);
            await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id_user = ?`, values);

            return res.json({ success: true, message: 'Data pegawai berhasil diperbarui.' });
        } catch (err) {
            console.error('[USER PUT]', err);
            return res.status(500).json({ success: false, message: 'Gagal memperbarui data pegawai.' });
        }
    }
);

// ─── DELETE /api/users/:id ───────────────────────────
// Admin: hapus pegawai
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
    const { id } = req.params;

    if (Number(id) === req.user.id_user) {
        return res.status(400).json({ success: false, message: 'Tidak bisa menghapus akun sendiri.' });
    }

    try {
        const [existing] = await pool.query('SELECT id_user FROM users WHERE id_user = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

        await pool.query('DELETE FROM users WHERE id_user = ?', [id]);
        return res.json({ success: true, message: 'Pegawai berhasil dihapus.' });
    } catch (err) {
        console.error('[USER DELETE]', err);
        return res.status(500).json({ success: false, message: 'Gagal menghapus pegawai.' });
    }
});

module.exports = router;
