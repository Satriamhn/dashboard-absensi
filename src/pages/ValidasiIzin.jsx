import { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Clock, FileText,
    Filter, Search, AlertCircle, Loader2
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { izinAPI } from '../services/api';

const STATUS_ICON = {
    Pending: <Clock size={15} />,
    Disetujui: <CheckCircle2 size={15} />,
    Ditolak: <XCircle size={15} />,
};

const JENIS_ICON = { Sakit: '🤒', Cuti: '🌴', Dinas: '💼' };

const statusBadge = (s) => ({
    Pending: 'badge-pending', Disetujui: 'badge-hadir', Ditolak: 'badge-alpha',
}[s] || '');

export default function ValidasiIzin() {
    const { user } = useAuth();
    const [izinList, setIzinList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);
    const [filter, setFilter] = useState('Semua');
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    // Admin only guard
    if (user?.role !== 'admin') {
        return (
            <Layout title="Validasi Izin">
                <div className="access-denied">
                    <AlertCircle size={48} />
                    <h3>Akses Ditolak</h3>
                    <p>Halaman ini hanya untuk Admin.</p>
                </div>
            </Layout>
        );
    }

    // ── Fetch dari backend ────────────────────────────────
    const fetchIzin = async () => {
        setLoading(true);
        try {
            const res = await izinAPI.getAll();
            setIzinList(res.data);
        } catch (err) {
            showToast('Gagal memuat data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchIzin(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Approve / Reject via backend ──────────────────────
    const doAction = async (id, action) => {
        setActing(true);
        try {
            const status = action === 'approve' ? 'Disetujui' : 'Ditolak';
            await izinAPI.updateStatus(id, status);
            setConfirmModal(null);
            showToast(
                action === 'approve' ? '✅ Izin berhasil disetujui!' : '❌ Izin telah ditolak.',
                action === 'approve' ? 'success' : 'error'
            );
            fetchIzin(); // refresh dari backend
        } catch (err) {
            showToast(err.message || 'Gagal memproses izin.', 'error');
        } finally {
            setActing(false);
        }
    };

    const pending = izinList.filter(i => i.status === 'Pending').length;
    const approved = izinList.filter(i => i.status === 'Disetujui').length;
    const rejected = izinList.filter(i => i.status === 'Ditolak').length;

    const filtered = izinList
        .filter(i => filter === 'Semua' || i.status === filter)
        .filter(i => i.nama.toLowerCase().includes(search.toLowerCase()));

    return (
        <Layout title="Validasi Izin">
            {toast && (
                <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Summary Pills */}
            <div className="validasi-summary">
                <div className="v-pill v-pending">
                    <Clock size={18} />
                    <div>
                        <span className="v-pill-val">{pending}</span>
                        <span className="v-pill-label">Menunggu</span>
                    </div>
                </div>
                <div className="v-pill v-approved">
                    <CheckCircle2 size={18} />
                    <div>
                        <span className="v-pill-val">{approved}</span>
                        <span className="v-pill-label">Disetujui</span>
                    </div>
                </div>
                <div className="v-pill v-rejected">
                    <XCircle size={18} />
                    <div>
                        <span className="v-pill-val">{rejected}</span>
                        <span className="v-pill-label">Ditolak</span>
                    </div>
                </div>
                <div className="v-pill v-total">
                    <FileText size={18} />
                    <div>
                        <span className="v-pill-val">{izinList.length}</span>
                        <span className="v-pill-label">Total</span>
                    </div>
                </div>
            </div>

            <div className="chart-card">
                {/* Toolbar */}
                <div className="table-toolbar">
                    <div className="search-wrap">
                        <Search size={16} className="search-icon" />
                        <input
                            className="search-input"
                            placeholder="Cari nama pegawai..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filter-wrap">
                        <Filter size={16} />
                        {['Semua', 'Pending', 'Disetujui', 'Ditolak'].map(s => (
                            <button
                                key={s}
                                className={`filter-btn ${filter === s ? 'filter-active' : ''}`}
                                onClick={() => setFilter(s)}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cards Grid */}
                {loading ? (
                    <div className="loading-state" style={{ padding: '3rem 0' }}>
                        <Loader2 size={28} className="spin" />
                        <span>Memuat data izin...</span>
                    </div>
                ) : (
                    <div className="validasi-grid">
                        {filtered.length === 0 && (
                            <p className="empty-state" style={{ gridColumn: '1/-1' }}>Tidak ada data pengajuan izin</p>
                        )}
                        {filtered.map(iz => (
                            <div key={iz.id_izin} className={`validasi-card ${iz.status === 'Pending' ? 'vc-pending' : ''}`}>
                                <div className="vc-header">
                                    <div className="td-user">
                                        <div className="td-avatar">{iz.nama.split(' ').map(n => n[0]).join('')}</div>
                                        <div>
                                            <span className="vc-nama">{iz.nama}</span>
                                            <span className="vc-date">
                                                📅 {new Date(iz.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`badge ${statusBadge(iz.status)}`}>
                                        {STATUS_ICON[iz.status]} {iz.status}
                                    </span>
                                </div>

                                <div className="vc-jenis">
                                    <span className="jenis-icon">{JENIS_ICON[iz.jenis_izin]}</span>
                                    <span className="jenis-label">{iz.jenis_izin}</span>
                                </div>

                                <p className="vc-ket">"{iz.keterangan}"</p>

                                {iz.diproses_oleh_nama && (
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                        Diproses oleh: <strong>{iz.diproses_oleh_nama}</strong>
                                    </p>
                                )}

                                {iz.status === 'Pending' && (
                                    <div className="vc-actions">
                                        <button
                                            className="vc-btn vc-reject"
                                            onClick={() => setConfirmModal({ id: iz.id_izin, nama: iz.nama, action: 'reject' })}
                                        >
                                            <XCircle size={16} /> Tolak
                                        </button>
                                        <button
                                            className="vc-btn vc-approve"
                                            onClick={() => setConfirmModal({ id: iz.id_izin, nama: iz.nama, action: 'approve' })}
                                        >
                                            <CheckCircle2 size={16} /> Setujui
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            {confirmModal && (
                <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
                    <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
                        <div className={`modal-del-icon ${confirmModal.action === 'approve' ? 'icon-approve' : 'icon-reject'}`}>
                            {confirmModal.action === 'approve' ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
                        </div>
                        <h3 className="modal-title">
                            {confirmModal.action === 'approve' ? 'Setujui Izin?' : 'Tolak Izin?'}
                        </h3>
                        <p className="modal-desc">
                            {confirmModal.action === 'approve'
                                ? `Izin dari ${confirmModal.nama} akan disetujui dan dicatat sebagai Izin di absensi.`
                                : `Izin dari ${confirmModal.nama} akan ditolak.`
                            }
                        </p>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setConfirmModal(null)}>Batal</button>
                            <button
                                className={`btn-absen btn-sm ${confirmModal.action === 'reject' ? 'btn-danger' : ''}`}
                                onClick={() => doAction(confirmModal.id, confirmModal.action)}
                                disabled={acting}
                            >
                                {acting ? <Loader2 size={16} className="spin" /> : null}
                                {confirmModal.action === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
