import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardCheck, FileText, History,
    Users, LogOut, Building2, ChevronRight, Menu,
    CheckSquare, BarChart2, Settings2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useNotifications } from '../context/NotificationContext';

// Role-based navigation
const ADMIN_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/absensi', icon: ClipboardCheck, label: 'Absensi' },
    { to: '/validasi', icon: CheckSquare, label: 'Validasi Izin', badge: 'pending' },
    { to: '/laporan', icon: BarChart2, label: 'Laporan' },
    { to: '/pegawai', icon: Users, label: 'Kelola Pegawai' },
    { to: '/pengaturan', icon: Settings2, label: 'Pengaturan' },
];

const PEGAWAI_NAV = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/absensi', icon: ClipboardCheck, label: 'Absensi' },
    { to: '/izin', icon: FileText, label: 'Pengajuan Izin' },
    { to: '/riwayat', icon: History, label: 'Riwayat Saya' },
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const { user, logout } = useAuth();
    const { settings } = useSettings();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    // Untuk admin: badge Validasi Izin = jumlah notif pending
    const pendingCount = user?.role === 'admin' ? unreadCount : 0;

    const navItems = user?.role === 'admin' ? ADMIN_NAV : PEGAWAI_NAV;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Ambil singkatan nama perusahaan untuk logo icon saat collapsed
    const companyInitial = (settings.company_name || 'A')[0].toUpperCase();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="logo-icon">
                        {collapsed ? companyInitial : <Building2 size={22} />}
                    </div>
                    {!collapsed && (
                        <div className="logo-text">
                            <span className="logo-title">{settings.company_name || 'AbsensiPro'}</span>
                            <span className="logo-sub">Management System</span>
                        </div>
                    )}
                </div>
                <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* User Profile */}
            {!collapsed && (
                <div className="sidebar-profile">
                    <div className="profile-avatar">
                        {user?.avatar && user.avatar.startsWith('data:') ? (
                            <img src={user.avatar} alt="A" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.avatar || (user?.nama ? user.nama[0].toUpperCase() : 'U')
                        )}
                    </div>
                    <div className="profile-info">
                        <span className="profile-name">{user?.nama}</span>
                        <span className={`profile-role role-${user?.role}`}>
                            {user?.role === 'admin' ? '👑 Admin' : '👤 Pegawai'}
                        </span>
                    </div>
                </div>
            )}

            {/* Role Label */}
            {!collapsed && (
                <div className="sidebar-role-label">
                    <span>{user?.role === 'admin' ? '🛡️ Panel Admin' : '📋 Panel Pegawai'}</span>
                </div>
            )}

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map(({ to, icon: Icon, label, badge }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={collapsed ? label : ''}
                    >
                        <Icon size={20} />
                        {!collapsed && <span className="nav-label">{label}</span>}
                        {/* Pending badge for Validasi Izin */}
                        {badge === 'pending' && pendingCount > 0 && (
                            <span className={`nav-badge ${collapsed ? 'nav-badge-collapsed' : ''}`}>
                                {pendingCount}
                            </span>
                        )}
                        {!collapsed && !badge && <ChevronRight size={14} className="nav-arrow" />}
                    </NavLink>
                ))}
            </nav>

            {/* Logout */}
            <div className="sidebar-footer">
                <button className="nav-item logout-btn" onClick={handleLogout} title={collapsed ? 'Logout' : ''}>
                    <LogOut size={20} />
                    {!collapsed && <span>Keluar</span>}
                </button>
            </div>
        </aside>
    );
}
