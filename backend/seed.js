/**
 * seed.js — Script untuk mengisi data awal database
 * Jalankan: node seed.js
 * 
 * PENTING: Pastikan sudah CREATE TABLE dari database.sql terlebih dahulu
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
    console.log('🌱 Memulai seeding database...\n');
    const conn = await pool.getConnection();

    try {
        // ── Hapus semua data lama (urutan FK-safe) ────────
        console.log('🧹 Membersihkan data lama...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE izin');
        await conn.query('TRUNCATE TABLE absensi');
        await conn.query('TRUNCATE TABLE users');
        await conn.query('TRUNCATE TABLE jabatan');
        await conn.query('TRUNCATE TABLE shift');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('   ✅ Semua tabel dikosongkan\n');

        // ── Jabatan ──────────────────────────────────────
        console.log('📌 Insert jabatan...');
        const jabatanList = [
            'Manajer HRD',
            'Staff IT',
            'Staff Keuangan',
            'Supervisor',
            'Staff Umum',
        ];
        for (const nama of jabatanList) {
            await conn.query('INSERT INTO jabatan (nama_jabatan) VALUES (?)', [nama]);
        }
        console.log(`   ✅ ${jabatanList.length} jabatan dimasukkan`);

        // Ambil ID jabatan yang baru
        const [jabRows] = await conn.query('SELECT id_jabatan, nama_jabatan FROM jabatan');
        const jabatan = {};
        jabRows.forEach(j => { jabatan[j.nama_jabatan] = j.id_jabatan; });

        // ── Shift ────────────────────────────────────────
        console.log('⏰ Insert shift...');
        const shifts = [
            ['Pagi', '07:00:00', '15:00:00'],
            ['Siang', '13:00:00', '21:00:00'],
            ['Normal', '08:00:00', '17:00:00'],
        ];
        for (const [nama, masuk, keluar] of shifts) {
            await conn.query(
                'INSERT INTO shift (nama_shift, jam_masuk, jam_keluar) VALUES (?, ?, ?)',
                [nama, masuk, keluar]
            );
        }
        console.log(`   ✅ ${shifts.length} shift dimasukkan`);

        // Ambil ID shift yang baru
        const [shiftRows] = await conn.query('SELECT id_shift, nama_shift FROM shift');
        const shift = {};
        shiftRows.forEach(s => { shift[s.nama_shift] = s.id_shift; });

        // ── Users ────────────────────────────────────────
        console.log('\n👤 Insert users...');
        const users = [
            { nama: 'Admin Sistem', email: 'admin@absensi.com', password: 'admin123', role: 'admin', jabatan: 'Manajer HRD', shift: 'Normal' },
            { nama: 'Budi Santoso', email: 'budi@absensi.com', password: 'budi123', role: 'pegawai', jabatan: 'Staff IT', shift: 'Normal' },
            { nama: 'Sari Dewi', email: 'sari@absensi.com', password: 'sari123', role: 'pegawai', jabatan: 'Staff Keuangan', shift: 'Normal' },
            { nama: 'Eko Prasetyo', email: 'eko@absensi.com', password: 'eko123', role: 'pegawai', jabatan: 'Supervisor', shift: 'Pagi' },
            { nama: 'Maya Putri', email: 'maya@absensi.com', password: 'maya123', role: 'pegawai', jabatan: 'Staff Umum', shift: 'Normal' },
        ];

        const insertedIds = {};
        for (const u of users) {
            const hashed = await bcrypt.hash(u.password, 10);
            const jabId = jabatan[u.jabatan];
            const shiftId = shift[u.shift];

            const [res] = await conn.query(
                'INSERT INTO users (nama, email, password, role, jabatan_id, shift_id) VALUES (?, ?, ?, ?, ?, ?)',
                [u.nama, u.email, hashed, u.role, jabId, shiftId]
            );
            insertedIds[u.email] = res.insertId;
            console.log(`   ✅ [${String(res.insertId).padStart(2)}] ${u.nama.padEnd(15)} | ${u.role.padEnd(8)} | pass: ${u.password}`);
        }

        // ── Absensi ──────────────────────────────────────
        console.log('\n📋 Insert absensi...');

        const d = (offset = 0) => {
            const date = new Date();
            date.setDate(date.getDate() - offset);
            return date.toISOString().slice(0, 10);
        };

        const absensiData = [
            // Hari ini
            [insertedIds['budi@absensi.com'], d(0), '08:02:00', '17:01:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['sari@absensi.com'], d(0), '09:15:00', null, 'Telat', '-6.2001', '106.8165'],
            [insertedIds['eko@absensi.com'], d(0), '07:55:00', '15:05:00', 'Hadir', '-6.2000', '106.8166'],
            // Kemarin (d-1)
            [insertedIds['budi@absensi.com'], d(1), '08:00:00', '17:00:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['sari@absensi.com'], d(1), '08:28:00', '17:00:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['maya@absensi.com'], d(1), null, null, 'Alpha', null, null],
            // 2 hari lalu
            [insertedIds['budi@absensi.com'], d(2), null, null, 'Izin', null, null],
            [insertedIds['eko@absensi.com'], d(2), '07:00:00', '15:00:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['sari@absensi.com'], d(2), '08:45:00', '17:00:00', 'Telat', '-6.2001', '106.8165'],
            // 3 hari lalu
            [insertedIds['budi@absensi.com'], d(3), '08:05:00', '17:05:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['sari@absensi.com'], d(3), '08:00:00', '17:00:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['maya@absensi.com'], d(3), '08:10:00', '17:00:00', 'Hadir', '-6.2000', '106.8166'],
            // 4 hari lalu
            [insertedIds['eko@absensi.com'], d(4), '07:58:00', '15:00:00', 'Hadir', '-6.2000', '106.8166'],
            [insertedIds['maya@absensi.com'], d(4), null, null, 'Alpha', null, null],
        ];

        for (const [uid, tgl, masuk, keluar, status, lat, lon] of absensiData) {
            await conn.query(
                `INSERT INTO absensi (user_id, tanggal, jam_masuk, jam_keluar, status, latitude, longitude)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [uid, tgl, masuk, keluar, status, lat, lon]
            );
        }
        console.log(`   ✅ ${absensiData.length} record absensi dimasukkan`);

        // ── Izin ─────────────────────────────────────────
        console.log('\n📝 Insert izin...');
        const tomorrow = () => {
            const t = new Date();
            t.setDate(t.getDate() + 1);
            return t.toISOString().slice(0, 10);
        };

        const izinData = [
            [insertedIds['budi@absensi.com'], d(2), 'Sakit', 'Demam tinggi, perlu istirahat', 'Disetujui', insertedIds['admin@absensi.com']],
            [insertedIds['sari@absensi.com'], d(0), 'Cuti', 'Keperluan keluarga', 'Pending', null],
            [insertedIds['budi@absensi.com'], tomorrow(), 'Dinas', 'Menghadiri seminar nasional IT', 'Pending', null],
            [insertedIds['maya@absensi.com'], d(1), 'Alpha', 'Tidak ada keterangan', 'Ditolak', insertedIds['admin@absensi.com']],
        ];

        for (const [uid, tgl, jenis, ket, status, proses] of izinData) {
            await conn.query(
                'INSERT INTO izin (user_id, tanggal, jenis_izin, keterangan, status, diproses_oleh) VALUES (?, ?, ?, ?, ?, ?)',
                [uid, tgl, jenis, ket, status, proses]
            );
        }
        console.log(`   ✅ ${izinData.length} record izin dimasukkan`);

        // ── Summary ──────────────────────────────────────
        console.log('\n═══════════════════════════════════════════');
        console.log('✅  Seeding selesai!');
        console.log('═══════════════════════════════════════════');
        console.log('\n👤 Akun yang tersedia:');
        console.log('─'.repeat(55));
        users.forEach(u => {
            const icon = u.role === 'admin' ? '👑' : '👤';
            console.log(`  ${icon} ${u.role.padEnd(8)} │ ${u.email.padEnd(25)} │ ${u.password}`);
        });
        console.log('─'.repeat(55));
        console.log('\n🚀 Jalankan server: npm run dev\n');

    } catch (err) {
        console.error('\n❌ Seeding gagal:', err.message);
        if (err.code) console.error('   Error code:', err.code);
    } finally {
        conn.release();
        process.exit(0);
    }
}

seed();
