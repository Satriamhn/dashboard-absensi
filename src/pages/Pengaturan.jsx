import { useState, useEffect } from 'react';
import {
    Building2, MapPin, Ruler, Save, RotateCcw, CheckCircle2,
    AlertCircle, Loader2, Settings2, Globe, ShieldCheck, Info
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import '../settings.css';

// Peta Indonesia default untuk preview mini
const MAPS_PREVIEW = (lat, lon) =>
    `https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.005},${lat - 0.005},${lon + 0.005},${lat + 0.005}&layer=mapnik&marker=${lat},${lon}`;

export default function Pengaturan() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { settings, updateSettings, loading: settingsLoading } = useSettings();

    const [form, setForm] = useState({
        company_name    : '',
        office_name     : '',
        office_latitude : '',
        office_longitude: '',
        office_radius   : '',
    });

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
    const [dirty, setDirty] = useState(false);

    // Guard: hanya admin
    useEffect(() => {
        if (user && user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [user, navigate]);

    // Sync form dengan settings dari context
    useEffect(() => {
        if (!settingsLoading) {
            setForm({
                company_name    : settings.company_name     || '',
                office_name     : settings.office_name      || '',
                office_latitude : settings.office_latitude  || '',
                office_longitude: settings.office_longitude || '',
                office_radius   : settings.office_radius    || '',
            });
        }
    }, [settings, settingsLoading]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setDirty(true);
    };

    const handleReset = () => {
        setForm({
            company_name    : settings.company_name     || '',
            office_name     : settings.office_name      || '',
            office_latitude : settings.office_latitude  || '',
            office_longitude: settings.office_longitude || '',
            office_radius   : settings.office_radius    || '',
        });
        setDirty(false);
    };

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validasi sederhana
        const lat = parseFloat(form.office_latitude);
        const lon = parseFloat(form.office_longitude);
        const radius = parseInt(form.office_radius);

        if (!form.company_name.trim()) return showToast('error', 'Nama perusahaan tidak boleh kosong.');
        if (isNaN(lat) || lat < -90 || lat > 90) return showToast('error', 'Latitude harus antara -90 dan 90.');
        if (isNaN(lon) || lon < -180 || lon > 180) return showToast('error', 'Longitude harus antara -180 dan 180.');
        if (isNaN(radius) || radius < 10 || radius > 5000) return showToast('error', 'Radius harus antara 10 dan 5000 meter.');

        setSaving(true);
        try {
            await updateSettings(form);
            setDirty(false);
            showToast('success', 'Pengaturan berhasil disimpan dan langsung berlaku!');
        } catch (err) {
            showToast('error', err.message || 'Gagal menyimpan pengaturan.');
        } finally {
            setSaving(false);
        }
    };

    const lat = parseFloat(form.office_latitude) || -6.2;
    const lon = parseFloat(form.office_longitude) || 106.816666;
    const mapsUrl = MAPS_PREVIEW(lat, lon);

    if (settingsLoading) {
        return (
            <Layout title="Pengaturan">
                <div className="loading-state" style={{ minHeight: '60vh' }}>
                    <Loader2 size={40} className="spin" />
                    <span>Memuat pengaturan...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Pengaturan">
            {/* Toast notification */}
            {toast && (
                <div className={`settings-toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 size={18} />
                        : <AlertCircle size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Page Header */}
            <div className="settings-page-header">
                <div className="settings-header-left">
                    <div className="settings-header-icon">
                        <Settings2 size={24} />
                    </div>
                    <div>
                        <h2 className="settings-page-title">Pengaturan Sistem</h2>
                        <p className="settings-page-sub">
                            Konfigurasi nama perusahaan dan lokasi kantor untuk validasi absensi
                        </p>
                    </div>
                </div>
                <div className="settings-header-badge">
                    <ShieldCheck size={14} />
                    Admin Only
                </div>
            </div>

            <form onSubmit={handleSubmit} className="settings-form-grid">
                {/* Kiri: Form */}
                <div className="settings-left">
                    {/* Section: Identitas Perusahaan */}
                    <div className="chart-card settings-section">
                        <div className="settings-section-header">
                            <Building2 size={18} />
                            <span>Identitas Perusahaan</span>
                        </div>
                        <p className="settings-section-desc">
                            Nama perusahaan akan ditampilkan di sidebar dan header aplikasi
                        </p>

                        <div className="settings-field">
                            <label className="settings-label" htmlFor="company_name">
                                Nama Perusahaan <span className="field-required">*</span>
                            </label>
                            <input
                                id="company_name"
                                name="company_name"
                                type="text"
                                className="settings-input"
                                value={form.company_name}
                                onChange={handleChange}
                                placeholder="Contoh: PT Absensi Indonesia"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    {/* Section: Lokasi Kantor */}
                    <div className="chart-card settings-section">
                        <div className="settings-section-header">
                            <MapPin size={18} />
                            <span>Lokasi Kantor</span>
                        </div>
                        <p className="settings-section-desc">
                            Koordinat ini digunakan oleh server untuk memvalidasi lokasi absensi pegawai
                        </p>

                        <div className="settings-field">
                            <label className="settings-label" htmlFor="office_name">Nama Lokasi</label>
                            <input
                                id="office_name"
                                name="office_name"
                                type="text"
                                className="settings-input"
                                value={form.office_name}
                                onChange={handleChange}
                                placeholder="Contoh: Kantor Pusat Jakarta"
                                maxLength={100}
                            />
                        </div>

                        <div className="settings-row-2">
                            <div className="settings-field">
                                <label className="settings-label" htmlFor="office_latitude">
                                    Latitude <span className="field-required">*</span>
                                </label>
                                <input
                                    id="office_latitude"
                                    name="office_latitude"
                                    type="number"
                                    step="any"
                                    className="settings-input"
                                    value={form.office_latitude}
                                    onChange={handleChange}
                                    placeholder="-6.200000"
                                />
                                <span className="field-hint">Antara -90 hingga 90</span>
                            </div>

                            <div className="settings-field">
                                <label className="settings-label" htmlFor="office_longitude">
                                    Longitude <span className="field-required">*</span>
                                </label>
                                <input
                                    id="office_longitude"
                                    name="office_longitude"
                                    type="number"
                                    step="any"
                                    className="settings-input"
                                    value={form.office_longitude}
                                    onChange={handleChange}
                                    placeholder="106.816666"
                                />
                                <span className="field-hint">Antara -180 hingga 180</span>
                            </div>
                        </div>

                        <div className="settings-field">
                            <label className="settings-label" htmlFor="office_radius">
                                Radius Absensi (meter) <span className="field-required">*</span>
                            </label>
                            <div className="radius-input-wrap">
                                <input
                                    id="office_radius"
                                    name="office_radius"
                                    type="number"
                                    min="10"
                                    max="5000"
                                    className="settings-input"
                                    value={form.office_radius}
                                    onChange={handleChange}
                                    placeholder="100"
                                />
                                <Ruler size={16} className="radius-icon" />
                            </div>
                            <span className="field-hint">
                                Pegawai harus berada dalam radius ini dari koordinat kantor untuk bisa absen (<strong>{form.office_radius || 100}m</strong>)
                            </span>
                        </div>

                        {/* Info Banner */}
                        <div className="settings-info-box">
                            <Info size={14} />
                            <span>
                                Cara mendapatkan koordinat: buka <a href="https://maps.google.com" target="_blank" rel="noreferrer">Google Maps</a>,
                                klik lokasi kantor, koordinat muncul di bagian bawah layar.
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="settings-actions">
                        <button
                            type="button"
                            className="btn-settings-reset"
                            onClick={handleReset}
                            disabled={!dirty || saving}
                        >
                            <RotateCcw size={16} />
                            Reset
                        </button>
                        <button
                            type="submit"
                            className="btn-settings-save"
                            disabled={saving || !dirty}
                        >
                            {saving
                                ? <><Loader2 size={16} className="spin" />Menyimpan...</>
                                : <><Save size={16} />Simpan Pengaturan</>}
                        </button>
                    </div>
                </div>

                {/* Kanan: Preview Map */}
                <div className="settings-right">
                    <div className="chart-card settings-map-card">
                        <div className="settings-section-header">
                            <Globe size={18} />
                            <span>Preview Lokasi Kantor</span>
                        </div>
                        <p className="settings-section-desc">
                            Peta diperbarui saat latitude/longitude diubah
                        </p>

                        <div className="map-preview-wrap">
                            <iframe
                                key={`${lat}-${lon}`}
                                src={mapsUrl}
                                title="Peta Lokasi Kantor"
                                className="map-iframe"
                                loading="lazy"
                                sandbox="allow-scripts allow-same-origin"
                            />
                            <div className="map-overlay-info">
                                <MapPin size={14} />
                                <span>{lat.toFixed(6)}, {lon.toFixed(6)}</span>
                            </div>
                        </div>

                        {/* Radius indicator */}
                        <div className="radius-indicator">
                            <div className="radius-ring" style={{ '--r': `${Math.min(parseInt(form.office_radius) || 100, 5000) / 50}px` }} />
                            <div className="radius-info">
                                <span className="radius-label">Radius Absensi</span>
                                <span className="radius-value">{form.office_radius || 100} meter</span>
                            </div>
                        </div>

                        {/* Summary card */}
                        <div className="settings-summary">
                            <div className="summary-row">
                                <span className="sum-label">Perusahaan</span>
                                <span className="sum-val">{form.company_name || '—'}</span>
                            </div>
                            <div className="summary-row">
                                <span className="sum-label">Lokasi</span>
                                <span className="sum-val">{form.office_name || '—'}</span>
                            </div>
                            <div className="summary-row">
                                <span className="sum-label">Koordinat</span>
                                <span className="sum-val">{lat.toFixed(4)}, {lon.toFixed(4)}</span>
                            </div>
                            <div className="summary-row">
                                <span className="sum-label">Radius</span>
                                <span className="sum-val">{form.office_radius || 100} m</span>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </Layout>
    );
}
