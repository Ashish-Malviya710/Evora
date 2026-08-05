import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import api from '../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaLock, FaBell, FaSun, FaMoon, FaDesktop, FaSignOutAlt } from 'react-icons/fa';

const Settings = () => {
    const { logout } = useContext(AuthContext);
    const { theme, setTheme } = useContext(ThemeContext);

    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [updatingPass, setUpdatingPass] = useState(false);

    const [prefs, setPrefs] = useState({
        email: true,
        bookingUpdates: true,
        eventReminders: true,
        promotions: false
    });

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        setUpdatingPass(true);
        try {
            await api.put('/auth/change-password', {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            toast.success('Password updated successfully');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            toast.error(err.response?.data?.message || 'Password update failed');
        } finally {
            setUpdatingPass(false);
        }
    };

    const togglePref = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        toast.success('Notification preference updated');
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Account Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage security, theme preferences, and notifications</p>
            </motion.div>

            {/* Appearance / Theme Settings */}
            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaSun className="text-amber-500" /> Theme & Appearance
                </h3>
                <div className="grid grid-cols-3 gap-4 max-w-md">
                    <button onClick={() => setTheme('light')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 font-bold' : 'border-gray-200 dark:border-dark-400 text-gray-600 dark:text-gray-300'}`}>
                        <FaSun className="text-2xl" /> Light
                    </button>
                    <button onClick={() => setTheme('dark')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 font-bold' : 'border-gray-200 dark:border-dark-400 text-gray-600 dark:text-gray-300'}`}>
                        <FaMoon className="text-2xl" /> Dark
                    </button>
                    <button onClick={() => setTheme('system')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition ${theme === 'system' ? 'border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 font-bold' : 'border-gray-200 dark:border-dark-400 text-gray-600 dark:text-gray-300'}`}>
                        <FaDesktop className="text-2xl" /> System
                    </button>
                </div>
            </div>

            {/* Password Change */}
            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaLock className="text-primary-600" /> Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                        <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({ ...passwords, currentPassword: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                        <input type="password" required value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                        <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <button type="submit" disabled={updatingPass} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition shadow">
                        {updatingPass ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>

            {/* Notification Preferences */}
            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 sm:p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <FaBell className="text-yellow-500" /> Notification Preferences
                </h3>
                <div className="space-y-4 max-w-md">
                    {Object.entries({
                        email: 'Email Notifications',
                        bookingUpdates: 'Booking Status Updates',
                        eventReminders: 'Event Reminders',
                        promotions: 'Promotional Newsletters'
                    }).map(([key, label]) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                            <button type="button" onClick={() => togglePref(key)} className={`w-12 h-6 rounded-full transition relative ${prefs[key] ? 'bg-primary-600' : 'bg-gray-300 dark:bg-dark-400'}`}>
                                <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition ${prefs[key] ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Logout Action */}
            <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/40 p-6 sm:p-8 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Sign Out</h3>
                    <p className="text-sm text-red-500 dark:text-red-300">Log out of your current session on this device</p>
                </div>
                <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl transition flex items-center gap-2">
                    <FaSignOutAlt /> Logout
                </button>
            </div>
        </div>
    );
};

export default Settings;
