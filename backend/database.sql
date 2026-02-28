-- ═══════════════════════════════════════════════════════
-- DATABASE ABSENSI PRO
-- Engine: MySQL 8+
-- Encoding: utf8mb4
-- ═══════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS db_absensi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE db_absensi;

-- ─── TABEL JABATAN ───────────────────────────────────
CREATE TABLE IF NOT EXISTS jabatan (
    id_jabatan  INT AUTO_INCREMENT PRIMARY KEY,
    nama_jabatan VARCHAR(100) NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─── TABEL SHIFT ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift (
    id_shift    INT AUTO_INCREMENT PRIMARY KEY,
    nama_shift  VARCHAR(50)  NOT NULL,
    jam_masuk   TIME         NOT NULL,
    jam_keluar  TIME         NOT NULL
);

-- ─── TABEL USERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id_user     INT AUTO_INCREMENT PRIMARY KEY,
    nama        VARCHAR(100) NOT NULL,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    role        ENUM('admin','pegawai') DEFAULT 'pegawai',
    jabatan_id  INT,
    shift_id    INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jabatan_id) REFERENCES jabatan(id_jabatan) ON DELETE SET NULL,
    FOREIGN KEY (shift_id)   REFERENCES shift(id_shift)    ON DELETE SET NULL
);

-- ─── TABEL ABSENSI ───────────────────────────────────
CREATE TABLE IF NOT EXISTS absensi (
    id_absen    INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    tanggal     DATE NOT NULL,
    jam_masuk   TIME,
    jam_keluar  TIME,
    status      ENUM('Hadir','Telat','Izin','Alpha') NOT NULL DEFAULT 'Hadir',
    latitude    VARCHAR(50),
    longitude   VARCHAR(50),
    keterangan  TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id_user) ON DELETE CASCADE,
    UNIQUE KEY unique_user_tanggal (user_id, tanggal)
);

-- ─── TABEL IZIN ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS izin (
    id_izin     INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL,
    tanggal     DATE NOT NULL,
    jenis_izin  ENUM('Sakit','Cuti','Dinas') NOT NULL,
    keterangan  TEXT,
    status      ENUM('Pending','Disetujui','Ditolak') NOT NULL DEFAULT 'Pending',
    diproses_oleh INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)       REFERENCES users(id_user) ON DELETE CASCADE,
    FOREIGN KEY (diproses_oleh) REFERENCES users(id_user) ON DELETE SET NULL
);

-- ═══════════════════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════════════════

-- Jabatan
INSERT INTO jabatan (nama_jabatan) VALUES
    ('Manajer HRD'),
    ('Staff IT'),
    ('Staff Keuangan'),
    ('Supervisor'),
    ('Staff Umum');

-- Shift
INSERT INTO shift (nama_shift, jam_masuk, jam_keluar) VALUES
    ('Pagi',   '07:00:00', '15:00:00'),
    ('Siang',  '13:00:00', '21:00:00'),
    ('Normal', '08:00:00', '17:00:00');

-- Users (password: admin123 / pegawai123 — di-hash bcrypt setelah seed)
-- Gunakan script seed.js untuk insert user dengan password yang di-hash
-- Berikut adalah placeholder (password plain, ganti via seed.js):
INSERT INTO users (nama, email, password, role, jabatan_id, shift_id) VALUES
    ('Admin Sistem',  'admin@absensi.com', '$2a$10$YKtMlfxjBpuwrfvVy3b2sO3JLhA8XlxvpuG0g3ZKzCf5N7YFJDlrK', 'admin',   1, 3),
    ('Budi Santoso',  'budi@absensi.com',  '$2a$10$YKtMlfxjBpuwrfvVy3b2sO3JLhA8XlxvpuG0g3ZKzCf5N7YFJDlrK', 'pegawai', 2, 3),
    ('Sari Dewi',     'sari@absensi.com',  '$2a$10$YKtMlfxjBpuwrfvVy3b2sO3JLhA8XlxvpuG0g3ZKzCf5N7YFJDlrK', 'pegawai', 3, 3);
-- CATATAN: Hash di atas = "admin123". Gunakan seed.js untuk password berbeda.

-- Absensi sample
INSERT INTO absensi (user_id, tanggal, jam_masuk, jam_keluar, status, latitude, longitude) VALUES
    (2, '2026-02-27', '08:02:00', '17:01:00', 'Hadir', '-6.200000', '106.816666'),
    (3, '2026-02-27', '09:15:00', '17:00:00', 'Telat',  '-6.200100', '106.816500'),
    (2, '2026-02-26', '07:58:00', '17:05:00', 'Hadir', '-6.200000', '106.816666'),
    (3, '2026-02-26', '08:00:00', '17:00:00', 'Hadir', '-6.200000', '106.816666'),
    (2, '2026-02-25', NULL,        NULL,        'Izin',  NULL,        NULL),
    (3, '2026-02-25', NULL,        NULL,        'Alpha', NULL,        NULL),
    (2, '2026-02-24', '08:05:00', '17:00:00', 'Hadir', '-6.200000', '106.816666'),
    (3, '2026-02-24', '08:30:00', '17:00:00', 'Telat',  '-6.200100', '106.816500');

-- Izin sample
INSERT INTO izin (user_id, tanggal, jenis_izin, keterangan, status) VALUES
    (2, '2026-02-25', 'Sakit', 'Demam tinggi, perlu istirahat', 'Disetujui'),
    (3, '2026-02-28', 'Cuti',  'Keperluan keluarga',            'Pending'),
    (2, '2026-03-05', 'Dinas', 'Menghadiri seminar nasional IT', 'Pending');
