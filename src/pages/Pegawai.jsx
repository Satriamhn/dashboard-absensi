import { useState, useEffect } from 'react';
import { UserPlus, Edit2, Trash2, Search, Shield, User, Loader2, RefreshCw, Key } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

export default function Pegawai() {
    const { user: currentUser } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [jabatanList, setJabatanList] = useState([]);
    const [shiftList, setShiftList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);

    const emptyForm = { nama: '', email: '', password: '', jabatan_id: '', shift_id: '', role: 'pegawai' };
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');

    // ── Fetch employees + jabatan + shift dari backend ─────
    const fetchData = async () => {
        setLoading(true);
        try {
            const [empRes, jabRes, shiftRes] = await Promise.all([
                usersAPI.getAll(),
                usersAPI.getJabatan(),
                usersAPI.getShift(),
            ]);
            setEmployees(empRes.data);
            setJabatanList(jabRes.data);
            setShiftList(shiftRes.data);
        } catch (err) {
            showToast('Gagal memuat data: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const filtered = employees.filter(e =>
        e.nama.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase())
    );

    // ── Open modal Tambah ─────────────────────────────────
    const openAdd = () => {
        setEditTarget(null);
        setForm({ ...emptyForm, jabatan_id: jabatanList[0]?.id_jabatan || '', shift_id: shiftList[0]?.id_shift || '' });
        setFormError('');
        setShowModal(true);
    };

    // ── Open modal Edit ───────────────────────────────────
    const openEdit = (emp) => {
        setEditTarget(emp);
        setForm({
            nama: emp.nama,
            email: emp.email,
            password: '',           // kosong = tidak ubah password
            jabatan_id: emp.id_jabatan || '',
            shift_id: emp.id_shift || '',
            role: emp.role,
        });
        setFormError('');
        setShowModal(true);
    };

    // ── Save (Create / Update) ────────────────────────────
    const handleSave = async () => {
        if (!form.nama.trim() || !form.email.trim()) {
            setFormError('Nama dan email wajib diisi!');
            return;
        }
        if (!editTarget && !form.password) {
            setFormError('Password wajib diisi untuk pegawai baru!');
            return;
        }
        if (form.password && form.password.length < 6) {
            setFormError('Password minimal 6 karakter!');
            return;
        }

        setFormError('');
        setSaving(true);

        try {
            const payload = {
                nama: form.nama.trim(),
                email: form.email.trim(),
                role: form.role,
                jabatan_id: form.jabatan_id || null,
                shift_id: form.shift_id || null,
            };
            if (form.password) payload.password = form.password;

            if (editTarget) {
                await usersAPI.update(editTarget.id_user, payload);
                showToast(`✅ Data ${form.nama} berhasil diperbarui.`);
            } else {
                payload.password = form.password;
                await usersAPI.create(payload);
                showToast(`✅ Pegawai ${form.nama} berhasil ditambahkan.`);
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Gagal menyimpan data.');
        } finally {
            setSaving(false);
        }
    };

    // ── Delete ────────────────────────────────────────────
    const handleDelete = async (id) => {
        try {
            await usersAPI.delete(id);
            showToast('🗑️ Pegawai berhasil dihapus.');
            setDeleteConfirm(null);
            fetchData();
        } catch (err) {
            showToast(err.message || 'Gagal menghapus pegawai.', 'error');
            setDeleteConfirm(null);
        }
    };

    const getInitials = (nama) => nama.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <Layout title="Data Pegawai">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                    <span>{toast.msg}</span>
                </div>
            )}

            {/* Stats */}
            <div className="pegawai-stats">
                <div className="peg-stat">
                    <User size={20} />
                    <div>
                        <span className="peg-stat-val">{employees.length}</span>
                        <span className="peg-stat-label">Total User</span>
                    </div>
                </div>
                <div className="peg-stat">
                    <Shield size={20} />
                    <div>
                        <span className="peg-stat-val">{employees.filter(e => e.role === 'admin').length}</span>
                        <span className="peg-stat-label">Admin</span>
                    </div>
                </div>
                <div className="peg-stat">
                    <User size={20} />
                    <div>
                        <span className="peg-stat-val">{employees.filter(e => e.role === 'pegawai').length}</span>
                        <span className="peg-stat-label">Pegawai</span>
                    </div>
                </div>
                <div className="peg-stat">
                    <Key size={20} />
                    <div>
                        <span className="peg-stat-val">{jabatanList.length}</span>
                        <span className="peg-stat-label">Jabatan</span>
                    </div>
                </div>
            </div>

            <div className="chart-card">
                <div className="table-toolbar">
                    <div className="search-wrap">
                        <Search size={16} className="search-icon" />
                        <input
                            className="search-input"
                            placeholder="Cari nama atau email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-export" onClick={() => fetchData()} disabled={loading}>
                            {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />}
                        </button>
                        <button className="btn-absen btn-sm" onClick={openAdd}>
                            <UserPlus size={16} /> Tambah Pegawai
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-state" style={{ padding: '3rem 0' }}>
                            <Loader2 size={28} className="spin" />
                            <span>Memuat data pegawai...</span>
                        </div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Pegawai</th>
                                    <th>Email</th>
                                    <th>Jabatan</th>
                                    <th>Shift</th>
                                    <th>Role</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="7" className="empty-td">Tidak ada data pegawai</td></tr>
                                ) : (
                                    filtered.map((e, i) => (
                                        <tr key={e.id_user}>
                                            <td className="td-num">{i + 1}</td>
                                            <td>
                                                <div className="td-user">
                                                    <div className="td-avatar">{getInitials(e.nama)}</div>
                                                    <div>
                                                        <span>{e.nama}</span>
                                                        {e.id_user === currentUser?.id_user && (
                                                            <span style={{ display: 'block', fontSize: '0.68rem', color: '#3b82f6' }}>• Anda</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-muted">{e.email}</td>
                                            <td>{e.jabatan || <span className="text-muted">—</span>}</td>
                                            <td>{e.nama_shift || <span className="text-muted">—</span>}</td>
                                            <td>
                                                <span className={`badge ${e.role === 'admin' ? 'badge-admin' : 'badge-izin'}`}>
                                                    {e.role === 'admin' ? '👑 Admin' : '👤 Pegawai'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-btns">
                                                    <button className="action-btn edit-btn" onClick={() => openEdit(e)} title="Edit">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        className="action-btn del-btn"
                                                        onClick={() => setDeleteConfirm(e)}
                                                        title="Hapus"
                                                        disabled={e.id_user === currentUser?.id_user}
                                                        style={{ opacity: e.id_user === currentUser?.id_user ? 0.3 : 1 }}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-title">{editTarget ? '✏️ Edit Pegawai' : '➕ Tambah Pegawai'}</h3>

                        {formError && <div className="login-error" style={{ marginBottom: '12px' }}><span>{formError}</span></div>}

                        <div className="form-group">
                            <label className="form-label">Nama Lengkap *</label>
                            <input className="form-input" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Nama pegawai" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                Password {editTarget ? <span className="text-muted">(kosongkan jika tidak diubah)</span> : '*'}
                            </label>
                            <input className="form-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editTarget ? 'Biarkan kosong jika tidak diubah' : 'Min. 6 karakter'} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Jabatan</label>
                            <select className="form-input form-select" value={form.jabatan_id} onChange={e => setForm({ ...form, jabatan_id: e.target.value })}>
                                <option value="">— Pilih Jabatan —</option>
                                {jabatanList.map(j => (
                                    <option key={j.id_jabatan} value={j.id_jabatan}>{j.nama_jabatan}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Shift Kerja</label>
                            <select className="form-input form-select" value={form.shift_id} onChange={e => setForm({ ...form, shift_id: e.target.value })}>
                                <option value="">— Pilih Shift —</option>
                                {shiftList.map(s => (
                                    <option key={s.id_shift} value={s.id_shift}>{s.nama_shift} ({s.jam_masuk} – {s.jam_keluar})</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select className="form-input form-select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                                <option value="pegawai">👤 Pegawai</option>
                                <option value="admin">👑 Admin</option>
                            </select>
                        </div>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                            <button className="btn-absen btn-sm" onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 size={16} className="spin" /> : null}
                                {saving ? 'Menyimpan...' : editTarget ? 'Simpan Perubahan' : 'Tambah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card modal-sm" onClick={e => e.stopPropagation()}>
                        <div className="modal-del-icon"><Trash2 size={32} /></div>
                        <h3 className="modal-title">Hapus Pegawai?</h3>
                        <p className="modal-desc">Data <strong>{deleteConfirm.nama}</strong> akan dihapus secara permanen dari database.</p>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            <button className="btn-absen btn-sm btn-danger" onClick={() => handleDelete(deleteConfirm.id_user)}>
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
