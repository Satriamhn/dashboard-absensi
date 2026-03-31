import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Trash2, Loader2, Minimize2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Generate session ID unik per browser session
const SESSION_ID = `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const QUICK_QUESTIONS = [
    'Cara absen masuk?',
    'Cara mengajukan izin?',
    'Status absensi apa saja?',
    'Cara melihat laporan?',
];

export default function Chatbot() {
    const [isOpen, setIsOpen]       = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages]   = useState([
        {
            id: 1,
            role: 'assistant',
            text: 'Halo! 👋 Saya **Abby**, asisten virtual AbsensiPro.\n\nSaya siap membantu kamu seputar penggunaan aplikasi ini. Ada yang bisa saya bantu?',
            time: new Date(),
        }
    ]);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [hasNew, setHasNew]       = useState(false);
    const bottomRef = useRef(null);
    const inputRef  = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setHasNew(false);
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, messages]);

    const sendMessage = async (text) => {
        const msg = (text || input).trim();
        if (!msg || loading) return;

        setInput('');
        const userMsg = { id: Date.now(), role: 'user', text: msg, time: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const res = await fetch(`${BASE_URL}/chatbot/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg, sessionId: SESSION_ID }),
            });
            const data = await res.json();

            const botMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                text: data.success ? data.reply : (data.message || 'Maaf, terjadi kesalahan.'),
                time: new Date(),
                error: !data.success,
            };
            setMessages(prev => [...prev, botMsg]);
            if (!isOpen) setHasNew(true);
        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                text: 'Maaf, tidak bisa terhubung ke server. Coba lagi nanti. 🔌',
                time: new Date(),
                error: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const resetChat = async () => {
        try {
            await fetch(`${BASE_URL}/chatbot/reset`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: SESSION_ID }),
            });
        } catch { /* silent */ }
        setMessages([{
            id: Date.now(),
            role: 'assistant',
            text: 'Percakapan direset. 🔄 Ada yang bisa saya bantu?',
            time: new Date(),
        }]);
    };

    const formatTime = (d) => d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Render text dengan bold & bullet sederhana
    const renderText = (text) => {
        return text.split('\n').map((line, i) => {
            const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return <p key={i} dangerouslySetInnerHTML={{ __html: bold || '&nbsp;' }} style={{ margin: '2px 0' }} />;
        });
    };

    return (
        <>
            {/* ── Floating Button ── */}
            <button
                className="chatbot-fab"
                onClick={() => { setIsOpen(o => !o); setIsMinimized(false); }}
                title="Tanya Abby — Asisten AbsensiPro"
                id="chatbot-toggle-btn"
            >
                {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
                {hasNew && !isOpen && <span className="chatbot-fab-badge" />}
            </button>

            {/* ── Chat Window ── */}
            {isOpen && (
                <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
                    {/* Header */}
                    <div className="chatbot-header">
                        <div className="chatbot-header-info">
                            <div className="chatbot-avatar">
                                <Bot size={18} />
                            </div>
                            <div>
                                <span className="chatbot-name">Abby</span>
                                <span className="chatbot-status">
                                    <span className="chatbot-dot" />
                                    Online
                                </span>
                            </div>
                        </div>
                        <div className="chatbot-header-actions">
                            <button onClick={resetChat} title="Reset percakapan" className="chatbot-icon-btn">
                                <Trash2 size={15} />
                            </button>
                            <button onClick={() => setIsMinimized(m => !m)} className="chatbot-icon-btn" title="Minimize">
                                <Minimize2 size={15} />
                            </button>
                            <button onClick={() => setIsOpen(false)} className="chatbot-icon-btn" title="Tutup">
                                <X size={15} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div className="chatbot-messages" id="chatbot-messages">
                                {messages.map(msg => (
                                    <div key={msg.id} className={`chatbot-msg-row ${msg.role}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="chatbot-msg-avatar bot-avatar">
                                                <Bot size={14} />
                                            </div>
                                        )}
                                        <div className={`chatbot-bubble ${msg.role} ${msg.error ? 'error' : ''}`}>
                                            <div className="chatbot-bubble-text">
                                                {renderText(msg.text)}
                                            </div>
                                            <span className="chatbot-bubble-time">{formatTime(msg.time)}</span>
                                        </div>
                                        {msg.role === 'user' && (
                                            <div className="chatbot-msg-avatar user-avatar">
                                                <User size={14} />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {loading && (
                                    <div className="chatbot-msg-row assistant">
                                        <div className="chatbot-msg-avatar bot-avatar">
                                            <Bot size={14} />
                                        </div>
                                        <div className="chatbot-bubble assistant typing">
                                            <span /><span /><span />
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>

                            {/* Quick Questions */}
                            {messages.length <= 2 && (
                                <div className="chatbot-quick">
                                    {QUICK_QUESTIONS.map(q => (
                                        <button
                                            key={q}
                                            className="chatbot-quick-btn"
                                            onClick={() => sendMessage(q)}
                                            disabled={loading}
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Input */}
                            <div className="chatbot-input-row">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="chatbot-input"
                                    placeholder="Tanya sesuatu..."
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                    disabled={loading}
                                    maxLength={500}
                                    id="chatbot-input-field"
                                />
                                <button
                                    className="chatbot-send-btn"
                                    onClick={() => sendMessage()}
                                    disabled={loading || !input.trim()}
                                    id="chatbot-send-btn"
                                >
                                    {loading ? <Loader2 size={18} className="spin" /> : <Send size={16} />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
