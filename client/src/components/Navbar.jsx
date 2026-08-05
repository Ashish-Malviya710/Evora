import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/axios';
import { FaTicketAlt, FaBell, FaSun, FaMoon, FaHeart, FaUser, FaCog, FaQrcode, FaBars, FaTimes } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, setTheme } = useContext(ThemeContext);
    const { socket } = useContext(SocketContext);
    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifs, setShowNotifs] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    useEffect(() => {
        if (socket) {
            socket.on('notification', (newNotif) => {
                setNotifications(prev => [newNotif, ...prev]);
                setUnreadCount(prev => prev + 1);
            });
            return () => socket.off('notification');
        }
    }, [socket]);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            setNotifications(data.notifications || []);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {}
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {}
    };

    const toggleTheme = () => {
        if (theme === 'dark') setTheme('light');
        else setTheme('dark');
    };

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
    };

    return (
        <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Brand */}
                    <Link to="/" className="text-xl sm:text-2xl font-black flex items-center gap-2 tracking-tight shrink-0">
                        <FaTicketAlt className="text-primary-500" /> Evora
                    </Link>

                    {/* Desktop Right Menu */}
                    <div className="hidden md:flex items-center gap-5">
                        <Link to="/" className="text-gray-300 hover:text-white transition font-medium text-sm">Events</Link>

                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="p-2 text-gray-300 hover:text-white rounded-lg transition" title="Toggle Theme">
                            {theme === 'dark' ? <FaSun className="text-amber-400" /> : <FaMoon />}
                        </button>

                        {user ? (
                            <>
                                {/* Wishlist Link */}
                                <Link to="/wishlist" className="text-gray-300 hover:text-rose-400 transition text-sm flex items-center gap-1" title="Wishlist">
                                    <FaHeart className="text-rose-500" /> Wishlist
                                </Link>

                                {/* Notifications */}
                                <div className="relative">
                                    <button onClick={() => { setShowNotifs(!showNotifs); if (unreadCount > 0) handleMarkAllRead(); }} className="p-2 text-gray-300 hover:text-white relative">
                                        <FaBell />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {showNotifs && (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-600 text-gray-800 dark:text-gray-200 rounded-2xl shadow-2xl border border-gray-100 dark:border-dark-400 overflow-hidden z-50">
                                                <div className="p-3 bg-gray-50 dark:bg-dark-500 border-b border-gray-100 dark:border-dark-400 font-bold text-xs uppercase tracking-wider flex justify-between">
                                                    <span>Notifications</span>
                                                    {unreadCount > 0 && <button onClick={handleMarkAllRead} className="text-primary-600 dark:text-primary-400 hover:underline">Mark read</button>}
                                                </div>
                                                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 dark:divide-dark-500">
                                                    {notifications.length === 0 ? (
                                                        <div className="p-4 text-center text-xs text-gray-400">No notifications</div>
                                                    ) : (
                                                        notifications.map(n => (
                                                            <div key={n._id} className={`p-3 text-xs ${!n.read ? 'bg-primary-50/50 dark:bg-primary-950/20' : ''}`}>
                                                                <p className="font-bold text-gray-900 dark:text-white">{n.title}</p>
                                                                <p className="text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Role specific buttons */}
                                {user.role === 'organizer' && (
                                    <>
                                        <Link to="/organizer" className="text-gray-300 hover:text-white text-sm font-semibold">Dashboard</Link>
                                        <Link to="/qr-scanner" className="text-gray-300 hover:text-white" title="QR Scanner"><FaQrcode /></Link>
                                    </>
                                )}

                                {user.role === 'admin' && (
                                    <>
                                        <Link to="/admin" className="text-gray-300 hover:text-white text-sm font-semibold">Admin Panel</Link>
                                        <Link to="/qr-scanner" className="text-gray-300 hover:text-white" title="QR Scanner"><FaQrcode /></Link>
                                    </>
                                )}

                                {user.role === 'user' && (
                                    <Link to="/dashboard" className="text-gray-300 hover:text-white text-sm font-semibold">My Bookings</Link>
                                )}

                                {/* User Menu */}
                                <Link to="/profile" className="text-gray-300 hover:text-white" title="Profile"><FaUser /></Link>
                                <Link to="/settings" className="text-gray-300 hover:text-white" title="Settings"><FaCog /></Link>
                                <button onClick={handleLogout} className="bg-gray-800 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-300 hover:text-white transition text-sm font-medium">Login</Link>
                                <Link to="/register" className="bg-white text-gray-900 hover:bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold transition">Sign Up</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Controls Header */}
                    <div className="flex md:hidden items-center gap-3">
                        {/* Theme Toggle */}
                        <button onClick={toggleTheme} className="p-2 text-gray-300 hover:text-white rounded-lg transition">
                            {theme === 'dark' ? <FaSun className="text-amber-400 text-lg" /> : <FaMoon className="text-lg" />}
                        </button>

                        {/* Notifications icon for mobile */}
                        {user && (
                            <button onClick={() => { setShowNotifs(!showNotifs); if (unreadCount > 0) handleMarkAllRead(); }} className="p-2 text-gray-300 relative">
                                <FaBell className="text-lg" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        )}

                        {/* Hamburger Button */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-300 hover:text-white text-xl focus:outline-none">
                            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Dropdown Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="md:hidden bg-gray-950 border-t border-gray-800 px-4 py-6 space-y-4">
                        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2">
                            Events Showcase
                        </Link>

                        {user ? (
                            <>
                                <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2 flex items-center gap-2">
                                    <FaHeart className="text-rose-500" /> My Wishlist
                                </Link>

                                {user.role === 'organizer' && (
                                    <>
                                        <Link to="/organizer" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2">
                                            Organizer Dashboard
                                        </Link>
                                        <Link to="/qr-scanner" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2 flex items-center gap-2">
                                            <FaQrcode /> Camera Check-In Scanner
                                        </Link>
                                    </>
                                )}

                                {user.role === 'admin' && (
                                    <>
                                        <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2">
                                            Admin Panel
                                        </Link>
                                        <Link to="/qr-scanner" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2 flex items-center gap-2">
                                            <FaQrcode /> Camera Check-In Scanner
                                        </Link>
                                    </>
                                )}

                                {user.role === 'user' && (
                                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-gray-200 hover:text-white font-medium py-2">
                                        My Bookings & Digital Tickets
                                    </Link>
                                )}

                                <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
                                    <div className="flex gap-4">
                                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white text-sm font-semibold flex items-center gap-1">
                                            <FaUser /> Profile
                                        </Link>
                                        <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="text-gray-300 hover:text-white text-sm font-semibold flex items-center gap-1">
                                            <FaCog /> Settings
                                        </Link>
                                    </div>
                                    <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="pt-4 border-t border-gray-800 flex gap-3">
                                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl text-sm transition">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition shadow-md">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
