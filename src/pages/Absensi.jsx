import { useState, useEffect } from 'react';
import {
    MapPin, Clock, CheckCircle2, XCircle, AlertTriangle,
    Navigation, Loader2, LogIn, LogOut, Info, ShieldAlert, Camera
} from 'lucide-react';
import Layout from '../components/Layout';
import FaceCapture from '../components/FaceCapture';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { absensiAPI, faceAPI } from '../services/api';

// Kode error geolokasi
const GEO_ERRORS = {
    1: 'Izin lokasi ditolak. Aktifkan izin lokasi di browser Anda.',
    2: 'GPS tidak tersedia. Aktifkan GPS / Location Service perangkat Anda.',
    3: 'Waktu habis saat mengambil lokasi. Pastikan GPS aktif dan sinyal stabil.',
};

const MAX_ACCURACY_METERS = 150;

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

const STEPS = ['Cek Riwayat', 'Verifikasi Wajah', 'Ambil Lokasi', 'Validasi Radius', 'Simpan Kehadiran', 'Selesai'];

export default function Absensi() {
    const { user } = useAuth();
    const { settings } = useSettings();

    const OFFICE_LOCATION = {
        nama     : settings.office_name      || 'Kantor Pusat',
        latitude : parseFloat(settings.office_latitude)  || -6.200000,
        longitude: parseFloat(settings.office_longitude) || 106.816666,
        radius   : parseInt(settings.office_radius)      || 100,
    };

    const [step, setStep] = useState(-1);
    const [location, setLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [inRadius, setInRadius] = useState(null);
    const [status, setStatus] = useState(null);
    const [geoError, setGeoError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [time, setTime] = useState(new Date());
    const [absenType, setAbsenType] = useState('masuk');
    const [todayData, setTodayData] = useState(null);
    const [loadingToday, setLoadingToday] = useState(true);
    const [savedStatus, setSavedStatus] = useState('Hadir');
    const [history, setHistory] = useState([]);

    // ── State khusus face capture ──────────────────────────
    const [showFaceCapture, setShowFaceCapture] = useState(false);
    const [capturedFace, setCapturedFace] = useState(null);
    const [faceStatus, setFaceStatus] = useState(null); // null | 'ok' | 'skip' | 'gagal'
    const [faceSavedId, setFaceSavedId] = useState(null); // id dalam tabel kirim_wajah

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

    // ── Kirim foto wajah ke backend ────────────────────────
    const kirimFotoWajah = async (base64, tipe, absensiId = null) => {
        try {
            const res = await faceAPI.kirim(base64, tipe, absensiId);
            setFaceSavedId(res.data?.id || null);
            return res.data?.id || null;
        } catch (err) {
            console.warn('[FACE] Gagal kirim foto wajah:', err.message);
            return null;
        }
    };

    // ── Handler saat foto wajah diambil ───────────────────
    const handleFaceCaptured = async (base64) => {
        setCapturedFace(base64);
        setFaceStatus('ok');
        setShowFaceCapture(false);

        // Langsung kirim dulu ke backend (tanpa absensi_id, akan diupdate nanti)
        await kirimFotoWajah(base64, absenType, null);

        // Lanjutkan proses absensi
        continueAbsensi(base64);
    };

    // ── Mulai proses absensi ──────────────────────────────
    const startAbsensi = async () => {
        setStep(0);
        setStatus(null);
        setGeoError(null);
        setLoading(true);
        setCapturedFace(null);
        setFaceStatus(null);

        // ─── Step 0: Cek Riwayat ─────────────────────────
        await new Promise(r => setTimeout(r, 700));

        const isDuplikat = (absenType === 'masuk' && alreadyClockedIn) ||
            (absenType === 'keluar' && alreadyClockedOut);

        if (isDuplikat) {
            setStep(5);
            setStatus('duplikat');
            setLoading(false);
            return;
        }

        setLoading(false);

        // ─── Step 1: Tampilkan modal verifikasi wajah ─────
        setStep(1);
        setShowFaceCapture(true);
        // Proses dilanjutkan di handleFaceCaptured / handleFaceCancel
    };

    // ── Lanjutkan setelah foto wajah ──────────────────────
    const continueAbsensi = async (faceBase64) => {
        setLoading(true);

        // ─── Cek: apakah browser mendukung Geolocation ────
        if (!navigator.geolocation) {
            setGeoError('Browser Anda tidak mendukung Geolocation API.');
            setStep(5);
            setStatus('geo_error');
            setLoading(false);
            return;
        }

        // ─── Step 2: Ambil Lokasi GPS ─────────────────────
        setStep(2);
        await new Promise(r => setTimeout(r, 400));

        let loc;
        let accuracy;
        try {
            const pos = await new Promise((resolve, reject) =>
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                })
            );
            loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            accuracy = pos.coords.accuracy;
        } catch (err) {
            const msg = GEO_ERRORS[err.code] || 'Gagal mendapatkan lokasi. Pastikan GPS aktif.';
            setGeoError(msg);
            setStep(5);
            setStatus('geo_error');
            setLoading(false);
            return;
        }

        // ─── Validasi Akurasi ─────────────────────────────
        if (accuracy > MAX_ACCURACY_METERS) {
            setGeoError(
                `Akurasi GPS terlalu rendah (${Math.round(accuracy)}m). ` +
                'Pindah ke area terbuka atau nonaktifkan Fake GPS.'
            );
            setStep(5);
            setStatus('geo_error');
            setLoading(false);
            return;
        }

        setLocation({ ...loc, accuracy });

        // ─── Step 3: Validasi Radius ──────────────────────
        setStep(3);
        await new Promise(r => setTimeout(r, 700));
        const dist = Math.round(getDistanceMeters(loc.lat, loc.lon, OFFICE_LOCATION.latitude, OFFICE_LOCATION.longitude));
        const dalam = dist <= OFFICE_LOCATION.radius;
        setDistance(dist);
        setInRadius(dalam);

        // ─── Step 4: Simpan ke Backend ────────────────────
        setStep(4);
        await new Promise(r => setTimeout(r, 500));

        if (dalam) {
            try {
                const res = absenType === 'masuk'
                    ? await absensiAPI.clockIn(loc.lat, loc.lon, accuracy)
                    : await absensiAPI.clockOut(loc.lat, loc.lon, accuracy);

                const absensiId = res.data?.id_absen || null;

                // Update foto wajah dengan absensi_id yang baru tersimpan
                if (faceBase64 && absensiId) {
                    await kirimFotoWajah(faceBase64, absenType, absensiId);
                }

                setStep(5);
                setStatus('sukses');
                setSavedStatus(res.data?.status || 'Hadir');
                await fetchToday();
            } catch (err) {
                setStep(5);
                setStatus(err.message.includes('sudah') ? 'duplikat' : 'ditolak');
            }
        } else {
            setStep(5);
            setStatus('ditolak');
        }
        setLoading(false);
    };

    // ── Batal verifikasi wajah ────────────────────────────
    const handleFaceCancel = () => {
        setShowFaceCapture(false);
        reset();
    };

    const reset = () => {
        setStep(-1);
        setLocation(null);
        setDistance(null);
        setInRadius(null);
        setStatus(null);
        setGeoError(null);
        setCapturedFace(null);
        setFaceStatus(null);
        setFaceSavedId(null);
    };

    const isDisabled = (absenType === 'masuk' && alreadyClockedIn && status !== 'sukses') ||
        (absenType === 'keluar' && alreadyClockedOut && status !== 'sukses');

    return (
        <Layout title="Absensi">
            {/* Modal Face Capture */}
            {showFaceCapture && (
                <FaceCapture
                    tipe={absenType}
                    onCapture={handleFaceCaptured}
                    onCancel={handleFaceCancel}
                />
            )}

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

                        {/* Face verification badge */}
                        <div className="face-requirement-badge">
                            <Camera size={14} />
                            <span>Verifikasi wajah diperlukan untuk absensi</span>
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
                                {loadingToday ? <Loader2 size={20} className="spin" /> : <Camera size={20} />}
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
                                                : i === step && (loading || (i === 1 && showFaceCapture))
                                                    ? <Loader2 size={16} className="spin" />
                                                    : <span>{i + 1}</span>}
                                        </div>
                                        <span className="step-label">{s}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Foto wajah yang berhasil diambil */}
                        {capturedFace && step > 1 && (
                            <div className="face-captured-preview">
                                <img src={capturedFace} alt="Foto wajah" />
                                <span className="face-captured-label">
                                    <CheckCircle2 size={12} /> Foto wajah terverifikasi
                                </span>
                            </div>
                        )}

                        {/* Results */}
                        {status === 'sukses' && (
                            <div className="absen-result result-sukses">
                                <CheckCircle2 size={48} />
                                <h3>Absensi Berhasil!</h3>
                                <p>Status: <strong>{savedStatus}</strong></p>
                                <p className="result-loc">📍 {distance}m dari kantor</p>
                                {capturedFace && (
                                    <div className="result-face-wrap">
                                        <img src={capturedFace} alt="Wajah" className="result-face-img" />
                                        <span>📸 Foto wajah tersimpan</span>
                                    </div>
                                )}
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
                                <button className="btn-reset" onClick={reset}>OK</button>
                            </div>
                        )}
                        {status === 'geo_error' && (
                            <div className="absen-result result-geo-error">
                                <ShieldAlert size={48} />
                                <h3>Lokasi Tidak Dapat Diverifikasi</h3>
                                <p>{geoError}</p>
                                <ul className="geo-tips">
                                    <li>Aktifkan GPS / Location Service di pengaturan perangkat</li>
                                    <li>Berikan izin lokasi ke browser ini</li>
                                    <li>Pindah ke area dengan sinyal GPS lebih baik</li>
                                    <li>Nonaktifkan aplikasi Fake GPS jika ada</li>
                                </ul>
                                <button className="btn-reset" onClick={reset}>Coba Lagi</button>
                            </div>
                        )}

                        {/* Location Info */}
                        {location && (
                            <div className="location-info">
                                <MapPin size={14} />
                                <span>Lat: {location.lat.toFixed(6)}, Lon: {location.lon.toFixed(6)}</span>
                                {location.accuracy && (
                                    <span className="accuracy-badge">±{Math.round(location.accuracy)}m akurasi</span>
                                )}
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
                                    ['③', 'Verifikasi wajah & kirim foto', faceStatus === 'ok'],
                                    ['④', 'Kirim lokasi & waktu', history.length > 0],
                                    ['⑤', 'Simpan jam_masuk ke DB', history.length > 0],
                                    ['⑥', 'Tampil "Absensi Berhasil"', status === 'sukses'],
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
