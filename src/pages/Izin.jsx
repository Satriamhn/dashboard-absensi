import { useState, useEffect } from 'react';
import { Send, CheckCircle2, Clock, XCircle, FileText, Plus, Loader2, Trash2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { izinAPI } from '../services/api';

const STATUS_ICON = {
    Pending: <Clock size={14} />,
    Disetujui: <CheckCircle2 size={14} />,
    Ditolak: <XCircle size={14} />,
};

const statusBadge = (s) => ({
    Pending: 'badge-pending', Disetujui: 'badge-hadir', Ditolak: 'badge-alpha',
}[s] || '');

export default function Izin() {
    const { user } = useAuth();
    const [form, setForm] = useState({ jenis_izin: 'Sakit', tanggal: '', keterangan: '' });
    const [pengajuan, setPengajuan] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [toast, setToast] = useState(null);
    const [error, setError] = useState('');

    // ── Fetch data izin dari backend ─────────────────────
    const fetchIzin = async () => {
        try {
            const res = await izinAPI.getAll();
            setPengajuan(res.data);
        } catch (err) {
            showToast('Gagal memuat data izin: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIzin(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // ── Submit pengajuan izin ke backend ─────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.tanggal || !form.keterangan.trim()) {
            setError('Semua field wajib diisi!');
            return;
        }
        setError('');
        setSubmitting(true);

        try {
            await izinAPI.create({
                tanggal: form.tanggal,
                jenis_izin: form.jenis_izin,
                keterangan: form.keterangan,
            });
            setForm({ jenis_izin: 'Sakit', tanggal: '', keterangan: '' });
            setShowForm(false);
            showToast('✅ Pengajuan izin berhasil dikirim! Menunggu persetujuan.');
            fetchIzin(); // refresh data
        } catch (err) {
            showToast(err.message || 'Gagal mengirim pengajuan.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Hapus izin Pending ────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await izinAPI.delete(id);
            showToast('Pengajuan berhasil dihapus.');
            fetchIzin();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <Layout title="Pengajuan Izin">
            {toast && (
                <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                    <CheckCircle2 size={18} />
                    <span>{toast.msg}</span>
                </div>
            )}

            <div className="izin-page-grid">
                {/* Left: Form */}
                <div className="izin-form-wrap">
                    <div className="chart-card">
                        <div className="chart-header">
                            <div>
                                <h3 className="chart-title">Ajukan Izin</h3>
                                <p className="chart-sub">Isi formulir pengajuan izin</p>
                            </div>
                            <FileText size={20} className="chart-icon" />
                        </div>

                        {!showForm ? (
                            <button className="btn-absen" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
                                <Plus size={20} /> Buat Pengajuan Baru
                            </button>
                        ) : (
                            <form className="izin-form" onSubmit={handleSubmit}>
                                {error && <div className="login-error"><span>{error}</span></div>}

                                <div className="form-group">
                                    <label className="form-label">Jenis Izin</label>
                                    <select name="jenis_izin" className="form-input form-select" value={form.jenis_izin} onChange={handleChange}>
                                        <option value="Sakit">🤒 Sakit</option>
                                        <option value="Cuti">🌴 Cuti</option>
                                        <option value="Dinas">💼 Dinas</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Tanggal</label>
                                    <input type="date" name="tanggal" className="form-input" value={form.tanggal} onChange={handleChange} required />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Keterangan</label>
                                    <textarea
                                        name="keterangan"
                                        className="form-input form-textarea"
                                        placeholder="Jelaskan alasan izin..."
                                        value={form.keterangan}
                                        onChange={handleChange}
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Batal</button>
                                    <button type="submit" className="btn-absen btn-sm" disabled={submitting}>
                                        {submitting ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                                        {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="info-box">
                        <h4>📋 Ketentuan Izin</h4>
                        <ul>
                            <li>Pengajuan <strong>Sakit</strong> dilampiri surat dokter</li>
                            <li>Pengajuan <strong>Cuti</strong> minimal H-3</li>
                            <li><strong>Dinas</strong> harus disetujui atasan</li>
                            <li>Maksimal cuti tahunan: <strong>12 hari</strong></li>
                        </ul>
                    </div>
                </div>

                {/* Right: Riwayat Izin */}
                <div className="chart-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Riwayat Pengajuan</h3>
                            <p className="chart-sub">{pengajuan.length} total pengajuan</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={28} className="spin" />
                            <span>Memuat data...</span>
                        </div>
                    ) : (
                        <div className="izin-riwayat-list">
                            {pengajuan.length === 0 && <p className="empty-state">Belum ada pengajuan izin</p>}
                            {pengajuan.map(iz => (
                                <div key={iz.id_izin} className="izin-card-item">
                                    <div className="izin-card-header">
                                        <div className="izin-type-badge">
                                            {iz.jenis_izin === 'Sakit' ? '🤒' : iz.jenis_izin === 'Cuti' ? '🌴' : '💼'} {iz.jenis_izin}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className={`badge ${statusBadge(iz.status)}`}>
                                                {STATUS_ICON[iz.status]} {iz.status}
                                            </span>
                                            {iz.status === 'Pending' && (
                                                <button
                                                    className="action-btn del-btn"
                                                    onClick={() => handleDelete(iz.id_izin)}
                                                    title="Hapus pengajuan"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="izin-card-date">
                                        📅 {new Date(iz.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <p className="izin-card-ket">{iz.keterangan}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
