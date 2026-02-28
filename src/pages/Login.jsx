import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Lock, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);  // ← await wajib karena login() sekarang async API call
        setLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Email atau password salah!');
        }
    };

    return (
        <div className="login-page">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="bg-blob blob-1" />
                <div className="bg-blob blob-2" />
                <div className="bg-blob blob-3" />
            </div>

            {/* Card */}
            <div className="login-card">
                {/* Header */}
                <div className="login-header">
                    <div className="login-logo">
                        <Building2 size={32} />
                    </div>
                    <h1 className="login-title">AbsensiPro</h1>
                    <p className="login-subtitle">Sistem Manajemen Absensi Pegawai</p>
                </div>

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {error && (
                        <div className="login-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                className="form-input"
                                placeholder="Masukkan email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="form-input"
                                placeholder="Masukkan password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                className="input-btn-right"
                                onClick={() => setShowPass(!showPass)}
                            >
                                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? (
                            <span className="btn-spinner" />
                        ) : (
                            'Masuk'
                        )}
                    </button>
                </form>

                {/* Demo Accounts */}
                <div className="login-demo">
                    <p className="demo-title">Akun Demo:</p>
                    <div className="demo-accounts">
                        <button
                            className="demo-chip"
                            onClick={() => { setEmail('admin@absensi.com'); setPassword('admin123'); }}
                        >
                            👑 Admin
                        </button>
                        <button
                            className="demo-chip"
                            onClick={() => { setEmail('budi@absensi.com'); setPassword('budi123'); }}
                        >
                            👤 Pegawai
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
