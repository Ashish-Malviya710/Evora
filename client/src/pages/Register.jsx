import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [infoMsg, setInfoMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, verifyOTP } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (!showOTP) {
                const res = await register(name, email, password, role);
                setShowOTP(true);
                setInfoMsg(res.message || 'OTP sent to your email. Please verify.');
            } else {
                const data = await verifyOTP(email, otp);
                if (data.role === 'admin') navigate('/admin');
                else if (data.role === 'organizer') navigate('/organizer');
                else navigate('/dashboard');
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-12 bg-white dark:bg-dark-600 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-dark-400">
            <div className="text-center mb-8 flex flex-col items-center">
                <img src="/logo.png" alt="Evora Logo" className="w-24 h-24 sm:w-28 sm:h-28 object-contain mb-3 drop-shadow-xl hover:scale-105 transition duration-300" />
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1">Create an Account</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Join Evora today as a User or Organizer</p>
            </div>

            {error && <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 text-center text-sm font-medium border border-red-100 dark:border-red-900/40">{error}</div>}
            {infoMsg && <div className="bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 p-3 rounded-xl mb-6 text-center text-sm font-medium border border-green-100 dark:border-green-900/40">{infoMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                {!showOTP ? (
                    <>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">I am registering as</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition"
                            >
                                <option value="user">User (Browse & Book Events)</option>
                                <option value="organizer">Organizer (Host & Manage Events)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 transition"
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
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl transition shadow-lg mt-4"
                >
                    {loading ? 'Processing...' : (showOTP ? 'Verify & Complete' : 'Sign Up')}
                </button>
            </form>

            {!showOTP && (
                <p className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
                    Already have an account? <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline">Sign in</Link>
                </p>
            )}
        </motion.div>
    );
};

export default Register;

