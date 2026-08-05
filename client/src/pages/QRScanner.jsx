import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaQrcode, FaCheckCircle, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const QRScanner = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState(null); // 'valid', 'already_checked_in', 'invalid'
    const [manualInput, setManualInput] = useState('');
    const [scanning, setScanning] = useState(false);
    const scannerRef = useRef(null);
    const html5QrRef = useRef(null);

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'organizer')) {
            navigate('/login'); return;
        }
    }, [user, navigate]);

    const startScanner = async () => {
        setScanning(true);
        setScanResult(null);
        setStatus(null);

        try {
            const { Html5Qrcode } = await import('html5-qrcode');
            const scanner = new Html5Qrcode('qr-reader');
            html5QrRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                async (decodedText) => {
                    try {
                        const qrData = JSON.parse(decodedText);
                        await verifyTicket(qrData.ticketId);
                        scanner.stop().catch(() => {});
                        setScanning(false);
                    } catch {
                        toast.error('Invalid QR code format');
                    }
                }
            );
        } catch (err) {
            toast.error('Camera access denied or not available');
            setScanning(false);
        }
    };

    const stopScanner = () => {
        if (html5QrRef.current) {
            html5QrRef.current.stop().catch(() => {});
            html5QrRef.current = null;
        }
        setScanning(false);
    };

    const verifyTicket = async (ticketId) => {
        try {
            const { data } = await api.post('/bookings/verify-ticket', { ticketId });
            setScanResult(data.booking);
            setStatus(data.status);
            toast.success(data.message);
        } catch (err) {
            const errData = err.response?.data;
            setScanResult(errData?.booking || null);
            setStatus(errData?.status || 'invalid');
            toast.error(errData?.message || 'Verification failed');
        }
    };

    const handleManualVerify = (e) => {
        e.preventDefault();
        if (manualInput.trim()) verifyTicket(manualInput.trim());
    };

    useEffect(() => {
        return () => stopScanner();
    }, []);

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">QR Check-In Scanner</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Scan attendee QR codes to verify tickets and mark attendance</p>
            </motion.div>

            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 mb-6">
                <div id="qr-reader" ref={scannerRef} className={`w-full rounded-xl overflow-hidden mb-4 ${!scanning ? 'hidden' : ''}`} style={{ minHeight: scanning ? 300 : 0 }}></div>

                {!scanning ? (
                    <button onClick={startScanner} className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 text-lg shadow-lg">
                        <FaQrcode /> Start Camera Scanner
                    </button>
                ) : (
                    <button onClick={stopScanner} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition">
                        Stop Scanner
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 mb-6">
                <h3 className="font-bold text-gray-800 dark:text-white mb-3">Manual Ticket ID Entry</h3>
                <form onSubmit={handleManualVerify} className="flex gap-3">
                    <input value={manualInput} onChange={e => setManualInput(e.target.value)}
                        placeholder="Enter ticket ID (e.g., EVT-ABCD1234)" className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition" />
                    <button type="submit" className="px-6 py-3 bg-gray-900 dark:bg-primary-600 text-white font-bold rounded-xl hover:bg-black transition">Verify</button>
                </form>
            </div>

            {status && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-2xl p-6 border-2 ${status === 'valid' ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : status === 'already_checked_in' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200'}`}>
                    <div className="flex items-center gap-4 mb-4">
                        {status === 'valid' && <FaCheckCircle className="text-4xl text-green-500" />}
                        {status === 'already_checked_in' && <FaExclamationTriangle className="text-4xl text-yellow-500" />}
                        {status === 'invalid' && <FaTimesCircle className="text-4xl text-red-500" />}
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                {status === 'valid' ? 'Valid Ticket ✓' : status === 'already_checked_in' ? 'Already Checked In ⚠' : 'Invalid Ticket ✕'}
                            </h3>
                            {scanResult && <p className="text-sm text-gray-500 dark:text-gray-400">Ticket ID: {scanResult.ticketId}</p>}
                        </div>
                    </div>
                    {scanResult && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div><span className="font-bold text-gray-500">Name:</span> <span className="text-gray-800 dark:text-white">{scanResult.userId?.name}</span></div>
                            <div><span className="font-bold text-gray-500">Event:</span> <span className="text-gray-800 dark:text-white">{scanResult.eventId?.title}</span></div>
                            <div><span className="font-bold text-gray-500">Seat:</span> <span className="text-gray-800 dark:text-white">{scanResult.seatNumber}</span></div>
                            <div><span className="font-bold text-gray-500">Status:</span> <span className="text-gray-800 dark:text-white">{scanResult.status}</span></div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
};

export default QRScanner;
