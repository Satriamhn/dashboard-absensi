/**
 * routes/settings.js
 * ─────────────────────────────────────────────────────
 * GET  /api/settings        → publik (nama perusahaan dll. diperlukan frontend)
 * PUT  /api/settings        → admin only (update semua sekaligus)
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Helper baca semua settings sebagai plain object { key: value }
async function getAllSettings() {
    const [rows] = await pool.query('SELECT `key`, value FROM settings');
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

// ─── GET /api/settings ───────────────────────────────
// Public: siapa pun yang sudah login bisa baca nama perusahaan dll.
router.get('/', authenticate, async (req, res) => {
    try {
        const settings = await getAllSettings();
        return res.json({ success: true, data: settings });
    } catch (err) {
        console.error('[SETTINGS GET]', err);
        return res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan.' });
    }
});

// ─── PUT /api/settings ───────────────────────────────
// Admin only: update satu atau lebih setting sekaligus
router.put(
    '/',
    authenticate,
    adminOnly,
    [
        body('company_name').optional().trim().notEmpty().withMessage('Nama perusahaan tidak boleh kosong'),
        body('office_latitude')
            .optional()
            .isFloat({ min: -90, max: 90 })
            .withMessage('Latitude harus antara -90 dan 90'),
        body('office_longitude')
            .optional()
            .isFloat({ min: -180, max: 180 })
            .withMessage('Longitude harus antara -180 dan 180'),
        body('office_radius')
            .optional()
            .isFloat({ min: 10, max: 5000 })   // isFloat supaya "100" dan "100.5" sama-sama lolos
            .withMessage('Radius harus antara 10 dan 5000 meter'),
        body('office_name').optional().trim().notEmpty().withMessage('Nama lokasi tidak boleh kosong'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const msg = errors.array().map(e => e.msg).join(', ');
            return res.status(400).json({ success: false, message: msg, errors: errors.array() });
        }

        const allowed = ['company_name', 'office_latitude', 'office_longitude', 'office_radius', 'office_name'];
        const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'Tidak ada field yang valid untuk diupdate.' });
        }

        try {
            // Upsert setiap key yang dikirim
            for (const [key, rawVal] of updates) {
                // Bulatkan radius ke integer sebelum disimpan
                const value = key === 'office_radius'
                    ? String(Math.round(Number(rawVal)))
                    : String(rawVal);

                await pool.query(
                    'INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
                    [key, value]
                );
            }

            // Kembalikan semua settings terbaru
            const latest = await getAllSettings();

            console.info(`[SETTINGS] Updated by admin id=${req.user.id_user}:`, Object.fromEntries(updates));

            return res.json({
                success: true,
                message: 'Pengaturan berhasil disimpan.',
                data: latest,
            });
        } catch (err) {
            console.error('[SETTINGS PUT]', err);
            return res.status(500).json({ success: false, message: 'Gagal menyimpan pengaturan.' });
        }
    }
);

module.exports = router;
