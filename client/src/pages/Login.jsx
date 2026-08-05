import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/axios';
import { FaKey, FaEnvelope, FaLock, FaTimes, FaRedo, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Forgot Password Modal State
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP Verification, 3: Set New Password
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotOTP, setForgotOTP] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');

    // 30-Second Resend OTP Timer State
    const [resendTimer, setResendTimer] = useState(0);
    const [resendDisabled, setResendDisabled] = useState(false);

    const { login, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    // Resend Timer Countdown Effect
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => {
                    if (prev <= 1) {
                        setResendDisabled(false);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    const startResendTimer = () => {
        setResendTimer(30);
        setResendDisabled(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const data = await login(email, password);
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'organizer') navigate('/organizer');
                else navigate('/');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.organizerPending) {
                    setError(data.message);
                } else {
                    if (data.role === 'admin') navigate('/admin');
                    else if (data.role === 'organizer') navigate('/organizer');
                    else navigate('/');
                }
            }
        } catch (err) {
            if (err.needsVerification) {
                setShowOTP(true);
                setError('Account not verified. A new OTP has been sent to your email.');
            } else {
                setError(typeof err === 'string' ? err : err.message || 'Login failed');
            }
        } finally {
            setLoading(false);
        }
    };

    // Step 1: Send Reset OTP
    const handleSendForgotOTP = async (e) => {
        e.preventDefault();
        if (!forgotEmail) {
            setForgotError('Please enter your registered email address');
            return;
        }
        setForgotLoading(true);
        setForgotError('');
        try {
            const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
            toast.success(data.message || 'OTP sent to your email address!');
            setForgotStep(2);
            startResendTimer();
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setForgotLoading(false);
        }
    };

    // Resend OTP handler with 30s lock
    const handleResendForgotOTP = async () => {
        if (resendDisabled || resendTimer > 0) return;
        setForgotLoading(true);
        setForgotError('');
        try {
            const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
            toast.success('Fresh OTP sent to your email address!');
            startResendTimer();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setForgotLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!forgotOTP) {
            setForgotError('Please enter the 6-digit OTP code');
            return;
        }
        setForgotLoading(true);
        setForgotError('');
        try {
            const { data } = await api.post('/auth/verify-reset-otp', {
                email: forgotEmail,
                otp: forgotOTP
            });
            toast.success(data.message || 'OTP verified successfully!');
            setForgotStep(3);
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setForgotLoading(false);
        }
    };

    // Step 3: Change Password
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || !confirmPassword) {
            setForgotError('Please fill in all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            setForgotError('New password and confirm password do not match');
            return;
        }
        if (newPassword.length < 6) {
            setForgotError('Password must be at least 6 characters long');
            return;
        }
        setForgotLoading(true);
        setForgotError('');
        try {
            const { data } = await api.post('/auth/reset-password', {
                email: forgotEmail,
                otp: forgotOTP,
                newPassword
            });
            toast.success(data.message || 'Password updated successfully!');
            setShowForgotModal(false);
            
            // Auto login with new password
            try {
                const loginData = await login(forgotEmail, newPassword);
                if (loginData.role === 'admin') navigate('/admin');
                else if (loginData.role === 'organizer') navigate('/organizer');
                else navigate('/');
            } catch {
                setEmail(forgotEmail);
                setPassword(newPassword);
            }

            setForgotStep(1);
            setForgotEmail('');
            setForgotOTP('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setForgotError(err.response?.data?.message || 'Failed to reset password');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto mt-16 bg-white dark:bg-dark-600 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-dark-400">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/logo.png" alt="Evora Logo" className="w-32 h-32 sm:w-36 sm:h-36 object-contain mb-4 filter drop-shadow-2xl hover:scale-105 transition duration-300" />
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-1">Welcome Back</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Sign in to your Evora account</p>
                </div>

                {error && <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3.5 rounded-xl mb-6 text-center text-sm font-medium border border-red-100 dark:border-red-900/40">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {!showOTP ? (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition text-sm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setForgotEmail(email);
                                            setForgotError('');
                                            setForgotStep(1);
                                            setShowForgotModal(true);
                                        }}
                                        className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                                        Forgot Password?
                                    </button>
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition text-sm"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Verification Code (OTP)</label>
                            <input
                                type="text"
                                required
                                placeholder="6-digit code"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition font-bold tracking-widest text-center text-lg"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength="6"
                            />
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg text-sm"
                    >
                        {loading ? 'Processing...' : (showOTP ? 'Verify OTP & Log In' : 'Sign In')}
                    </button>
                </form>

                <p className="text-center mt-8 text-gray-600 dark:text-gray-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Sign up</Link>
                </p>
            </motion.div>

            {/* FORGOT PASSWORD MODAL (3-STEP SEQUENTIAL FLOW) */}
            <AnimatePresence>
                {showForgotModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 space-y-6">
                            
                            {/* Modal Header */}
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-dark-500 pb-4">
                                <h3 className="font-extrabold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaKey className="text-primary-600" /> Reset Password
                                </h3>
                                <button onClick={() => setShowForgotModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-full text-gray-500 transition">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Step Indicator Badges */}
                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 border-b border-gray-100 dark:border-dark-500 pb-3">
                                <span className={forgotStep === 1 ? 'text-primary-600 dark:text-primary-400 font-extrabold' : 'opacity-60'}>1. Enter Email</span>
                                <span>➔</span>
                                <span className={forgotStep === 2 ? 'text-primary-600 dark:text-primary-400 font-extrabold' : 'opacity-60'}>2. Verify OTP</span>
                                <span>➔</span>
                                <span className={forgotStep === 3 ? 'text-primary-600 dark:text-primary-400 font-extrabold' : 'opacity-60'}>3. New Password</span>
                            </div>

                            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/40">
                                🔒 Password reset is strictly enabled for <strong>User</strong> and <strong>Organizer</strong> accounts.
                            </p>

                            {forgotError && (
                                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-xl text-xs font-medium border border-red-100 dark:border-red-900/40">
                                    {forgotError}
                                </div>
                            )}

                            {/* STEP 1: ENTER REGISTERED EMAIL */}
                            {forgotStep === 1 && (
                                <form onSubmit={handleSendForgotOTP} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Registered Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="enter your email address"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition shadow-lg">
                                        {forgotLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                                    </button>
                                </form>
                            )}

                            {/* STEP 2: VERIFY OTP (WITH 30S RESEND TIMER LOCK) */}
                            {forgotStep === 2 && (
                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Enter 6-Digit OTP</label>
                                            
                                            {/* RESEND OTP BUTTON WITH 30 SEC TIMER LOCK */}
                                            <button
                                                type="button"
                                                disabled={resendDisabled || resendTimer > 0 || forgotLoading}
                                                onClick={handleResendForgotOTP}
                                                className={`text-xs font-bold flex items-center gap-1.5 transition ${resendDisabled || resendTimer > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 dark:text-primary-400 hover:underline'}`}>
                                                <FaRedo className={resendTimer > 0 ? 'animate-spin' : ''} />
                                                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            maxLength="6"
                                            value={forgotOTP}
                                            onChange={(e) => setForgotOTP(e.target.value)}
                                            placeholder="e.g. 123456"
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 font-mono text-center font-bold tracking-widest text-xl outline-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setForgotStep(1)}
                                            className="flex-1 py-3 bg-gray-100 dark:bg-dark-500 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs hover:bg-gray-200 dark:hover:bg-dark-400 transition">
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs transition shadow-md">
                                            {forgotLoading ? 'Verifying...' : 'Verify OTP & Continue'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* STEP 3: CHANGE PASSWORD (UNLOCKED AFTER OTP IS VERIFIED) */}
                            {forgotStep === 3 && (
                                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-950/40 p-3 rounded-xl border border-green-200 dark:border-green-800/40 text-xs text-green-700 dark:text-green-300 font-medium flex items-center gap-2">
                                        <FaCheckCircle className="text-green-500 shrink-0 text-sm" />
                                        OTP Verified! Set your new account password below.
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength="6"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Minimum 6 characters"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                                        <input
                                            type="password"
                                            required
                                            minLength="6"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 text-sm outline-none"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition shadow-lg">
                                        {forgotLoading ? 'Updating Password...' : 'Change Password & Log In'}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Login;
