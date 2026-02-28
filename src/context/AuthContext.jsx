import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // cek token saat startup

    // ── Restore session dari localStorage saat app load ──
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('absensi_user');

        if (token && savedUser) {
            // Set user dari cache dulu supaya cepat
            setUser(JSON.parse(savedUser));

            // Validasi token ke backend secara background
            authAPI.me()
                .then(res => {
                    setUser(res.user);
                    localStorage.setItem('absensi_user', JSON.stringify(res.user));
                })
                .catch(() => {
                    // Token expired / invalid → logout
                    localStorage.removeItem('token');
                    localStorage.removeItem('absensi_user');
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // ── Login → panggil backend API ───────────────────────
    const login = async (email, password) => {
        try {
            const res = await authAPI.login(email, password);
            // Simpan token JWT dan data user
            localStorage.setItem('token', res.token);
            localStorage.setItem('absensi_user', JSON.stringify(res.user));
            setUser(res.user);
            return { success: true, user: res.user };
        } catch (err) {
            return { success: false, message: err.message || 'Email atau password salah!' };
        }
    };

    // ── Logout ────────────────────────────────────────────
    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('absensi_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
