import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    // Masih loading (sedang verifikasi token ke backend) → jangan redirect dulu
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                background: 'var(--bg-base, #0f172a)',
                gap: '16px',
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(59,130,246,0.2)',
                    borderTop: '3px solid #3b82f6',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Memuat sesi...
                </span>
            </div>
        );
    }

    // Loading selesai: cek apakah user ada
    return user ? children : <Navigate to="/login" replace />;
}
