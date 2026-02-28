import { useState, useEffect } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    UserCheck, Clock, FileText, UserX, TrendingUp, Calendar,
    ArrowUpRight, ArrowDownRight, Users, ClipboardCheck,
    CheckCircle2, XCircle, AlertCircle, ChevronRight, Activity, Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { absensiAPI, izinAPI, laporanAPI } from '../services/api';

const TOOLTIP_STYLE = { background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc' };

const statusBadge = (s) => ({
    Hadir: 'badge-hadir', Telat: 'badge-telat', Izin: 'badge-izin',
    Alpha: 'badge-alpha', Pending: 'badge-pending', Disetujui: 'badge-hadir', Ditolak: 'badge-alpha',
}[s] || '');

// ──────────────────────────────────────────────
// ADMIN DASHBOARD
// ──────────────────────────────────────────────
function AdminDashboard() {
    const navigate = useNavigate();

    const [summary, setSummary] = useState(null);
    const [monthlyData, setMonthlyData] = useState([]);
    const [recentAbs, setRecentAbs] = useState([]);
    const [pendingIzin, setPendingIzin] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [harianRes, bulananRes, absRes, izinRes] = await Promise.all([
                    laporanAPI.rekapHarian(),
                    laporanAPI.rekapBulanan(),
                    absensiAPI.getAll({ limit: 5 }),
                    izinAPI.getAll({ status: 'Pending' }),
                ]);
                setSummary(harianRes.data);
                setMonthlyData(bulananRes.data);
                setRecentAbs(absRes.data || []);
                setPendingIzin(izinRes.data || []);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    const hadir = Number(summary?.hadir) || 0;
    const telat = Number(summary?.telat) || 0;
    const izinCount = Number(summary?.izin) || 0;
    const alpha = Number(summary?.alpha) || 0;
    const totalPeg = Number(summary?.total_pegawai) || 0;

    const pieData = [
        { name: 'Hadir', value: hadir, color: '#22c55e' },
        { name: 'Telat', value: telat, color: '#f59e0b' },
        { name: 'Izin', value: izinCount, color: '#3b82f6' },
        { name: 'Alpha', value: alpha, color: '#ef4444' },
    ];

    const STATS = [
        { label: 'Total Pegawai', value: totalPeg, icon: Users, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', trend: '+1', up: true },
        { label: 'Hadir Hari Ini', value: hadir, icon: UserCheck, color: '#22c55e', bg: 'rgba(34,197,94,0.12)', trend: '+2', up: true },
        { label: 'Telat', value: telat, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: '-1', up: false },
        { label: 'Izin / Sakit', value: izinCount, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', trend: '0', up: true },
        { label: 'Alpha', value: alpha, icon: UserX, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', trend: '-1', up: false },
    ];

    if (loading) {
        return (
            <Layout title="Dashboard Admin">
                <div className="loading-state" style={{ minHeight: '60vh' }}>
                    <Loader2 size={40} className="spin" />
                    <span>Memuat dashboard...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard Admin">
            {/* Admin Banner */}
            <div className="role-banner admin-banner">
                <div className="role-banner-left">
                    <span className="role-banner-icon">🛡️</span>
                    <div>
                        <p className="role-banner-title">Panel Administrator</p>
                        <p className="role-banner-sub">Kelola absensi, validasi izin, dan lihat laporan seluruh pegawai</p>
                    </div>
                </div>
                {pendingIzin.length > 0 && (
                    <button className="role-banner-action" onClick={() => navigate('/validasi')}>
                        <AlertCircle size={16} />
                        {pendingIzin.length} izin menunggu validasi
                        <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* Stats Grid */}
            <div className="stats-grid stats-grid-5">
                {STATS.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="stat-card" style={{ '--accent': s.color }}>
                            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                                <Icon size={22} />
                            </div>
                            <div className="stat-info">
                                <span className="stat-label">{s.label}</span>
                                <span className="stat-value">{s.value}</span>
                            </div>
                            <div className={`stat-trend ${s.up ? 'trend-up' : 'trend-down'}`}>
                                {s.up ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                <span>{s.trend}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Area Chart - Monthly */}
                <div className="chart-card chart-main">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Grafik Kehadiran Bulanan</h3>
                            <p className="chart-sub">6 bulan terakhir — semua pegawai</p>
                        </div>
                        <TrendingUp size={20} className="chart-icon" />
                    </div>
                    {monthlyData.length === 0 ? (
                        <div className="loading-state"><span>Belum ada data bulanan</span></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="bulan" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(148,163,184,0.2)' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                                <Area type="monotone" dataKey="hadir" name="Hadir" stroke="#3b82f6" fill="url(#gA)" strokeWidth={2} />
                                <Area type="monotone" dataKey="telat" name="Telat" stroke="#f59e0b" fill="url(#gB)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pie Chart */}
                <div className="chart-card chart-side">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Distribusi Hari Ini</h3>
                            <p className="chart-sub">Status kehadiran</p>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="pie-legend">
                        {pieData.map(p => (
                            <div key={p.name} className="pie-legend-item">
                                <span className="pie-dot" style={{ background: p.color }} />
                                <span>{p.name}</span>
                                <span className="pie-val">{p.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bar Chart */}
            <div className="chart-card" style={{ marginBottom: '1.5rem' }}>
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Rekap Kehadiran per Bulan</h3>
                        <p className="chart-sub">Hadir, Telat, Izin, Alpha</p>
                    </div>
                    <Calendar size={20} className="chart-icon" />
                </div>
                {monthlyData.length === 0 ? (
                    <div className="loading-state"><span>Belum ada data</span></div>
                ) : (
                    <ResponsiveContainer width="100%" height={220}>
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

            {/* Bottom Row */}
            <div className="bottom-row">
                {/* Recent Absensi */}
                <div className="table-card table-main">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Riwayat Absensi Terbaru</h3>
                            <p className="chart-sub">Semua pegawai</p>
                        </div>
                        <button className="link-btn" onClick={() => navigate('/riwayat')}>Lihat Semua <ChevronRight size={14} /></button>
                    </div>
                    <div className="table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Pegawai</th>
                                    <th>Tanggal</th>
                                    <th>Jam Masuk</th>
                                    <th>Jam Keluar</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAbs.length === 0 ? (
                                    <tr><td colSpan="5" className="empty-td">Belum ada data absensi</td></tr>
                                ) : (
                                    recentAbs.map(a => (
                                        <tr key={a.id_absen}>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">{a.nama.split(' ').map(n => n[0]).join('')}</div>
                                                    <span>{a.nama}</span>
                                                </div>
                                            </td>
                                            <td>{new Date(a.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td>{a.jam_masuk || '—'}</td>
                                            <td>{a.jam_keluar || '—'}</td>
                                            <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/*  Pengajuan Izin Pending */}
                <div className="table-card table-side">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Pengajuan Izin</h3>
                            <p className="chart-sub">{pendingIzin.length} menunggu validasi</p>
                        </div>
                        <button className="link-btn" onClick={() => navigate('/validasi')}>Validasi <ChevronRight size={14} /></button>
                    </div>
                    <div className="izin-list">
                        {pendingIzin.length === 0 && <p className="empty-state">Tidak ada pengajuan pending</p>}
                        {pendingIzin.slice(0, 4).map(iz => (
                            <div key={iz.id_izin} className="izin-item">
                                <div className="izin-avatar">{iz.nama.split(' ').map(n => n[0]).join('')}</div>
                                <div className="izin-info">
                                    <span className="izin-nama">{iz.nama}</span>
                                    <span className="izin-detail">{iz.jenis_izin} — {new Date(iz.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                </div>
                                <span className={`badge ${statusBadge(iz.status)}`}>{iz.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// ──────────────────────────────────────────────
// PEGAWAI DASHBOARD
// ──────────────────────────────────────────────
function PegawaiDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [todayAbs, setTodayAbs] = useState(null);
    const [myAbsensi, setMyAbsensi] = useState([]);
    const [myIzin, setMyIzin] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [todayRes, absRes, izinRes] = await Promise.all([
                    absensiAPI.getToday(),
                    absensiAPI.getAll({ limit: 5 }),
                    izinAPI.getAll(),
                ]);
                setTodayAbs(todayRes.data);
                setMyAbsensi(absRes.data || []);
                setMyIzin(izinRes.data || []);
            } catch (err) {
                console.error('Pegawai dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Hitung ringkasan dari riwayat
    const myMonthly = {
        hadir: myAbsensi.filter(a => a.status === 'Hadir').length,
        telat: myAbsensi.filter(a => a.status === 'Telat').length,
        izin: myAbsensi.filter(a => a.status === 'Izin').length,
        alpha: myAbsensi.filter(a => a.status === 'Alpha').length,
    };
    const total = Object.values(myMonthly).reduce((s, v) => s + v, 0) || 1;
    const pctHadir = Math.round((myMonthly.hadir / total) * 100);

    const radialData = [
        { name: 'Hadir', value: myMonthly.hadir, fill: '#22c55e' },
        { name: 'Telat', value: myMonthly.telat, fill: '#f59e0b' },
        { name: 'Izin', value: myMonthly.izin, fill: '#3b82f6' },
        { name: 'Alpha', value: myMonthly.alpha, fill: '#ef4444' },
    ];

    const statusConfig = {
        Hadir: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle2, label: 'Hadir Tepat Waktu' },
        Telat: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock, label: 'Terlambat' },
        Izin: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: FileText, label: 'Izin / Sakit' },
        Alpha: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle, label: 'Tidak Hadir' },
    };

    const todayCfg = todayAbs ? (statusConfig[todayAbs.status] || statusConfig.Hadir) : null;
    const TodayIcon = todayCfg?.icon;
    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    if (loading) {
        return (
            <Layout title="Dashboard Saya">
                <div className="loading-state" style={{ minHeight: '60vh' }}>
                    <Loader2 size={40} className="spin" />
                    <span>Memuat dashboard...</span>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard Saya">
            {/* Pegawai Banner */}
            <div className="role-banner pegawai-banner">
                <div className="role-banner-left">
                    <span className="role-banner-icon">👤</span>
                    <div>
                        <p className="role-banner-title">Selamat datang, {user?.nama}!</p>
                        <p className="role-banner-sub">{user?.jabatan} — Pantau kehadiranmu dan ajukan izin di sini</p>
                    </div>
                </div>
                <button className="role-banner-action" onClick={() => navigate('/absensi')}>
                    <ClipboardCheck size={16} />
                    Absen Sekarang
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Top Row */}
            <div className="pegawai-top-row">
                {/* Status Absensi Hari Ini */}
                <div className="chart-card today-status-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Status Absensi Hari Ini</h3>
                            <p className="chart-sub">{todayStr}</p>
                        </div>
                        <Activity size={20} className="chart-icon" />
                    </div>

                    {todayAbs ? (
                        <div className="today-status-box" style={{ '--st-color': todayCfg.color, '--st-bg': todayCfg.bg }}>
                            <div className="today-status-icon">
                                <TodayIcon size={36} />
                            </div>
                            <div className="today-status-info">
                                <span className="today-status-main">{todayAbs.status}</span>
                                <span className="today-status-sub">{todayCfg.label}</span>
                            </div>
                            <div className="today-status-times">
                                <div className="time-chip">
                                    <span className="time-chip-label">Masuk</span>
                                    <span className="time-chip-val">{todayAbs.jam_masuk || '—'}</span>
                                </div>
                                <div className="time-chip">
                                    <span className="time-chip-label">Keluar</span>
                                    <span className="time-chip-val">{todayAbs.jam_keluar || '—'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="today-absent-box">
                            <ClipboardCheck size={40} />
                            <p>Kamu belum absen hari ini</p>
                            <button className="btn-absen btn-sm" onClick={() => navigate('/absensi')}>
                                Absen Sekarang
                            </button>
                        </div>
                    )}
                </div>

                {/* Ringkasan Kehadiran */}
                <div className="chart-card ringkasan-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Ringkasan Kehadiranku</h3>
                            <p className="chart-sub">Total dari semua riwayat</p>
                        </div>
                    </div>
                    <div className="ringkasan-pct">
                        <div className="pct-circle" style={{ '--pct': pctHadir }}>
                            <span className="pct-val">{pctHadir}%</span>
                            <span className="pct-label">Hadir</span>
                        </div>
                    </div>
                    <div className="ringkasan-grid">
                        {radialData.map(r => (
                            <div key={r.name} className="ringkasan-chip" style={{ '--chip-color': r.fill }}>
                                <span className="r-val">{r.value}</span>
                                <span className="r-label">{r.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Izin */}
                <div className="chart-card izin-status-card">
                    <div className="chart-header">
                        <div>
                            <h3 className="chart-title">Status Izin</h3>
                            <p className="chart-sub">{myIzin.length} total pengajuan</p>
                        </div>
                        <button className="link-btn" onClick={() => navigate('/izin')}>Ajukan <ChevronRight size={14} /></button>
                    </div>
                    <div className="izin-riwayat-list">
                        {myIzin.length === 0 && <p className="empty-state">Belum ada pengajuan izin</p>}
                        {myIzin.slice(0, 3).map(iz => (
                            <div key={iz.id_izin} className="izin-card-item">
                                <div className="izin-card-header">
                                    <div className="izin-type-badge">
                                        {iz.jenis_izin === 'Sakit' ? '🤒' : iz.jenis_izin === 'Cuti' ? '🌴' : '💼'} {iz.jenis_izin}
                                    </div>
                                    <span className={`badge ${statusBadge(iz.status)}`}>{iz.status}</span>
                                </div>
                                <p className="izin-card-date">📅 {new Date(iz.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Riwayat Kehadiran */}
            <div className="chart-card">
                <div className="chart-header">
                    <div>
                        <h3 className="chart-title">Riwayat Kehadiranku</h3>
                        <p className="chart-sub">Data absensi terbaru dari database</p>
                    </div>
                    <button className="link-btn" onClick={() => navigate('/riwayat')}>Lihat Semua <ChevronRight size={14} /></button>
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Tanggal</th>
                                <th>Jam Masuk</th>
                                <th>Jam Keluar</th>
                                <th>Status</th>
                                <th>Lokasi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myAbsensi.length === 0 ? (
                                <tr><td colSpan="5" className="empty-td">Belum ada riwayat absensi</td></tr>
                            ) : (
                                myAbsensi.map(a => (
                                    <tr key={a.id_absen}>
                                        <td>{new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>{a.jam_masuk || '—'}</td>
                                        <td>{a.jam_keluar || '—'}</td>
                                        <td><span className={`badge ${statusBadge(a.status)}`}>{a.status}</span></td>
                                        <td className="text-muted td-loc">
                                            {a.latitude ? `${a.latitude}, ${a.longitude}` : '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
}

// ──────────────────────────────────────────────
// Main export
// ──────────────────────────────────────────────
export default function Dashboard() {
    const { user } = useAuth();
    return user?.role === 'admin' ? <AdminDashboard /> : <PegawaiDashboard />;
}
