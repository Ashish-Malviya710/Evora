import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaHeart, FaTrash, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            const { data } = await api.get('/auth/wishlist');
            setWishlist(data || []);
        } catch (error) {
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (eventId) => {
        try {
            await api.post(`/auth/wishlist/${eventId}`);
            setWishlist(prev => prev.filter(item => item._id !== eventId));
            toast.success('Removed from wishlist');
        } catch (error) {
            toast.error('Failed to remove event');
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
                <div className="flex items-center justify-between">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-dark-600 rounded-xl"></div>
                    <div className="h-8 w-20 bg-gray-200 dark:bg-dark-600 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-72 bg-gray-200 dark:bg-dark-600 rounded-2xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                        <FaHeart className="text-rose-500" /> Saved Wishlist
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Events you've saved for later</p>
                </div>
                <span className="text-sm font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 px-4 py-1.5 rounded-full">
                    {wishlist.length} Saved
                </span>
            </motion.div>

            {wishlist.length === 0 ? (
                <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm p-12 text-center border border-gray-100 dark:border-dark-400">
                    <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        <FaHeart />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Explore upcoming events and save your favorites to view them anytime!</p>
                    <Link to="/" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-md">
                        Explore Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((event) => (
                        <motion.div key={event._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-dark-600 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition border border-gray-100 dark:border-dark-400 flex flex-col">
                            <div className="h-44 bg-gray-200 dark:bg-dark-500 relative">
                                {event.image ? (
                                    <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">{event.category}</div>
                                )}
                                <button onClick={() => removeFromWishlist(event._id)} className="absolute top-3 right-3 bg-white/90 dark:bg-dark-700/90 text-rose-500 hover:text-rose-700 p-2.5 rounded-full shadow transition">
                                    <FaTrash className="text-sm" />
                                </button>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">{event.category}</span>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{event.title}</h3>
                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    <div className="flex items-center gap-2"><FaCalendarAlt /> <span>{new Date(event.date).toLocaleDateString()}</span></div>
                                    <div className="flex items-center gap-2"><FaMapMarkerAlt /> <span>{event.location}</span></div>
                                </div>
                                <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-400">
                                    <span className="font-black text-lg text-gray-900 dark:text-white">
                                        {event.ticketPrice === 0 ? <span className="text-green-500">Free</span> : `₹${event.ticketPrice}`}
                                    </span>
                                    <Link to={`/events/${event._id}`} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
