import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCamera, FaSave, FaTicketAlt, FaHeart, FaCalendarCheck } from 'react-icons/fa';

const Profile = () => {
    const { user, setUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        name: '',
        phone: '',
        bio: '',
        address: '',
        profilePicture: ''
    });

    const [stats, setStats] = useState({
        totalBookings: 0,
        upcomingEvents: 0,
        completedEvents: 0,
        wishlistCount: 0
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Fetch profile and bookings in parallel instead of sequentially
            const [profileRes, bookingsRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/bookings/my')
            ]);

            const data = profileRes.data;
            setProfile(data);
            setForm({
                name: data.name || '',
                phone: data.phone || '',
                bio: data.bio || '',
                address: data.address || '',
                profilePicture: data.profilePicture || ''
            });

            const userBookings = bookingsRes.data || [];
            const now = new Date();

            const upcoming = userBookings.filter(b => b.eventId && new Date(b.eventId.date) >= now && b.status !== 'cancelled').length;
            const completed = userBookings.filter(b => b.eventId && new Date(b.eventId.date) < now && (b.status === 'approved' || b.status === 'confirmed')).length;

            setStats({
                totalBookings: userBookings.length,
                upcomingEvents: upcoming,
                completedEvents: completed,
                wishlistCount: data.wishlist ? data.wishlist.length : 0
            });
        } catch (error) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'evora/profiles');

        try {
            toast.loading('Uploading picture...', { id: 'pic' });
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setForm(prev => ({ ...prev, profilePicture: data.url }));
            toast.success('Picture uploaded!', { id: 'pic' });
        } catch (err) {
            toast.error('Picture upload failed', { id: 'pic' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data } = await api.put('/auth/profile', form);
            toast.success('Profile updated successfully');
            // Update auth context state and localStorage if name or profilePicture changed
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const updatedUserInfo = { ...stored, name: data.name, profilePicture: data.profilePicture };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            if (setUser) setUser(updatedUserInfo);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold dark:text-white">Loading profile...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">My Profile</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your personal details and view activity stats</p>
            </motion.div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-dark-600 p-5 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-3"><FaTicketAlt /></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalBookings}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-dark-600 p-5 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-xl mb-3"><FaCalendarCheck /></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.upcomingEvents}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-dark-600 p-5 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-3"><FaCalendarCheck /></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Completed</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.completedEvents}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-dark-600 p-5 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm">
                    <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-xl mb-3"><FaHeart /></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Wishlist</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.wishlistCount}</p>
                </motion.div>
            </div>

            {/* Profile Form */}
            <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-dark-400">
                        <div className="relative group">
                            {form.profilePicture ? (
                                <img src={form.profilePicture} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-gray-100 dark:border-dark-500 shadow-md" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-primary-600 text-white flex items-center justify-center text-3xl font-extrabold uppercase border-4 border-gray-100 dark:border-dark-500 shadow-md">
                                    {form.name ? form.name.charAt(0) : 'U'}
                                </div>
                            )}
                            <label className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full cursor-pointer hover:bg-black transition shadow-lg">
                                <FaCamera className="text-xs" />
                                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                            </label>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{form.name || 'User'}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email}</p>
                            <span className="inline-block mt-2 px-3 py-0.5 text-xs font-bold rounded-full uppercase bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                Role: {profile?.role}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                            <div className="relative">
                                <FaUser className="absolute left-4 top-4 text-gray-400" />
                                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                            <div className="relative">
                                <FaPhone className="absolute left-4 top-4 text-gray-400" />
                                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address</label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-4 top-4 text-gray-400" />
                                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="City, Country"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                            <textarea rows="4" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Tell us a bit about yourself..."
                                className="w-full p-4 rounded-xl border border-gray-200 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={saving} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg flex items-center gap-2">
                            <FaSave /> {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
