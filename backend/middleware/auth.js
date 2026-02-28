const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ─── Verifikasi JWT Token ─────────────────────────────
const authenticate = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ambil user terbaru dari DB (pastikan user masih aktif)
        const [rows] = await pool.query(
            `SELECT u.id_user, u.nama, u.email, u.role, j.nama_jabatan AS jabatan
             FROM users u
             LEFT JOIN jabatan j ON u.jabatan_id = j.id_jabatan
             WHERE u.id_user = ?`,
            [decoded.id_user]
        );

        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'User tidak ditemukan.' });
        }

        req.user = rows[0];
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa.' });
    }
};

// ─── Cek Role Admin ───────────────────────────────────
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
    }
    next();
};

module.exports = { authenticate, adminOnly };
