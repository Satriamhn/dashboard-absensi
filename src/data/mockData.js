// ─── MOCK DATA ─────────────────────────────────────────────────────────────
export const USERS = [
    { id_user: 1, nama: 'Admin Sistem', email: 'admin@absensi.com', password: 'admin123', role: 'admin', jabatan: 'Manajer HRD', avatar: 'AS' },
    { id_user: 2, nama: 'Budi Santoso', email: 'budi@absensi.com', password: 'budi123', role: 'pegawai', jabatan: 'Staff IT', avatar: 'BS' },
    { id_user: 3, nama: 'Sari Dewi', email: 'sari@absensi.com', password: 'sari123', role: 'pegawai', jabatan: 'Staff Keuangan', avatar: 'SD' },
];

export const JABATAN = [
    { id_jabatan: 1, nama_jabatan: 'Manajer HRD' },
    { id_jabatan: 2, nama_jabatan: 'Staff IT' },
    { id_jabatan: 3, nama_jabatan: 'Staff Keuangan' },
    { id_jabatan: 4, nama_jabatan: 'Supervisor' },
];

export const ABSENSI = [
    { id_absen: 1, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-02-27', jam_masuk: '08:02', jam_keluar: '17:01', status: 'Hadir', latitude: '-6.200000', longitude: '106.816666' },
    { id_absen: 2, user_id: 3, nama: 'Sari Dewi', tanggal: '2026-02-27', jam_masuk: '09:15', jam_keluar: '17:00', status: 'Telat', latitude: '-6.200100', longitude: '106.816500' },
    { id_absen: 3, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-02-26', jam_masuk: '07:58', jam_keluar: '17:05', status: 'Hadir', latitude: '-6.200000', longitude: '106.816666' },
    { id_absen: 4, user_id: 3, nama: 'Sari Dewi', tanggal: '2026-02-26', jam_masuk: '08:00', jam_keluar: '17:00', status: 'Hadir', latitude: '-6.200000', longitude: '106.816666' },
    { id_absen: 5, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-02-25', jam_masuk: '-', jam_keluar: '-', status: 'Izin', latitude: '-', longitude: '-' },
    { id_absen: 6, user_id: 3, nama: 'Sari Dewi', tanggal: '2026-02-25', jam_masuk: '-', jam_keluar: '-', status: 'Alpha', latitude: '-', longitude: '-' },
    { id_absen: 7, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-02-24', jam_masuk: '08:05', jam_keluar: '17:00', status: 'Hadir', latitude: '-6.200000', longitude: '106.816666' },
    { id_absen: 8, user_id: 3, nama: 'Sari Dewi', tanggal: '2026-02-24', jam_masuk: '08:30', jam_keluar: '17:00', status: 'Telat', latitude: '-6.200100', longitude: '106.816500' },
];

export const IZIN = [
    { id_izin: 1, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-02-25', jenis_izin: 'Sakit', keterangan: 'Demam tinggi, perlu istirahat', status: 'Disetujui' },
    { id_izin: 2, user_id: 3, nama: 'Sari Dewi', tanggal: '2026-02-28', jenis_izin: 'Cuti', keterangan: 'Keperluan keluarga', status: 'Pending' },
    { id_izin: 3, user_id: 2, nama: 'Budi Santoso', tanggal: '2026-03-05', jenis_izin: 'Dinas', keterangan: 'Menghadiri seminar nasional IT', status: 'Pending' },
];

export const MONTHLY_DATA = [
    { bulan: 'Sep', hadir: 18, telat: 2, izin: 1, alpha: 1 },
    { bulan: 'Okt', hadir: 20, telat: 1, izin: 2, alpha: 0 },
    { bulan: 'Nov', hadir: 17, telat: 3, izin: 1, alpha: 2 },
    { bulan: 'Des', hadir: 15, telat: 2, izin: 3, alpha: 1 },
    { bulan: 'Jan', hadir: 19, telat: 1, izin: 1, alpha: 0 },
    { bulan: 'Feb', hadir: 16, telat: 4, izin: 2, alpha: 2 },
];

export const SHIFT = [
    { id_shift: 1, nama_shift: 'Pagi', jam_masuk: '07:00', jam_keluar: '15:00' },
    { id_shift: 2, nama_shift: 'Siang', jam_masuk: '13:00', jam_keluar: '21:00' },
    { id_shift: 3, nama_shift: 'Normal', jam_masuk: '08:00', jam_keluar: '17:00' },
];

// Kantor coordinate (center + radius 100m)
export const OFFICE_LOCATION = {
    latitude: -6.200000,
    longitude: 106.816666,
    radius: 100, // meter
    nama: 'Kantor Pusat Jakarta',
};
