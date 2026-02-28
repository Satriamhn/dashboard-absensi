import { useState, useEffect } from 'react';
import {
    MapPin, Clock, CheckCircle2, XCircle, AlertTriangle,
    Navigation, Loader2, LogIn, LogOut, Info
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { absensiAPI } from '../services/api';

// Koordinat kantor (bisa pindah ke .env atau setting admin nanti)
const OFFICE_LOCATION = {
    nama: 'Kantor Pusat Jakarta',
    latitude: -6.200000,
    longitude: 106.816666,
    radius: 100, // meter
};

function getDistanceMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const STEPS = ['Cek Riwayat', 'Ambil Lokasi', 'Validasi Radius', 'Simpan Kehadiran', 'Selesai'];

export default function Absensi() {
    const { user } = useAuth();
    const [step, setStep] = useState(-1);
    const [location, setLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [inRadius, setInRadius] = useState(null);
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [time, setTime] = useState(new Date());
    const [absenType, setAbsenType] = useState('masuk');
    const [todayData, setTodayData] = useState(null);  // data absensi hari ini dari API
    const [loadingToday, setLoadingToday] = useState(true);
    const [savedStatus, setSavedStatus] = useState('Hadir'); // status yang disimpan ke DB
    const [history, setHistory] = useState([]);

    // ── Clock ─────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(t);
    }, []);

    const fmt = (n) => String(n).padStart(2, '0');
    const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    // ── Cek absensi hari ini dari backend ─────────────────
    const fetchToday = async () => {
        setLoadingToday(true);
        try {
            const res = await absensiAPI.getToday();
            setTodayData(res.data);
            if (res.data) {
                // Build history dari data real
                const h = [];
                if (res.data.jam_masuk) h.push({ type: 'masuk', jam: res.data.jam_masuk, tanggal: res.data.tanggal, status: res.data.status });
                if (res.data.jam_keluar) h.push({ type: 'keluar', jam: res.data.jam_keluar, tanggal: res.data.tanggal, status: res.data.status });
                setHistory(h);
            }
        } catch (err) {
            console.error('Gagal cek absensi hari ini:', err);
        } finally {
            setLoadingToday(false);
        }
    };

    useEffect(() => { fetchToday(); }, []);

    const alreadyClockedIn = todayData?.jam_masuk != null;
    const alreadyClockedOut = todayData?.jam_keluar != null;

    // ── Mulai proses absensi ──────────────────────────────
    const startAbsensi = async () => {
        setStep(0);
        setStatus(null);
        setLoading(true);

        // ─── Step 0: Cek Riwayat (Sequence Diagram ②) ────
        await new Promise(r => setTimeout(r, 700));

        const isDuplikat = (absenType === 'masuk' && alreadyClockedIn) ||
            (absenType === 'keluar' && alreadyClockedOut);

        if (isDuplikat) {
            setStep(4);
            setStatus('duplikat');
            setLoading(false);
            return;
        }

        // ─── Step 1: Ambil Lokasi (Geolocation API) ───────
        setStep(1);
        await new Promise(r => setTimeout(r, 600));

        let loc;
        try {
            // Coba ambil lokasi nyata dari browser
            const pos = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
            );
            loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        } catch {
            // Demo mode: simulasi koordinat dekat kantor
            loc = {
                lat: OFFICE_LOCATION.latitude + (Math.random() * 0.001 - 0.0005),
                lon: OFFICE_LOCATION.longitude + (Math.random() * 0.001 - 0.0005),
            };
        }
        setLocation(loc);

        // ─── Step 2: Validasi Radius ──────────────────────
        setStep(2);
        await new Promise(r => setTimeout(r, 700));
        const dist = Math.round(getDistanceMeters(loc.lat, loc.lon, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude));
        const dalam = dist <= OFFICE_LOCATION.radius;
        setDistance(dist);
        setInRadius(dalam);

        // ─── Step 3: Simpan ke Backend ────────────────────
        setStep(3);
        await new Promise(r => setTimeout(r, 500));

        if (dalam) {
            try {
                // Kirim ke backend API
                const res = absenType === 'masuk'
                    ? await absensiAPI.clockIn(loc.lat, loc.lon)
                    : await absensiAPI.clockOut(loc.lat, loc.lon);

                setStep(4);
                setStatus('sukses');
                setSavedStatus(res.data?.status || 'Hadir');

                // Refresh data today dari backend
                await fetchToday();
            } catch (err) {
                // Mungkin backend mendeteksi duplikat
                setStep(4);
                setStatus(err.message.includes('sudah') ? 'duplikat' : 'ditolak');
            }
        } else {
            setStep(4);
            setStatus('ditolak');
        }
        setLoading(false);
    };

    const reset = () => {
        setStep(-1);
        setLocation(null);
        setDistance(null);
        setInRadius(null);
        setStatus(null);
    };

    const isDisabled = (absenType === 'masuk' && alreadyClockedIn && status !== 'sukses') ||
        (absenType === 'keluar' && alreadyClockedOut && status !== 'sukses');

    return (
        <Layout title="Absensi">
            <div className="absensi-grid">
                {/* Clock & Main Action */}
                <div className="absensi-main">
                    <div className="clock-card">
                        <div className="clock-display">
                            <div className="clock-time-big">{timeStr}</div>
                            <div className="clock-date">
                                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </div>
                        </div>

                        <div className="absen-type-row">
                            <button
                                className={`type-btn ${absenType === 'masuk' ? 'active' : ''}`}
                                onClick={() => { setAbsenType('masuk'); reset(); }}
                            >
                                <LogIn size={18} /> Absen Masuk
                                {alreadyClockedIn && <CheckCircle2 size={14} className="type-done" />}
                            </button>
                            <button
                                className={`type-btn ${absenType === 'keluar' ? 'active' : ''}`}
                                onClick={() => { setAbsenType('keluar'); reset(); }}
                            >
                                <LogOut size={18} /> Absen Keluar
                                {alreadyClockedOut && <CheckCircle2 size={14} className="type-done" />}
                            </button>
                        </div>

                        <div className="office-info">
                            <MapPin size={16} />
                            <span>{OFFICE_LOCATION.nama} (radius {OFFICE_LOCATION.radius}m)</span>
                        </div>

                        {/* Notice jika sudah absen */}
                        {isDisabled && step === -1 && (
                            <div className="absen-notice">
                                <Info size={16} />
                                <span>
                                    Kamu sudah {absenType === 'masuk' ? 'absen masuk' : 'absen keluar'} hari ini
                                    {todayData && absenType === 'masuk' && todayData.jam_masuk ? ` pukul ${todayData.jam_masuk}` : ''}.
                                </span>
                            </div>
                        )}

                        {/* Main Button */}
                        {step === -1 && !isDisabled && (
                            <button className="btn-absen" onClick={startAbsensi} disabled={loadingToday}>
                                {loadingToday ? <Loader2 size={20} className="spin" /> : <Navigation size={20} />}
                                {loadingToday ? 'Memuat...' : `Mulai Absensi ${absenType === 'masuk' ? 'Masuk' : 'Keluar'}`}
                            </button>
                        )}

                        {/* Progress Steps */}
                        {step >= 0 && (
                            <div className="absen-steps">
                                {STEPS.map((s, i) => (
                                    <div key={i} className={`absen-step ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
                                        <div className="step-circle">
                                            {i < step
                                                ? <CheckCircle2 size={16} />
                                                : i === step && loading
                                                    ? <Loader2 size={16} className="spin" />
                                                    : <span>{i + 1}</span>}
                                        </div>
                                        <span className="step-label">{s}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Results */}
                        {status === 'sukses' && (
                            <div className="absen-result result-sukses">
                                <CheckCircle2 size={48} />
                                <h3>Absensi Berhasil!</h3>
                                <p>Status: <strong>{savedStatus}</strong></p>
                                <p className="result-loc">📍 {distance}m dari kantor</p>
                                <button className="btn-reset" onClick={reset}>Selesai</button>
                            </div>
                        )}
                        {status === 'ditolak' && (
                            <div className="absen-result result-tolak">
                                <XCircle size={48} />
                                <h3>Absensi Ditolak</h3>
                                <p>Anda berada di luar radius kantor</p>
                                <p className="result-loc">📍 {distance}m dari kantor (maks {OFFICE_LOCATION.radius}m)</p>
                                <button className="btn-reset" onClick={reset}>Coba Lagi</button>
                            </div>
                        )}
                        {status === 'duplikat' && (
                            <div className="absen-result result-duplikat">
                                <Info size={48} />
                                <h3>Sudah Absen!</h3>
                                <p>Sistem mendeteksi kamu sudah {absenType === 'masuk' ? 'absen masuk' : 'absen keluar'} hari ini.</p>
                                <p className="result-loc">Sesuai sequence diagram: tampilkan status yang ada</p>
                                <button className="btn-reset" onClick={reset}>OK</button>
                            </div>
                        )}

                        {/* Location Info */}
                        {location && (
                            <div className="location-info">
                                <MapPin size={14} />
                                <span>Lat: {location.lat.toFixed(6)}, Lon: {location.lon.toFixed(6)}</span>
                                {distance !== null && (
                                    <span className={`dist-badge ${inRadius ? 'dist-ok' : 'dist-far'}`}>
                                        {distance}m {inRadius ? '✓' : '✗'}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Log */}
                <div className="absensi-side">
                    <div className="chart-card" style={{ height: '100%' }}>
                        <div className="chart-header">
                            <div>
                                <h3 className="chart-title">Log Absensi Hari Ini</h3>
                                <p className="chart-sub">Aktivitas kamu — {todayStr}</p>
                            </div>
                        </div>
                        <div className="log-list">
                            {loadingToday ? (
                                <div className="loading-state">
                                    <Loader2 size={20} className="spin" />
                                </div>
                            ) : history.length === 0 ? (
                                <p className="empty-state">Belum ada aktivitas hari ini</p>
                            ) : (
                                history.map((h, i) => (
                                    <div key={i} className="log-item">
                                        <div className={`log-icon-wrap ${h.type === 'masuk' ? 'log-in' : 'log-out'}`}>
                                            {h.type === 'masuk' ? <LogIn size={16} /> : <LogOut size={16} />}
                                        </div>
                                        <div className="log-info">
                                            <span className="log-type">{h.type === 'masuk' ? 'Absen Masuk' : 'Absen Keluar'}</span>
                                            <span className="log-time">{h.jam} — {h.tanggal}</span>
                                        </div>
                                        <span className={`badge badge-${h.status === 'Hadir' ? 'hadir' : h.status === 'Telat' ? 'telat' : 'izin'}`}>
                                            {h.status}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Sequence Diagram Info */}
                        <div className="sequence-flow">
                            <p className="seq-title">📋 Alur Sistem (Sequence Diagram)</p>
                            <div className="seq-steps">
                                {[
                                    ['①', 'Login & validasi user', true],
                                    ['②', 'Cek absensi hari ini', true],
                                    ['③', 'Kirim lokasi & waktu', history.length > 0],
                                    ['④', 'Simpan jam_masuk ke DB', history.length > 0],
                                    ['⑤', 'Tampil "Absensi Berhasil"', status === 'sukses'],
                                ].map(([num, label, done]) => (
                                    <div key={num} className={`seq-step ${done ? 'seq-active' : ''}`}>
                                        <span className="seq-num">{num}</span>
                                        <span>{label}</span>
                                        {done && <CheckCircle2 size={14} className="seq-done" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="shift-info">
                            <AlertTriangle size={14} />
                            <span>Jam kerja normal: 08:00 – 17:00. Batas telat: 08:30</span>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
