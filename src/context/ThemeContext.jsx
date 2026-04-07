/**
 * context/ThemeContext.jsx
 * ─────────────────────────────────────────────────────
 * Global state untuk dark/light mode.
 * Persisted ke localStorage agar tidak reset saat navigasi antar halaman.
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    // Ambil preferensi dari localStorage, default ke 'dark'
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        // Fallback ke preferensi sistem
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Sinkronkan class 'dark' di <html> setiap kali isDark berubah
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = () => setIsDark(prev => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}
