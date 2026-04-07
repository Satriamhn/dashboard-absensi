import { useState, useRef } from 'react';
import { Camera, Upload, Edit2, ShieldAlert } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import FaceCapture from '../components/FaceCapture';

export default function Profil() {
    const { user } = useAuth();
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [isEditingInfo, setIsEditingInfo] = useState(false);
    const [infoData, setInfoData] = useState({
        nama: user?.nama || '',
        email: user?.email || '',
        telepon: user?.telepon || ''
    });

    const [message, setMessage] = useState('');
    const [uploadMsg, setUploadMsg] = useState('');
    const [showCamera, setShowCamera] = useState(false);
    const fileInputRef = useRef(null);

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            setUploadMsg('Ukuran file maksimal 2MB!');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64Data = reader.result;
                await usersAPI.update(user.id_user, { avatar: base64Data });
                setUploadMsg('Foto profil berhasil diunggah!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (err) {
                setUploadMsg(err.message || 'Gagal mengunggah foto profil');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCameraCapture = async (base64Data) => {
        try {
            await usersAPI.update(user.id_user, { avatar: base64Data });
            setUploadMsg('Foto profil berhasil diperbarui dari kamera!');
            setShowCamera(false);
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            setUploadMsg(err.message || 'Gagal menyimpan foto dari kamera');
            setShowCamera(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage('Konfirmasi password tidak cocok!');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage('Password baru minimal 6 karakter!');
            return;
        }

        try {
            // Note: Since we only have a PUT /api/users/:id endpoint which expects the current admin to change it,
            // or if the user is changing their own, it might need backend adjustment. 
            // For now, we will just call usersAPI.update if the role allows, else show a mock success state.
            // If the backend allows user to update their own password, this works:
            await usersAPI.update(user.id_user, { 
                password: passwordData.newPassword 
            });
            setMessage('Password berhasil diubah!');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage(error.message || 'Gagal mengubah password');
        }
    };

    const handleSaveInfo = async () => {
        try {
            await usersAPI.update(user.id_user, infoData);
            setIsEditingInfo(false);
            window.location.reload();
        } catch (err) {
            alert(err.message || 'Gagal menyimpan informasi profil');
        }
    };

    return (
        <Layout title="Profil Saya">
            {showCamera && (
                <FaceCapture 
                    onCapture={handleCameraCapture} 
                    onCancel={() => setShowCamera(false)} 
                    tipe="masuk" /* reused layout, just for taking a photo */
                />
            )}
            <div className="profile-page">
                {/* Banner Profil */}
                <div className="profile-banner">
                    <div className="profile-avatar-large" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                        {user?.avatar && user.avatar.startsWith('data:') ? (
                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.avatar || (user?.nama ? user.nama[0].toUpperCase() : 'U')
                        )}
                        <button className="avatar-edit-btn" title="Ganti Foto">
                            <Camera size={14} />
                        </button>
                    </div>
                    <h2 className="profile-name">{user?.nama}</h2>
                    <p className="profile-email">{user?.email}</p>
                    <span className="profile-badge">{user?.role?.toUpperCase()}</span>
                </div>

                <div className="profile-grid">
                    {/* Kolom Kiri: Informasi & Foto */}
                    <div className="profile-col">
                        <div className="card profile-card">
                            <div className="card-header">
                                <h3>Informasi Pribadi</h3>
                                {isEditingInfo ? (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-outline btn-sm" onClick={() => setIsEditingInfo(false)} style={{ padding: '4px 10px', fontSize: '12px' }}>Batal</button>
                                        <button className="btn btn-primary btn-sm" onClick={handleSaveInfo} style={{ padding: '4px 10px', fontSize: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '6px' }}>Simpan</button>
                                    </div>
                                ) : (
                                    <Edit2 size={16} className="text-secondary" style={{ cursor: 'pointer' }} onClick={() => {
                                        setInfoData({ nama: user?.nama || '', email: user?.email || '', telepon: user?.telepon || '' });
                                        setIsEditingInfo(true);
                                    }} />
                                )}
                            </div>
                            <div className="card-body">
                                <ul className="profile-info-list">
                                    <li>
                                        <span className="info-label">Nama</span>
                                        {isEditingInfo ? (
                                            <input type="text" className="form-control" value={infoData.nama} onChange={e => setInfoData({...infoData, nama: e.target.value})} style={{ padding: '4px 8px', width: '60%' }} />
                                        ) : (
                                            <span className="info-value">{user?.nama}</span>
                                        )}
                                    </li>
                                    <li>
                                        <span className="info-label">Email</span>
                                        {isEditingInfo ? (
                                            <input type="email" className="form-control" value={infoData.email} onChange={e => setInfoData({...infoData, email: e.target.value})} style={{ padding: '4px 8px', width: '60%' }} />
                                        ) : (
                                            <span className="info-value">{user?.email}</span>
                                        )}
                                    </li>
                                    <li>
                                        <span className="info-label">Telepon</span>
                                        {isEditingInfo ? (
                                            <input type="text" className="form-control" value={infoData.telepon} onChange={e => setInfoData({...infoData, telepon: e.target.value})} style={{ padding: '4px 8px', width: '60%' }} placeholder="Masukan No HP" />
                                        ) : (
                                            <span className="info-value">{user?.telepon || '-'}</span>
                                        )}
                                    </li>
                                    <li>
                                        <span className="info-label">Posisi</span>
                                        <span className="info-value">{user?.jabatan || '-'}</span>
                                    </li>
                                    <li>
                                        <span className="info-label">Shift</span>
                                        <span className="info-value">{user?.nama_shift || '-'}</span>
                                    </li>
                                    <li>
                                        <span className="info-label">Status</span>
                                        <span className="info-value status-active">✓ Aktif</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="card profile-card">
                            <div className="card-header">
                                <h3><Camera size={18} /> Ganti Foto Profil</h3>
                            </div>
                            <div className="card-body">
                                {uploadMsg && (
                                    <div className={`alert ${uploadMsg.includes('berhasil') ? 'alert-success' : 'alert-danger'} mb-3 p-2 rounded`} style={{ backgroundColor: uploadMsg.includes('berhasil') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: uploadMsg.includes('berhasil') ? '#22c55e' : '#ef4444', fontSize: '13px' }}>
                                        {uploadMsg}
                                    </div>
                                )}
                                <div className="photo-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => setShowCamera(true)}>
                                        <Camera size={16} style={{marginRight: 6}} /> Ambil Foto
                                    </button>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={fileInputRef} 
                                        style={{ display: 'none' }} 
                                        onChange={handleAvatarChange} 
                                    />
                                    <button className="btn btn-outline btn-sm" onClick={() => fileInputRef.current?.click()}>
                                        <Upload size={16} style={{marginRight: 6}} /> Upload File
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kolom Kanan: Keamanan */}
                    <div className="profile-col">
                        <div className="card profile-card">
                            <div className="card-header">
                                <h3><ShieldAlert size={18} /> Ganti Password</h3>
                            </div>
                            <div className="card-body">
                                {message && (
                                    <div className={`alert ${message.includes('berhasil') ? 'alert-success' : 'alert-danger'} mb-4 p-3 rounded`} style={{ backgroundColor: message.includes('berhasil') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('berhasil') ? '#22c55e' : '#ef4444' }}>
                                        {message}
                                    </div>
                                )}
                                <form onSubmit={handlePasswordChange} className="password-form">
                                    <div className="form-group mb-3">
                                        <label>Password Lama</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={passwordData.oldPassword}
                                            onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                                            placeholder="Masukkan password saat ini"
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Password Baru</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                            placeholder="Minimal 6 karakter"
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Konfirmasi Password Baru</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                            placeholder="Ulangi password baru"
                                        />
                                    </div>
                                    <button type="submit" className="btn btn-danger w-100">
                                        <ShieldAlert size={16} /> Ubah Password
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

// Ensure you add these styles to src/index.css or src/theme.css:
/*
.profile-page { padding: 20px 0; }
.profile-banner { background: #0ea5e9; background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 40px 20px; border-radius: 16px; text-align: center; margin-bottom: 24px; position: relative; }
.profile-avatar-large { width: 80px; height: 80px; background: white; color: #0ea5e9; font-size: 32px; font-weight: bold; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; position: relative; }
.avatar-edit-btn { position: absolute; bottom: 0; right: 0; background: #0ea5e9; color: white; border: none; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.profile-name { margin: 0 0 4px; font-size: 24px; font-weight: 700; }
.profile-email { margin: 0 0 12px; opacity: 0.9; }
.profile-badge { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 1px; }
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media(max-width: 768px) { .profile-grid { grid-template-columns: 1fr; } }
.profile-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.card-header { padding: 16px 20px; border-bottom: 1px solid var(--border-theme, #eee); display: flex; align-items: center; justify-content: space-between; }
.card-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; }
.card-body { padding: 20px; }
.profile-info-list { list-style: none; padding: 0; margin: 0; }
.profile-info-list li { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px dashed var(--border-theme, #eee); }
.profile-info-list li:last-child { border-bottom: none; }
.info-label { color: var(--text-secondary-theme, #666); font-size: 14px; }
.info-value { font-weight: 500; font-size: 14px; text-align: right; }
.status-active { color: #10b981; }
.photo-actions { display: flex; gap: 12px; }
.password-form label { display: block; margin-bottom: 6px; font-size: 14px; color: var(--text-secondary-theme); }
.w-100 { width: 100%; display: flex; justify-content: center; gap: 8px; }
.btn-danger { background-color: #ef4444; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-danger:hover { background-color: #dc2626; }
*/
