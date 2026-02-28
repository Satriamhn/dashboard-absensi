import { useState, useEffect } from 'react';
import { Bell, Search, Sun, Moon, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ title }) {
    const { user } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [time, setTime] = useState(new Date());
    const [notifications] = useState(3);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
    }, [darkMode]);

    const fmt = (n) => String(n).padStart(2, '0');
    const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
    const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <header className="header">
            <div className="header-left">
                <div>
                    <h1 className="header-title">{title}</h1>
                    <p className="header-date">{dateStr}</p>
                </div>
            </div>
            <div className="header-right">
                <div className="header-clock">
                    <div className="clock-time">{timeStr}</div>
                </div>
                <button
                    className="icon-btn"
                    onClick={() => setDarkMode(!darkMode)}
                    title="Toggle Dark Mode"
                >
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button className="icon-btn notif-btn" title="Notifikasi">
                    <Bell size={18} />
                    {notifications > 0 && <span className="notif-badge">{notifications}</span>}
                </button>
                <div className="header-user">
                    <div className="header-avatar">{user?.avatar || 'U'}</div>
                    <div className="header-user-info">
                        <span className="header-user-name">{user?.nama}</span>
                        <span className="header-user-jabatan">{user?.jabatan}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
