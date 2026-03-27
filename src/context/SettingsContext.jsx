/**
 * context/SettingsContext.jsx
 * ──────────────────────────────────────────────────────
 * Global state untuk settings aplikasi (nama perusahaan, lokasi kantor, dll.)
 * Dibaca dari backend sekali saat app load, lalu bisa di-refresh oleh admin.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SettingsContext = createContext(null);

const DEFAULTS = {
    company_name    : 'AbsensiPro',
    office_name     : 'Kantor Pusat',
    office_latitude : '-6.200000',
    office_longitude: '106.816666',
    office_radius   : '100',
};

export function SettingsProvider({ children }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState(DEFAULTS);
    const [loading, setLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const res = await settingsAPI.get();
            setSettings({ ...DEFAULTS, ...res.data });
        } catch {
            // tetap pakai defaults jika gagal
        } finally {
            setLoading(false);
        }
    }, []);

    // Load settings saat user login
    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user, fetchSettings]);

    const updateSettings = async (payload) => {
        const res = await settingsAPI.update(payload);
        setSettings(prev => ({ ...prev, ...res.data }));
        return res;
    };

    return (
        <SettingsContext.Provider value={{ settings, loading, fetchSettings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
