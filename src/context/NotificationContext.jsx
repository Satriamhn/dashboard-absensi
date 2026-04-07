/**
 * context/NotificationContext.jsx
 * ─────────────────────────────────────────────────────
 * Global state untuk notifikasi aplikasi.
 * - Admin: menampilkan izin yang masih Pending dari API
 * - Pegawai: menampilkan status izin mereka sendiri yang baru diproses
 * Polling otomatis setiap 30 detik agar data selalu fresh.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { izinAPI } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [readIds, setReadIds] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('notif_read') || '[]'));
        } catch {
            return new Set();
        }
    });

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            if (user.role === 'admin') {
                // Admin: ambil semua izin pending
                const res = await izinAPI.getAll({ status: 'Pending' });
                const items = (res.data || []).map(izin => ({
                    id: `izin-${izin.id_izin}`,
                    type: 'pending_izin',
                    title: 'Pengajuan Izin Baru',
                    message: `${izin.nama} mengajukan izin ${izin.jenis_izin} pada ${new Date(izin.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
                    time: izin.created_at,
                    link: '/validasi',
                }));
                setNotifications(items);
            } else {
                // Pegawai: cek izin yang baru diproses (bukan pending)
                const res = await izinAPI.getAll();
                const items = (res.data || [])
                    .filter(izin => izin.status !== 'Pending')
                    .slice(0, 10)
                    .map(izin => ({
                        id: `izin-${izin.id_izin}`,
                        type: izin.status === 'Disetujui' ? 'approved' : 'rejected',
                        title: izin.status === 'Disetujui' ? '✅ Izin Disetujui' : '❌ Izin Ditolak',
                        message: `Izin ${izin.jenis_izin} tanggal ${new Date(izin.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} telah ${izin.status === 'Disetujui' ? 'disetujui' : 'ditolak'}`,
                        time: izin.created_at,
                        link: '/riwayat',
                    }));
                setNotifications(items);
            }
        } catch {
            // Gagal fetch — biarkan notifikasi kosong, tidak crash
        }
    }, [user]);

    // Hitung unread berdasarkan ID yang belum ada di readIds
    useEffect(() => {
        const count = notifications.filter(n => !readIds.has(n.id)).length;
        setUnreadCount(count);
    }, [notifications, readIds]);

    // Fetch saat user berubah, lalu polling tiap 30 detik
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30_000);
        return () => clearInterval(interval);
    }, [user, fetchNotifications]);

    const markAllRead = useCallback(() => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = new Set([...readIds, ...allIds]);
        setReadIds(newReadIds);
        setUnreadCount(0);
        localStorage.setItem('notif_read', JSON.stringify([...newReadIds]));
    }, [notifications, readIds]);

    const toggleOpen = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const closePanel = useCallback(() => {
        setIsOpen(false);
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isOpen,
            toggleOpen,
            closePanel,
            markAllRead,
            refresh: fetchNotifications,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
    return ctx;
}
