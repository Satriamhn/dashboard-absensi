import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Building2, Lock, Mail, AlertCircle, User, CheckCircle, Briefcase, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function Login() {
    const [mode, setMode]         = useState('login'); // 'login' | 'register'
    const [showPass, setShowPass] = useState(false);
    const [error, setError]       = useState('');
    const [success, setSuccess]   = useState('');
    const [loading, setLoading]   = useState(false);

    // Login state
    const [loginEmail, setLoginEmail]       = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    // Register state
    const [nama, setNama]               = useState('');
    const [regEmail, setRegEmail]       = useState('');
    const [regPass, setRegPass]         = useState('');
    const [regPass2, setRegPass2]       = useState('');
    const [jabatanId, setJabatanId]     = useState('');
    const [shiftId, setShiftId]         = useState('');
    const [jabatanList, setJabatanList] = useState([]);
    const [shiftList, setShiftList]     = useState([]);

    const { login } = useAuth();
    const navigate  = useNavigate();

    // Load jabatan & shift untuk form register
    useEffect(() => {
        if (mode === 'register' && jabatanList.length === 0) {
            authAPI.getOptions()
                .then(res => {
                    setJabatanList(res.jabatan || []);
                    setShiftList(res.shift || []);
                })
                .catch(() => {});
        }
    }, [mode]);

    const switchMode = (m) => {
        setMode(m);
        setError('');
        setSuccess('');
    };

    // ── Handle Login ─────────────────────────────────
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(loginEmail, loginPassword);
        setLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Email atau password salah!');
        }
    };

    // ── Handle Register ───────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (regPass !== regPass2) {
            return setError('Konfirmasi password tidak cocok.');
        }
        if (regPass.length < 6) {
            return setError('Password minimal 6 karakter.');
        }

        setLoading(true);
        try {
            await authAPI.register({
                nama,
                email: regEmail,
                password: regPass,
                jabatan_id: jabatanId || null,
                shift_id: shiftId || null,
            });
            setSuccess('Akun berhasil dibuat! Silakan login.');
            setTimeout(() => switchMode('login'), 1800);
        } catch (err) {
            setError(err.message || 'Gagal membuat akun.');
        } finally {
            setLoading(false);
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
            <div className="login-card" style={{ maxWidth: mode === 'register' ? '440px' : '400px' }}>
                {/* Header */}
                <div className="login-header">
                    <div className="login-logo">
                        <Building2 size={32} />
                    </div>
                    <h1 className="login-title">AbsensiPro</h1>
                    <p className="login-subtitle">Sistem Manajemen Absensi Pegawai</p>
                </div>

                {/* Mode Toggle */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => switchMode('login')}
                        type="button"
                    >
                        Masuk
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => switchMode('register')}
                        type="button"
                    >
                        Daftar
                    </button>
                </div>

                {/* Alert */}
                {error && (
                    <div className="login-error">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="login-success">
                        <CheckCircle size={16} />
                        <span>{success}</span>
                    </div>
                )}

                {/* ── LOGIN FORM ── */}
                {mode === 'login' && (
                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Masukkan email"
                                    value={loginEmail}
                                    onChange={e => setLoginEmail(e.target.value)}
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
                                    value={loginPassword}
                                    onChange={e => setLoginPassword(e.target.value)}
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
                            {loading ? <span className="btn-spinner" /> : 'Masuk'}
                        </button>
                    </form>
                )}

                {/* ── REGISTER FORM ── */}
                {mode === 'register' && (
                    <form className="login-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label">Nama Lengkap</label>
                            <div className="input-wrapper">
                                <User size={18} className="input-icon" />
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Masukkan nama lengkap"
                                    value={nama}
                                    onChange={e => setNama(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Masukkan email"
                                    value={regEmail}
                                    onChange={e => setRegEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Jabatan</label>
                                <div className="input-wrapper">
                                    <Briefcase size={18} className="input-icon" />
                                    <select
                                        className="form-input form-select"
                                        value={jabatanId}
                                        onChange={e => setJabatanId(e.target.value)}
                                    >
                                        <option value="">-- Pilih --</option>
                                        {jabatanList.map(j => (
                                            <option key={j.id} value={j.id}>{j.nama}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Shift</label>
                                <div className="input-wrapper">
                                    <Clock size={18} className="input-icon" />
                                    <select
                                        className="form-input form-select"
                                        value={shiftId}
                                        onChange={e => setShiftId(e.target.value)}
                                    >
                                        <option value="">-- Pilih --</option>
                                        {shiftList.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nama} ({s.jam_masuk?.slice(0,5)}–{s.jam_keluar?.slice(0,5)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Min. 6 karakter"
                                    value={regPass}
                                    onChange={e => setRegPass(e.target.value)}
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

                        <div className="form-group">
                            <label className="form-label">Konfirmasi Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    className="form-input"
                                    placeholder="Ulangi password"
                                    value={regPass2}
                                    onChange={e => setRegPass2(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? <span className="btn-spinner" /> : 'Buat Akun'}
                        </button>

                        <p className="login-switch-text">
                            Sudah punya akun?{' '}
                            <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                                Masuk di sini
                            </button>
                        </p>
                    </form>
                )}

                {/* Demo Accounts — hanya di mode login */}
                {mode === 'login' && (
                    <div className="login-demo">
                        <p className="demo-title">Akun Demo:</p>
                        <div className="demo-accounts">
                            <button
                                className="demo-chip"
                                onClick={() => { setLoginEmail('admin@absensi.com'); setLoginPassword('admin123'); }}
                            >
                                👑 Admin
                            </button>
                            <button
                                className="demo-chip"
                                onClick={() => { setLoginEmail('budi@absensi.com'); setLoginPassword('admin123'); }}
                            >
                                👤 Pegawai
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
