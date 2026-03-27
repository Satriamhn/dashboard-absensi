/**
 * middleware/geoValidate.js
 * ─────────────────────────────────────────────────────────────────────────
 * Validasi koordinat GPS di sisi SERVER.
 * Konfigurasi kantor (lat, lon, radius) dibaca dari tabel `settings` di DB
 * sehingga perubahan lewat halaman Pengaturan langsung berlaku tanpa restart.
 */

'use strict';

const pool = require('../config/db');

// ── Haversine formula ─────────────────────────────────────────────────────────
function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Fallback dari env (jika DB belum punya tabel settings) ───────────────────
function getEnvOffice() {
    return {
        latitude : parseFloat(process.env.OFFICE_LATITUDE    || '-6.200000'),
        longitude: parseFloat(process.env.OFFICE_LONGITUDE   || '106.816666'),
        radius   : parseFloat(process.env.OFFICE_RADIUS_METER || '100'),
    };
}

// Ambang akurasi GPS (env tetap dipakai, tidak perlu di DB)
const MAX_ACCURACY = parseFloat(process.env.GEO_MAX_ACCURACY || '150');

// ── Batas koordinat wajar untuk Indonesia ────────────────────────────────────
const GEO_BOUNDS = {
    lat: { min: -11.0, max: 6.0 },
    lon: { min: 95.0, max: 141.5 },
};

// ── Baca settings kantor dari DB ─────────────────────────────────────────────
async function getOfficeFromDB() {
    try {
        const [rows] = await pool.query(
            "SELECT `key`, value FROM settings WHERE `key` IN ('office_latitude','office_longitude','office_radius')"
        );
        if (rows.length < 3) return getEnvOffice(); // fallback jika tabel belum ada
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
        return {
            latitude : parseFloat(map.office_latitude),
            longitude: parseFloat(map.office_longitude),
            radius   : parseFloat(map.office_radius),
        };
    } catch {
        return getEnvOffice(); // fallback jika query gagal
    }
}

/**
 * Middleware Express: validateGeo
 * Validasi: angka valid → dalam batas Indonesia → akurasi OK → dalam radius kantor
 */
async function validateGeo(req, res, next) {
    const lat      = parseFloat(req.body.latitude);
    const lon      = parseFloat(req.body.longitude);
    const accuracy = req.body.accuracy != null ? parseFloat(req.body.accuracy) : null;

    // 1. Koordinat valid? ─────────────────────────────────────────────────────
    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({
            success: false,
            code   : 'GEO_INVALID',
            message: 'Koordinat GPS tidak valid. Pastikan GPS aktif dan berikan izin lokasi.',
        });
    }

    // 2. Dalam batas Indonesia? ───────────────────────────────────────────────
    if (
        lat < GEO_BOUNDS.lat.min || lat > GEO_BOUNDS.lat.max ||
        lon < GEO_BOUNDS.lon.min || lon > GEO_BOUNDS.lon.max
    ) {
        console.warn(`[GEO REJECT] Di luar Indonesia: lat=${lat}, lon=${lon} | user=${req.user?.id_user}`);
        return res.status(400).json({
            success: false,
            code   : 'GEO_OUT_OF_BOUNDS',
            message: 'Koordinat berada di luar wilayah yang diizinkan.',
        });
    }

    // 3. Akurasi wajib ada dan tidak terlalu besar ───────────────────────────
    if (accuracy === null || isNaN(accuracy)) {
        return res.status(400).json({
            success: false,
            code   : 'GEO_ACCURACY_MISSING',
            message: 'Data akurasi GPS tidak ditemukan. Gunakan aplikasi resmi untuk absensi.',
        });
    }
    if (accuracy > MAX_ACCURACY) {
        console.warn(`[GEO REJECT] Akurasi rendah: ${accuracy}m | user=${req.user?.id_user}`);
        return res.status(400).json({
            success: false,
            code   : 'GEO_LOW_ACCURACY',
            message: `Akurasi GPS terlalu rendah (${Math.round(accuracy)}m). Pindah ke area terbuka atau nonaktifkan Fake GPS.`,
        });
    }

    // 4. Baca konfigurasi kantor dari DB (real-time) ──────────────────────────
    const OFFICE = await getOfficeFromDB();

    // 5. Hitung jarak Haversine ───────────────────────────────────────────────
    const distanceMeters = Math.round(
        getDistanceMeters(lat, lon, OFFICE.latitude, OFFICE.longitude)
    );

    if (distanceMeters > OFFICE.radius) {
        console.warn(
            `[GEO REJECT] Di luar radius: ${distanceMeters}m > ${OFFICE.radius}m | ` +
            `lat=${lat}, lon=${lon} | user=${req.user?.id_user}`
        );
        return res.status(400).json({
            success : false,
            code    : 'GEO_OUT_OF_RADIUS',
            message : `Lokasi Anda terlalu jauh dari kantor (${distanceMeters}m). Maksimum ${OFFICE.radius}m.`,
            data    : { distance_meter: distanceMeters, max_radius: OFFICE.radius },
        });
    }

    // 6. Semua lolos ──────────────────────────────────────────────────────────
    req.geoInfo = { latitude: lat, longitude: lon, accuracy, distance_meter: distanceMeters, office: OFFICE };
    console.info(`[GEO OK] ${distanceMeters}m dari kantor | lat=${lat}, lon=${lon} | user=${req.user?.id_user}`);
    next();
}

module.exports = { validateGeo, getDistanceMeters, MAX_ACCURACY };
