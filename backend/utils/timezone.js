/**
 * timezone.js
 * Helper untuk menjamin semua waktu selalu dalam WIB (GMT+7)
 * — tidak bergantung pada timezone server (Vercel berjalan di UTC).
 */

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik

/**
 * Kembalikan objek Date yang sudah di-offset ke WIB.
 * @returns {Date}
 */
function nowWIB() {
    return new Date(Date.now() + WIB_OFFSET_MS);
}

/**
 * Kembalikan tanggal hari ini dalam format YYYY-MM-DD (WIB).
 * @returns {string}  contoh: "2026-03-31"
 */
function todayWIB() {
    return nowWIB().toISOString().slice(0, 10);
}

/**
 * Kembalikan jam sekarang dalam format HH:MM:SS (WIB).
 * @returns {string}  contoh: "08:05:23"
 */
function timeNowWIB() {
    return nowWIB().toISOString().slice(11, 19);
}

module.exports = { nowWIB, todayWIB, timeNowWIB };
