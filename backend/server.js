require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ─── Import Routes ────────────────────────────────────
const authRoutes = require('./routes/auth');
const absensiRoutes = require('./routes/absensi');
const izinRoutes = require('./routes/izin');
const usersRoutes = require('./routes/users');
const laporanRoutes = require('./routes/laporan');
const settingsRoutes = require('./routes/settings');
const faceRoutes = require('./routes/face');
const initDB = require('./config/initDB');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware Global ────────────────────────────────
// Daftar origin yang selalu diizinkan (production + development)
const WHITELISTED = [
    'https://absensiprofe.vercel.app',  // production Vercel
    'http://localhost:5173',             // dev Vite
    'http://localhost:3000',             // dev alternatif
];

const allowedOrigins = [
    ...WHITELISTED,
    // Tambahan dari env var (pisahkan dengan koma jika lebih dari satu)
    ...(process.env.FRONTEND_URL
        ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
        : []),
];

app.use(cors({
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (mobile app, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        console.warn(`[CORS] Origin ditolak: ${origin}`);
        callback(new Error(`CORS: origin '${origin}' tidak diizinkan`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (Dev only) ────────────────────────
if (process.env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
        const now = new Date().toLocaleTimeString('id-ID', { hour12: false, timeZone: 'Asia/Jakarta' });
        console.log(`[${now}] ${req.method.padEnd(6)} ${req.path}`);
        next();
    });
}

// ─── Mount API Routes ─────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/absensi', absensiRoutes);
app.use('/api/izin', izinRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/face', faceRoutes);

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        message: '🟢 AbsensiPro API berjalan dengan baik',
        version: '1.0.0',
        uptime: `${Math.floor(process.uptime())}s`,
        time: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    });
});

// ─── 404 Handler ──────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// ─── Global Error Handler ─────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[SERVER ERROR]', err.stack);
    res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan internal server.',
        ...(process.env.NODE_ENV === 'development' && { error: err.message }),
    });
});

// ─── Start Server ─────────────────────────────────────
app.listen(PORT, async () => {
    await initDB(); // buat tabel settings jika belum ada
    console.log('');
    console.log('╔══════════════════════════════════════╗');
    console.log('║       AbsensiPro API Server          ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  🚀 Port    : ${PORT}                     ║`);
    console.log(`║  🌐 Mode    : ${process.env.NODE_ENV || 'development'}             ║`);
    console.log(`║  📦 DB      : ${process.env.DB_NAME}           ║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('');
    console.log('  Endpoints:');
    console.log('  POST   /api/auth/login');
    console.log('  GET    /api/auth/me');
    console.log('  GET    /api/absensi');
    console.log('  GET    /api/absensi/today');
    console.log('  POST   /api/absensi');
    console.log('  GET    /api/absensi/summary');
    console.log('  GET    /api/izin');
    console.log('  POST   /api/izin');
    console.log('  PUT    /api/izin/:id/status');
    console.log('  GET    /api/users');
    console.log('  POST   /api/users');
    console.log('  PUT    /api/users/:id');
    console.log('  DELETE /api/users/:id');
    console.log('  GET    /api/laporan/rekap-harian');
    console.log('  GET    /api/laporan/rekap-bulanan');
    console.log('  GET    /api/laporan/per-pegawai');
    console.log('  GET    /api/laporan/export');
    console.log('  GET    /api/health');
    console.log('');
});

module.exports = app;
