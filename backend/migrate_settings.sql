-- ─── TABEL SETTINGS ──────────────────────────────────
-- Menyimpan konfigurasi aplikasi (key-value store)
-- Gunakan perintah ini di database MySQL yang sudah ada
-- ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS settings (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    `key`       VARCHAR(100) NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    label       VARCHAR(200),
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nilai default (jalankan sekali saja)
INSERT INTO settings (`key`, value, label) VALUES
    ('company_name',    'AbsensiPro',    'Nama Perusahaan'),
    ('office_latitude', '-6.200000',     'Latitude Kantor'),
    ('office_longitude','106.816666',    'Longitude Kantor'),
    ('office_radius',   '100',           'Radius Kantor (meter)'),
    ('office_name',     'Kantor Pusat',  'Nama Lokasi Kantor')
ON DUPLICATE KEY UPDATE label = VALUES(label);
