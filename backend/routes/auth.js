const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');

const router = express.Router();

// ─── POST /api/auth/login ────────────────────────────
// Validasi email & password, kirim JWT
router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Format email tidak valid'),
        body('password').notEmpty().withMessage('Password tidak boleh kosong'),
    ],
    async (req, res) => {
        // Cek validasi input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Cari user berdasarkan email
            const [rows] = await pool.query(
                `SELECT u.id_user, u.nama, u.email, u.password, u.role,
                        j.nama_jabatan AS jabatan, s.nama_shift, s.jam_masuk, s.jam_keluar
                 FROM users u
                 LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
                 LEFT JOIN shift   s ON u.shift_id   = s.id_shift
                 WHERE u.email = ?`,
                [email]
            );

            if (rows.length === 0) {
                return res.status(401).json({ success: false, message: 'Email tidak terdaftar.' });
            }

            const user = rows[0];

            // Verifikasi password dengan bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Password salah.' });
            }

            // Buat JWT Token
            const token = jwt.sign(
                { id_user: user.id_user, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
            );

            // Hapus password dari response
            delete user.password;

            return res.status(200).json({
                success: true,
                message: 'Login berhasil!',
                token,
                user,
            });
        } catch (err) {
            console.error('[AUTH LOGIN]', err);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
        }
    }
);

// ─── GET /api/auth/me ────────────────────────────────
// Ambil data user yang sedang login (untuk refresh state)
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT u.id_user, u.nama, u.email, u.role,
                    j.nama_jabatan AS jabatan, s.nama_shift, s.jam_masuk, s.jam_keluar
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             LEFT JOIN shift   s ON u.shift_id   = s.id_shift
             WHERE u.id_user = ?`,
            [req.user.id_user]
        );
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        return res.json({ success: true, user: rows[0] });
    } catch (err) {
        console.error('[AUTH ME]', err);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// ─── POST /api/auth/register ─────────────────────────
router.post(
    '/register',
    [
        body('nama').notEmpty().withMessage('Nama tidak boleh kosong'),
        body('email').isEmail().withMessage('Format email tidak valid'),
        body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: errors.array()[0].msg });
        }

        const { nama, email, password, jabatan_id = null, shift_id = null } = req.body;

        try {
            // Cek apakah email sudah terdaftar
            const [existing] = await pool.query('SELECT id_user FROM users WHERE email = ?', [email]);
            if (existing.length > 0) {
                return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
            }

            // Hash password
            const hashed = await bcrypt.hash(password, 10);

            // Insert user baru (role default: pegawai)
            const [result] = await pool.query(
                `INSERT INTO users (nama, email, password, role, jabatan_id, shift_id)
                 VALUES (?, ?, ?, 'pegawai', ?, ?)`,
                [nama, email, hashed, jabatan_id, shift_id]
            );

            return res.status(201).json({
                success: true,
                message: 'Akun berhasil dibuat! Silakan login.',
                user_id: result.insertId,
            });
        } catch (err) {
            console.error('[AUTH REGISTER]', err);
            return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
        }
    }
);

// ─── GET /api/auth/jabatan ───────────────────────────
// Ambil daftar jabatan & shift untuk form register (public)
router.get('/options', async (_req, res) => {
    try {
        const [jabatan] = await pool.query('SELECT id_jabatan AS id, nama_jabatan AS nama FROM jabatan');
        const [shift]   = await pool.query('SELECT id_shift AS id, nama_shift AS nama, jam_masuk, jam_keluar FROM shift');
        return res.json({ success: true, jabatan, shift });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Gagal mengambil data.' });
    }
});

module.exports = router;

