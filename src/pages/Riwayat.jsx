import { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { absensiAPI } from '../services/api';

const statusBadge = (s) => ({
    Hadir: 'badge-hadir', Telat: 'badge-telat', Izin: 'badge-izin', Alpha: 'badge-alpha',
}[s] || '');

const PAGE_SIZE = 10;

export default function Riwayat() {
    const { user } = useAuth();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Semua');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // ── Fetch dari backend (server-side pagination) ────────
    const fetchData = async (p = 1, s = '', status = 'Semua') => {
        setLoading(true);
        try {
            const params = { page: p, limit: PAGE_SIZE };
            if (status !== 'Semua') params.status = status;
            // Note: backend filters by user automatically for pegawai role
            const res = await absensiAPI.getAll(params);
            // Filter by search client-side (nama)
            const filtered = s
                ? res.data.filter(a => a.nama.toLowerCase().includes(s.toLowerCase()))
                : res.data;
            setData(filtered);
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            console.error('Gagal memuat riwayat:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(page, search, filterStatus);
    }, [page, filterStatus]);

    // Search on debounce
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchData(1, search, filterStatus);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    // ── Summary dari data yang tampil ─────────────────────
    const summary = {
        Hadir: data.filter(a => a.status === 'Hadir').length,
        Telat: data.filter(a => a.status === 'Telat').length,
        Izin: data.filter(a => a.status === 'Izin').length,
        Alpha: data.filter(a => a.status === 'Alpha').length,
    };

    // ── Export CSV langsung dari backend ──────────────────
    const handleExport = () => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/laporan/export`;
        // Buat link download
        const a = document.createElement('a');
        a.href = url;
        a.setAttribute('download', 'riwayat_absensi.csv');
        // Fetch dengan auth header
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                a.href = blobUrl;
                a.click();
                URL.revokeObjectURL(blobUrl);
            })
            .catch(() => {
                // Fallback: export dari data lokal
                const csv = [
                    ['Nama', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Status'],
                    ...data.map(a => [a.nama, a.tanggal, a.jam_masuk || '-', a.jam_keluar || '-', a.status]),
                ].map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                a.href = URL.createObjectURL(blob);
                a.download = 'riwayat_absensi.csv';
                a.click();
            });
    };

    return (
        <Layout title="Riwayat Absensi">
            {/* Summary Chips */}
            <div className="riwayat-summary">
                {Object.entries(summary).map(([k, v]) => (
                    <div key={k} className={`summary-chip chip-${k.toLowerCase()}`}>
                        <span className="chip-val">{v}</span>
                        <span className="chip-label">{k}</span>
                    </div>
                ))}
                <div className="summary-chip" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
                    <span className="chip-val">{total}</span>
                    <span className="chip-label">Total Record</span>
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
                        {['Semua', 'Hadir', 'Telat', 'Izin', 'Alpha'].map(s => (
                            <button
                                key={s}
                                className={`filter-btn ${filterStatus === s ? 'filter-active' : ''}`}
                                onClick={() => { setFilterStatus(s); setPage(1); }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <button className="btn-export" onClick={handleExport}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-state" style={{ padding: '3rem 0' }}>
                            <Loader2 size={28} className="spin" />
                            <span>Memuat data...</span>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Pegawai</th>
                                    <th>Tanggal</th>
                                    <th>Jam Masuk</th>
                                    <th>Jam Keluar</th>
                                    <th>Status</th>
                                    <th>Koordinat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan="7" className="empty-td">Tidak ada data ditemukan</td></tr>
                                ) : (
                                    data.map((a, i) => (
                                        <tr key={a.id_absen}>
                                            <td className="td-num">{(page - 1) * PAGE_SIZE + i + 1}</td>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">{a.nama.split(' ').map(n => n[0]).join('')}</div>
                                                    <div>
                                                        <span>{a.nama}</span>
                                                        {a.jabatan && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.jabatan}</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td><span className={!a.jam_masuk ? 'text-muted' : ''}>{a.jam_masuk || '—'}</span></td>
                                            <td><span className={!a.jam_keluar ? 'text-muted' : ''}>{a.jam_keluar || '—'}</span></td>
                                            <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                                            <td className="text-muted td-loc">
                                                {a.latitude ? `${a.latitude}, ${a.longitude}` : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {!loading && (
                    <div className="pagination">
                        <span className="page-info">
                            Halaman {page} dari {totalPages} — {total} total record
                        </span>
                        <div className="page-btns">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                return (
                                    <button key={p} className={`page-btn ${page === p ? 'page-active' : ''}`} onClick={() => setPage(p)}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button className="page-btn" disabled={page === totalPages || totalPages === 0} onClick={() => setPage(p => p + 1)}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
