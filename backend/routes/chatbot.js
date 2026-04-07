// AbsensiPro Chatbot — Gemini AI
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { SYSTEM_PROMPT } = require('../data/knowledge');

const router = express.Router();

// Session per user (in-memory)
const sessions = new Map();
setInterval(() => {
    const cutoff = Date.now() - 30 * 60 * 1000;
    for (const [k, v] of sessions) {
        if (v.lastActive < cutoff) sessions.delete(k);
    }
}, 10 * 60 * 1000);

// ─── POST /api/chatbot/chat ───────────────────────────
router.post('/chat', async (req, res) => {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
        return res.status(503).json({
            success: false,
            message: 'Chatbot belum dikonfigurasi. Hubungi admin untuk setup GEMINI_API_KEY.',
        });
    }

    // Session history
    const sid = sessionId || 'default';
    if (!sessions.has(sid)) sessions.set(sid, { history: [], lastActive: Date.now() });
    const session = sessions.get(sid);
    session.lastActive = Date.now();
    if (session.history.length > 18) session.history = session.history.slice(-18);

    try {
        const ai     = new GoogleGenerativeAI(apiKey);
        const model  = ai.getGenerativeModel(
            { model: 'gemini-2.5-flash' },
            { apiVersion: 'v1beta' }
        );



        // Bangun prompt dengan system context + history
        const historyText = session.history
            .map(m => `${m.role === 'user' ? 'User' : 'Abby'}: ${m.text}`)
            .join('\n');

        const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n${historyText}\nUser: ${message.trim()}\nAbby:`;

        const result = await model.generateContent(fullPrompt);
        const reply  = result.response.text().trim();

        // Simpan ke history
        session.history.push(
            { role: 'user',  text: message.trim() },
            { role: 'model', text: reply }
        );

        return res.json({ success: true, reply, sessionId: sid });

    } catch (err) {
        const errMsg = err?.message || String(err);
        console.error('[CHATBOT]', errMsg);

        if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid') || errMsg.includes('400')) {
            return res.status(503).json({ success: false, message: 'API key tidak valid. Cek konfigurasi GEMINI_API_KEY.' });
        }
        if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
            return res.status(429).json({ success: false, message: 'Batas kuota Gemini tercapai. Coba lagi nanti.' });
        }
        if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('403')) {
            return res.status(503).json({ success: false, message: 'Akses Gemini API ditolak. Pastikan Gemini API diaktifkan di Google Cloud.' });
        }

        // Return error detail di development
        const isDev = process.env.NODE_ENV === 'development';
        return res.status(500).json({
            success: false,
            message: 'Gagal menghubungi asisten.',
            ...(isDev && { debug: errMsg.slice(0, 200) }),
        });
    }
});

// ─── DELETE /api/chatbot/reset ────────────────────────
router.delete('/reset', (req, res) => {
    const { sessionId } = req.body;
    if (sessionId) sessions.delete(sessionId);
    return res.json({ success: true, message: 'Percakapan direset.' });
});

module.exports = router;
