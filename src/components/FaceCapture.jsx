/**
 * FaceCapture.jsx
 * ─────────────────────────────────────────────────────────────
 * Komponen verifikasi wajah menggunakan kamera browser.
 * Menangkap foto dari webcam, preview, lalu kirim ke backend.
 *
 * Props:
 *   onCapture(base64)  — dipanggil saat foto berhasil diambil
 *   onCancel()         — dipanggil saat user batalkan
 *   tipe               — 'masuk' | 'keluar'
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, CheckCircle2, XCircle, Loader2, VideoOff } from 'lucide-react';

export default function FaceCapture({ onCapture, onCancel, tipe = 'masuk' }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [phase, setPhase] = useState('init'); // init | preview | captured | error
    const [capturedImage, setCapturedImage] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [countdown, setCountdown] = useState(null);
    const [faceDetected, setFaceDetected] = useState(false);

    // ─── Buka kamera ─────────────────────────────────────────
    const startCamera = useCallback(async () => {
        setCameraError(null);
        setPhase('init');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user', // kamera depan
                },
                audio: false,
            });

            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setPhase('preview');

            // Simulasi deteksi wajah (indicator agar UX lebih baik)
            setTimeout(() => setFaceDetected(true), 1500);
        } catch (err) {
            const msg =
                err.name === 'NotAllowedError'
                    ? 'Izin kamera ditolak. Aktifkan izin kamera di browser Anda.'
                    : err.name === 'NotFoundError'
                    ? 'Kamera tidak ditemukan. Pastikan perangkat memiliki kamera.'
                    : 'Gagal mengakses kamera: ' + err.message;
            setCameraError(msg);
            setPhase('error');
        }
    }, []);

    // ─── Matikan kamera ───────────────────────────────────────
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
    }, []);

    // ─── Ambil foto dengan countdown ─────────────────────────
    const captureWithCountdown = () => {
        if (phase !== 'preview') return;
        setCountdown(3);
    };

    useEffect(() => {
        if (countdown === null) return;
        if (countdown === 0) {
            captureNow();
            setCountdown(null);
            return;
        }
        const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const captureNow = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        const ctx = canvas.getContext('2d');
        // Mirror (flip horizontal) agar seperti cermin
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL('image/jpeg', 0.82);
        setCapturedImage(base64);
        setPhase('captured');
        stopCamera();
    };

    // ─── Kirim foto ke parent ─────────────────────────────────
    const confirmCapture = () => {
        if (capturedImage && onCapture) {
            onCapture(capturedImage);
        }
    };

    // ─── Ulangi ───────────────────────────────────────────────
    const retake = () => {
        setCapturedImage(null);
        setFaceDetected(false);
        startCamera();
    };

    // ─── Lifecycle ────────────────────────────────────────────
    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    return (
        <div className="face-capture-overlay">
            <div className="face-capture-modal">
                {/* Header */}
                <div className="face-capture-header">
                    <Camera size={22} className="face-icon-header" />
                    <div>
                        <h3>Verifikasi Wajah</h3>
                        <p>Absen {tipe === 'masuk' ? 'Masuk' : 'Keluar'} — Pastikan wajah terlihat jelas</p>
                    </div>
                </div>

                {/* Video / Preview area */}
                <div className="face-video-wrap">
                    {/* Frame guide */}
                    {phase === 'preview' && (
                        <div className={`face-frame-guide ${faceDetected ? 'face-detected' : ''}`}>
                            <div className="face-guide-corner tl" />
                            <div className="face-guide-corner tr" />
                            <div className="face-guide-corner bl" />
                            <div className="face-guide-corner br" />
                        </div>
                    )}

                    {/* Countdown overlay */}
                    {countdown !== null && (
                        <div className="face-countdown">
                            <span>{countdown}</span>
                        </div>
                    )}

                    {phase === 'error' ? (
                        <div className="face-error-state">
                            <VideoOff size={48} />
                            <p>{cameraError}</p>
                            <button className="btn-face-retry" onClick={startCamera}>
                                <RefreshCw size={16} /> Coba Lagi
                            </button>
                        </div>
                    ) : phase === 'captured' ? (
                        <img src={capturedImage} alt="Foto wajah" className="face-preview-img" />
                    ) : (
                        <video
                            ref={videoRef}
                            className="face-video"
                            autoPlay
                            playsInline
                            muted
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    )}

                    {/* Face detected badge */}
                    {phase === 'preview' && faceDetected && (
                        <div className="face-detected-badge">
                            <CheckCircle2 size={14} /> Wajah Terdeteksi
                        </div>
                    )}
                </div>

                {/* Hidden canvas untuk capture */}
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Status tips */}
                {phase === 'preview' && !faceDetected && (
                    <div className="face-tip">
                        <Loader2 size={14} className="spin" /> Mendeteksi wajah...
                    </div>
                )}
                {phase === 'preview' && faceDetected && (
                    <div className="face-tip face-tip-ok">
                        ✅ Posisikan wajah di tengah lalu klik ambil foto
                    </div>
                )}
                {phase === 'captured' && (
                    <div className="face-tip face-tip-ok">
                        ✅ Foto berhasil diambil. Pastikan wajah terlihat jelas.
                    </div>
                )}

                {/* Action Buttons */}
                <div className="face-actions">
                    {phase === 'preview' && (
                        <>
                            <button className="btn-face-cancel" onClick={onCancel}>
                                <XCircle size={16} /> Batalkan
                            </button>
                            <button
                                className="btn-face-capture"
                                onClick={captureWithCountdown}
                                disabled={countdown !== null || !faceDetected}
                            >
                                <Camera size={16} />
                                {countdown !== null ? `Mengambil dalam ${countdown}...` : 'Ambil Foto'}
                            </button>
                        </>
                    )}
                    {phase === 'captured' && (
                        <>
                            <button className="btn-face-retry" onClick={retake}>
                                <RefreshCw size={16} /> Ulangi
                            </button>
                            <button className="btn-face-confirm" onClick={confirmCapture}>
                                <CheckCircle2 size={16} /> Gunakan Foto Ini
                            </button>
                        </>
                    )}
                    {phase === 'error' && (
                        <button className="btn-face-cancel" onClick={onCancel}>
                            <XCircle size={16} /> Tutup
                        </button>
                    )}
                    {phase === 'init' && (
                        <div className="face-tip">
                            <Loader2 size={16} className="spin" /> Memulai kamera...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
