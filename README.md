# 🗂️ Dashboard Absensi — AbsensiPro

Sistem manajemen absensi pegawai berbasis web yang dibangun dengan **React + Express.js + MySQL**.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-404D59?style=flat&logo=express)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=flat&logo=mysql&logoColor=white)

---

## ✨ Fitur

### 👑 Admin
- Dashboard rekap harian & grafik tren bulanan (realtime)
- Validasi & approve/reject pengajuan izin
- Kelola data pegawai (CRUD + atur jabatan & shift)
- Laporan kehadiran per pegawai + export CSV
- Riwayat absensi seluruh pegawai

### 👤 Pegawai
- Absensi masuk/keluar dengan validasi lokasi GPS
- Status absensi hari ini
- Pengajuan izin (Sakit, Cuti, Dinas)
- Riwayat kehadiran pribadi

---

## 🏗️ Teknologi

| Layer | Stack |
|---|---|
| Frontend | React 18 + Vite, React Router, Recharts |
| Backend | Node.js + Express.js |
| Database | MySQL 8 |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Styling | Vanilla CSS (dark mode) |

---

## 🚀 Cara Menjalankan

### 1. Clone repo
```bash
git clone https://github.com/Satriamhn/dashboard-absensi.git
cd dashboard-absensi
```

### 2. Setup Database MySQL
```bash
# Import schema ke MySQL
mysql -u root -p < backend/database.sql
```

### 3. Setup Backend
```bash
cd backend

# Salin file env dan isi konfigurasi
cp .env.example .env
# Edit .env: isi DB_PASSWORD dan JWT_SECRET

# Install dependencies
npm install

# Isi data awal (seed)
node seed.js

# Jalankan backend
npm run dev
# → http://localhost:5000
```

### 4. Setup Frontend
```bash
# Kembali ke root
cd ..

# Install dependencies
npm install

# Jalankan frontend
npm run dev
# → http://localhost:5173
```

---

## 🔑 Akun Demo

| Role | Email | Password |
|---|---|---|
| 👑 Admin | admin@absensi.com | admin123 |
| 👤 Pegawai | budi@absensi.com | budi123 |

---

## 📁 Struktur Proyek

```
dashboard-absensi/
├── backend/
│   ├── config/db.js          # Koneksi MySQL
│   ├── middleware/auth.js    # JWT middleware
│   ├── routes/
│   │   ├── auth.js           # Login, /me
│   │   ├── absensi.js        # Clock-in/out, riwayat
│   │   ├── izin.js           # Pengajuan & validasi izin
│   │   ├── users.js          # Kelola pegawai
│   │   └── laporan.js        # Rekap & export CSV
│   ├── database.sql          # Schema MySQL
│   ├── seed.js               # Data awal
│   └── server.js             # Entry point
└── src/
    ├── pages/
    │   ├── Dashboard.jsx     # Admin & Pegawai dashboard
    │   ├── Absensi.jsx       # GPS clock-in/out
    │   ├── Izin.jsx          # Pengajuan izin
    │   ├── ValidasiIzin.jsx  # Admin validasi
    │   ├── Laporan.jsx       # Grafik & tabel laporan
    │   ├── Pegawai.jsx       # Kelola pegawai
    │   └── Riwayat.jsx       # Riwayat absensi
    ├── context/AuthContext.jsx
    └── services/api.js       # Semua API calls
```

---

## 📌 Catatan

- File `.env` **tidak di-push** ke GitHub karena berisi password & JWT secret
- Salin `backend/.env.example` → `backend/.env` dan isi nilainya
- Pastikan MySQL berjalan sebelum menjalankan backend
