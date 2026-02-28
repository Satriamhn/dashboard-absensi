/**
 * api.js — Frontend API Client
 * 
 * Semua request ke backend melewati helper ini.
 * Token JWT disimpan di localStorage dan dikirim otomatis.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Core Fetcher ─────────────────────────────────────
async function fetcher(endpoint, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
    }

    return data;
}

// ─── AUTH ─────────────────────────────────────────────
export const authAPI = {
    login: (email, password) =>
        fetcher('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

    me: () => fetcher('/auth/me'),
};

// ─── ABSENSI ──────────────────────────────────────────
export const absensiAPI = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetcher(`/absensi${qs ? '?' + qs : ''}`);
    },

    getToday: (userId) => {
        const qs = userId ? `?user_id=${userId}` : '';
        return fetcher(`/absensi/today${qs}`);
    },

    getSummary: () => fetcher('/absensi/summary'),

    clockIn: (latitude, longitude) =>
        fetcher('/absensi', {
            method: 'POST',
            body: JSON.stringify({ type: 'masuk', latitude: String(latitude), longitude: String(longitude) }),
        }),

    clockOut: (latitude, longitude) =>
        fetcher('/absensi', {
            method: 'POST',
            body: JSON.stringify({ type: 'keluar', latitude: String(latitude), longitude: String(longitude) }),
        }),
};

// ─── IZIN ─────────────────────────────────────────────
export const izinAPI = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetcher(`/izin${qs ? '?' + qs : ''}`);
    },

    create: (data) =>
        fetcher('/izin', { method: 'POST', body: JSON.stringify(data) }),

    updateStatus: (id, status) =>
        fetcher(`/izin/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

    delete: (id) =>
        fetcher(`/izin/${id}`, { method: 'DELETE' }),
};

// ─── USERS ────────────────────────────────────────────
export const usersAPI = {
    getAll: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return fetcher(`/users${qs ? '?' + qs : ''}`);
    },

    getById: (id) => fetcher(`/users/${id}`),

    create: (data) =>
        fetcher('/users', { method: 'POST', body: JSON.stringify(data) }),

    update: (id, data) =>
        fetcher(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    delete: (id) =>
        fetcher(`/users/${id}`, { method: 'DELETE' }),

    getJabatan: () => fetcher('/users/jabatan/all'),
    getShift: () => fetcher('/users/shift/all'),
};

// ─── LAPORAN ──────────────────────────────────────────
export const laporanAPI = {
    rekapHarian: (tanggal) => fetcher(`/laporan/rekap-harian${tanggal ? '?tanggal=' + tanggal : ''}`),
    rekapBulanan: () => fetcher('/laporan/rekap-bulanan'),
    perPegawai: () => fetcher('/laporan/per-pegawai'),
    exportCSV: (bulan) => {
        const token = localStorage.getItem('token');
        const qs = bulan ? `?bulan=${bulan}` : '';
        // Buka di tab baru untuk download langsung
        window.open(`${BASE_URL}/laporan/export${qs}?token=${token}`, '_blank');
    },
};

export default { authAPI, absensiAPI, izinAPI, usersAPI, laporanAPI };
