import { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    Download, TrendingUp, Users, UserCheck, AlertCircle,
    FileSpreadsheet, Calendar, BarChart2, Loader2, RefreshCw
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { laporanAPI } from '../services/api';

const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444'];
const TOOLTIP_STYLE = { background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc' };

export default function Laporan() {
    const { user } = useAuth();

    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [perPegawai, setPerPegawai] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAll = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const [harian, bulanan, pegawai] = await Promise.all([
                laporanAPI.rekapHarian(),
                laporanAPI.rekapBulanan(),
                laporanAPI.perPegawai(),
            ]);

            setSummary(harian.data);
            setMonthlyData(bulanan.data);
            setPerPegawai(pegawai.data);
        } catch (err) {
            console.error('Gagal memuat laporan:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { 
        if (user?.role === 'admin') {
            fetchAll(); 
        }
    }, [user?.role]);

    if (user?.role !== 'admin') {
        return (
            <Layout title="Laporan">
                <div className="access-denied">
                    <AlertCircle size={48} />
                    <h3>Akses Ditolak</h3>
                    <p>Halaman ini hanya untuk Admin.</p>
                </div>
            </Layout>
        );
    }

    // ── Pie data dari rekap harian ────────────────────────
    const pieData = summary ? [
        { name: 'Hadir', value: Number(summary.hadir) || 0 },
        { name: 'Telat', value: Number(summary.telat) || 0 },
        { name: 'Izin', value: Number(summary.izin) || 0 },
        { name: 'Alpha', value: Number(summary.alpha) || 0 },
    ] : [];

    // ── Export CSV via backend ────────────────────────────
    const handleExport = () => {
        const token = localStorage.getItem('token');
        const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/laporan/export`;
        fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.blob())
            .then(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'laporan_absensi.csv';
                a.click();
            })
            .catch(() => {
                // fallback: export dari data lokal
                const rows = [
                    ['Nama', 'Jabatan', 'Hadir', 'Telat', 'Izin', 'Alpha', '% Kehadiran'],
                    ...perPegawai.map(p => [p.nama, p.jabatan, p.hadir, p.telat, p.izin, p.alpha, p.pct_hadir + '%']),
                ];
                const csv = rows.map(r => r.join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'laporan_absensi.csv';
                a.click();
            });
    };

    if (loading) {
        return (
            <Layout title="Laporan Kehadiran">
                <div className="loading-state" style={{ minHeight: '60vh' }}>
                    <Loader2 size={40} className="spin" />
                    <span>Memuat data laporan...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Laporan Kehadiran">
            {/* Header */}
            <div className="laporan-toolbar">
                <div>
                    <h2 className="laporan-main-title">Laporan Rekap Absensi</h2>
                    <p className="chart-sub">Data kehadiran seluruh pegawai — realtime dari database</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn-export" onClick={() => fetchAll(true)} disabled={refreshing}>
                        {refreshing ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                        Refresh
                    </button>
                    <button className="btn-export" onClick={handleExport}>
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card" style={{ '--accent': '#8b5cf6' }}>
                    <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}><Users size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Total Pegawai</span>
                        <span className="stat-value">{summary?.total_pegawai ?? '—'}</span>
                    </div>
                </div>
                <div className="stat-card" style={{ '--accent': '#22c55e' }}>
                    <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}><UserCheck size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Hadir Hari Ini</span>
                        <span className="stat-value">{(Number(summary?.hadir) + Number(summary?.telat)) || 0}</span>
                    </div>
                </div>
                <div className="stat-card" style={{ '--accent': '#f59e0b' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}><Calendar size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Belum Absen</span>
                        <span className="stat-value">{summary?.belum_absen ?? 0}</span>
                    </div>
                </div>
                <div className="stat-card" style={{ '--accent': '#3b82f6' }}>
                    <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><FileSpreadsheet size={22} /></div>
                    <div className="stat-info">
                        <span className="stat-label">Izin / Alpha</span>
                        <span className="stat-value">{(Number(summary?.izin) + Number(summary?.alpha)) || 0}</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row" style={{ marginBottom: '1.5rem' }}>
                {/* Monthly Bar Chart */}
                <div className="chart-card chart-main">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Tren Kehadiran 6 Bulan</h3>
                            <p className="chart-sub">Hadir vs Telat vs Izin vs Alpha</p>
                        </div>
                        <TrendingUp size={20} className="chart-icon" />
                    </div>
                    {monthlyData.length === 0 ? (
                        <div className="loading-state"><span>Belum ada data bulanan</span></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="bulan" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                <Bar dataKey="hadir" name="Hadir" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="telat" name="Telat" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="izin" name="Izin" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="alpha" name="Alpha" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Hari Ini */}
                <div className="chart-card chart-side">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Distribusi Hari Ini</h3>
                            <p className="chart-sub">Komposisi kehadiran</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                        {pieData.map((p, i) => (
                            <div key={p.name} className="pie-legend-item">
                                <span className="pie-dot" style={{ background: PIE_COLORS[i] }} />
                                <span>{p.name}</span>
                                <span className="pie-val">{p.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Area Chart Hadir vs Alpha */}
            <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Grafik Tren Hadir vs Alpha</h3>
                        <p className="chart-sub">Area chart 6 bulan terakhir</p>
                    </div>
                    <BarChart2 size={20} className="chart-icon" />
                </div>
                {monthlyData.length === 0 ? (
                    <div className="loading-state"><span>Belum ada data</span></div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="lH" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="lT" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="bulan" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(148,163,184,0.2)' }} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#22c55e" fill="url(#lH)" strokeWidth={2} />
                            <Area type="monotone" dataKey="alpha" name="Alpha" stroke="#ef4444" fill="url(#lT)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Per-Pegawai Table */}
            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Rekap Per Pegawai</h3>
                        <p className="chart-sub">{perPegawai.length} pegawai — total kehadiran dari semua waktu</p>
                    </div>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Pegawai</th>
                                <th>Jabatan</th>
                                <th>Hadir</th>
                                <th>Telat</th>
                                <th>Izin</th>
                                <th>Alpha</th>
                                <th>% Kehadiran</th>
                            </tr>
                        </thead>
                        <tbody>
                            {perPegawai.length === 0 ? (
                                <tr><td colSpan="8" className="empty-td">Belum ada data</td></tr>
                            ) : (
                                perPegawai.map((p, i) => {
                                    const pct = Number(p.pct_hadir) || 0;
                                    const barColor = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                                    const initials = p.nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                    return (
                                        <tr key={p.id_user}>
                                            <td className="td-num">{i + 1}</td>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">{initials}</div>
                                                    <div>
                                                        <span>{p.nama}</span>
                                                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted">{p.jabatan || '—'}</td>
                                            <td><span className="badge badge-hadir">{p.hadir}</span></td>
                                            <td><span className="badge badge-telat">{p.telat}</span></td>
                                            <td><span className="badge badge-izin">{p.izin}</span></td>
                                            <td><span className="badge badge-alpha">{p.alpha}</span></td>
                                            <td>
                                                <div className="pct-bar-wrap">
                                                    <div className="pct-bar">
                                                        <div className="pct-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                                                    </div>
                                                    <span className="pct-bar-val">{pct}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}
