import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, CheckCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

export default function Header({ title }) {
    const { user, logout } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const { notifications, unreadCount, isOpen, toggleOpen, closePanel, markAllRead } = useNotifications();
    const [time, setTime] = useState(new Date());
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const panelRef = useRef(null);
    const profileRef = useRef(null);
    const navigate = useNavigate();

    // Clock ticker
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Tutup panel notifikasi saat klik di luar
    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                closePanel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, closePanel]);

    // Tutup dropdown profil saat klik di luar
    useEffect(() => {
        if (!isProfileOpen) return;
        const handleClickOutsideProfile = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideProfile);
        return () => document.removeEventListener('mousedown', handleClickOutsideProfile);
    }, [isProfileOpen]);

    const fmt = (n) => String(n).padStart(2, '0');
    const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
    const dateStr = time.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const handleNotifClick = (link) => {
        closePanel();
        if (link) navigate(link);
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Baru saja';
        if (mins < 60) return `${mins} menit lalu`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} jam lalu`;
        return `${Math.floor(hours / 24)} hari lalu`;
    };

    return (
        <header className="header">
            <div className="header-left">
                <div>
                    <h1 className="header-title">{title}</h1>
                    <p className="header-date">{dateStr}</p>
                </div>
            </div>
            <div className="header-right">
                {/* Clock */}
                <div className="header-clock">
                    <div className="clock-time">{timeStr}</div>
                </div>

                {/* Toggle Theme */}
                <button
                    className="icon-btn"
                    onClick={toggleTheme}
                    title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
                    aria-label="Toggle theme"
                >
                    {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* Notifikasi */}
                <div className="notif-wrapper" ref={panelRef}>
                    <button
                        className="icon-btn notif-btn"
                        onClick={toggleOpen}
                        title="Notifikasi"
                        aria-label={`Notifikasi, ${unreadCount} belum dibaca`}
                    >
                        <Bell size={18} className={unreadCount > 0 ? 'bell-shake' : ''} />
                        {unreadCount > 0 && (
                            <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                        )}
                    </button>

                    {/* Panel Notifikasi */}
                    {isOpen && (
                        <div className="notif-panel">
                            <div className="notif-panel-header">
                                <span className="notif-panel-title">Notifikasi</span>
                                <div className="notif-panel-actions">
                                    {unreadCount > 0 && (
                                        <button
                                            className="notif-mark-all"
                                            onClick={markAllRead}
                                            title="Tandai semua sudah dibaca"
                                        >
                                            <CheckCheck size={14} />
                                            <span>Baca semua</span>
                                        </button>
                                    )}
                                    <button className="notif-close" onClick={closePanel} title="Tutup">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="notif-list">
                                {notifications.length === 0 ? (
                                    <div className="notif-empty">
                                        <Bell size={32} className="notif-empty-icon" />
                                        <p>Tidak ada notifikasi</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <button
                                            key={notif.id}
                                            className={`notif-item ${notif.type}`}
                                            onClick={() => handleNotifClick(notif.link)}
                                        >
                                            <div className="notif-item-icon">
                                                {notif.type === 'pending_izin' && '📋'}
                                                {notif.type === 'approved' && '✅'}
                                                {notif.type === 'rejected' && '❌'}
                                            </div>
                                            <div className="notif-item-body">
                                                <p className="notif-item-title">{notif.title}</p>
                                                <p className="notif-item-msg">{notif.message}</p>
                                                <span className="notif-item-time">{timeAgo(notif.time)}</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Info */}
                <div className="header-user-wrapper" ref={profileRef}>
                    <div 
                        className="header-user" 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="header-avatar">
                            {user?.avatar && user.avatar.startsWith('data:') ? (
                                <img src={user.avatar} alt="A" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user?.avatar || (user?.nama ? user.nama[0].toUpperCase() : 'U')
                            )}
                        </div>
                        <div className="header-user-info">
                            <span className="header-user-name">{user?.nama}</span>
                            <span className="header-user-jabatan">{user?.jabatan}</span>
                        </div>
                    </div>

                    {/* Profile Dropdown */}
                    {isProfileOpen && (
                        <div className="profile-dropdown">
                            <div className="profile-dropdown-header">
                                <span className="profile-dropdown-name">{user?.nama}</span>
                                <span className="profile-dropdown-email">{user?.email || 'user@email.com'}</span>
                            </div>
                            <div className="profile-dropdown-body">
                                <button onClick={() => { setIsProfileOpen(false); navigate('/dashboard'); }} className="profile-dropdown-item">
                                    Home
                                </button>
                                <button onClick={() => { setIsProfileOpen(false); navigate('/profile'); }} className="profile-dropdown-item">
                                    Profile
                                </button>
                            </div>
                            <div className="profile-dropdown-footer">
                                <button onClick={() => { setIsProfileOpen(false); logout(); navigate('/login'); }} className="profile-dropdown-item logout-item">
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
