import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { SocketContext } from '../context/SocketContext';
import { motion } from 'framer-motion';
import { FaCalendarAlt, FaMapMarkerAlt, FaSearch, FaRegClock, FaTicketAlt, FaShieldAlt, FaRobot, FaFire, FaStar, FaBookmark } from 'react-icons/fa';

const Home = () => {
    const [events, setEvents] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { socket } = useContext(SocketContext);

    const [aiSearchSummary, setAiSearchSummary] = useState('');
    const [isAiSearching, setIsAiSearching] = useState(false);

    const isInitialMount = React.useRef(true);

    useEffect(() => {
        // Instant fetch on initial mount, debounced on subsequent search changes
        if (isInitialMount.current) {
            isInitialMount.current = false;
            fetchEvents();
            return;
        }
        const timeoutId = setTimeout(() => {
            fetchEvents();
        }, 400); // 400ms debounce only for user typing
        return () => clearTimeout(timeoutId);
    }, [search]);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('seatUpdate', ({ eventId, availableSeats }) => {
                setEvents(prev => prev.map(e => e._id === eventId ? { ...e, availableSeats } : e));
                setRecommended(prev => prev.map(e => e._id === eventId ? { ...e, availableSeats } : e));
            });
            return () => socket.off('seatUpdate');
        }
    }, [socket]);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            if (search.trim().length > 2 && (search.toLowerCase().includes('free') || search.toLowerCase().includes('paid') || search.toLowerCase().includes('show') || search.toLowerCase().includes('find') || search.trim().split(' ').length >= 2)) {
                setIsAiSearching(true);
                const { data } = await api.post('/gemini/search', { query: search });
                setEvents(data.events || []);
                setAiSearchSummary(data.summary || '');
            } else {
                setIsAiSearching(false);
                setAiSearchSummary('');
                const { data } = await api.get(`/events?search=${search}`);
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        try {
            const { data } = await api.get('/gemini/recommendations');
            setRecommended(data.recommended || []);
        } catch (error) {
            console.warn('Error fetching AI recommendations:', error);
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="relative bg-gray-900 text-white rounded-3xl overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/80 to-transparent"></div>
                <div className="relative p-10 md:p-20 text-center flex flex-col items-center z-10">
                    <span className="bg-white/10 text-white backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border border-white/20">Welcome to Evora</span>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight drop-shadow-lg">
                        Find Your Next <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Unforgettable</span> Experience
                    </h1>
                    <p className="text-gray-300 text-base md:text-lg mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                        Discover top tech conferences, music festivals, and hands-on workshops happening around you.
                    </p>

                    <div className="w-full max-w-2xl mx-auto relative flex flex-col items-center">
                        <div className="w-full relative flex items-center shadow-2xl group">
                            <FaSearch className="absolute left-6 text-gray-400 text-xl group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                placeholder='Try AI Search: "Show free coding events this weekend"'
                                className="w-full pl-16 pr-6 py-5 rounded-full text-lg text-gray-900 bg-white/95 dark:bg-dark-700/90 dark:text-white backdrop-blur-sm border-2 border-transparent focus:border-primary-500 focus:outline-none transition-all placeholder-gray-400 font-medium"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        {aiSearchSummary && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className="mt-3 bg-primary-950/80 text-primary-300 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold border border-primary-800/60 shadow-lg flex items-center gap-2">
                                <FaRobot className="text-primary-400 text-sm animate-pulse" />
                                <span>✨ {aiSearchSummary}</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Why Choose Us */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 px-2">
                {[
                    { icon: <FaRegClock />, title: 'Fast Booking', desc: 'Secure tickets instantly with verified UPI payments and instant QR issuance.' },
                    { icon: <FaTicketAlt />, title: 'QR Access', desc: 'Seamless camera check-in scanner and mobile QR ticket dashboard.' },
                    { icon: <FaRobot />, title: 'Multi-Factor AI', desc: 'Smart event recommendations based on Previous Bookings, Wishlist, & Popularity.' },
                ].map((item, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-dark-600 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-400 flex flex-col items-center text-center hover:-translate-y-1 transition duration-300">
                        <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-lg shadow-primary-500/20">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* 🤖 AI MULTI-FACTOR RECOMMENDED FOR YOU SECTION */}
            {recommended.length > 0 && !search && (
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
                                <FaRobot className="text-primary-600 text-3xl" /> Recommended For You
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                                AI multi-factor curation based on <strong>Previous Bookings</strong>, <strong>Favourite Categories</strong> & <strong>Event Popularity</strong>
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {recommended.map((event, idx) => (
                            <motion.div key={`rec-${event._id}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                                className="bg-gradient-to-b from-indigo-900/10 via-white to-white dark:from-indigo-950/30 dark:via-dark-600 dark:to-dark-600 rounded-3xl overflow-hidden shadow-md border-2 border-primary-200 dark:border-primary-900/40 flex flex-col relative group hover:border-primary-500 transition">
                                
                                {/* AI Match Reason Badge */}
                                <div className="absolute top-3 left-3 z-20 bg-gray-900/90 text-amber-300 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide shadow-md flex items-center gap-1.5">
                                    <FaStar className="text-amber-400" />
                                    {event.reason || '🔥 Popular Event'}
                                </div>

                                <div className="h-48 bg-gray-200 dark:bg-dark-500 overflow-hidden relative">
                                    {(event.thumbnail || event.banner || event.image) ? (
                                        <img src={event.thumbnail || event.banner || event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">{event.category}</div>
                                    )}
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        <span className="bg-white/90 dark:bg-dark-700/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black shadow-sm dark:text-white">
                                            {event.ticketPrice === 0 ? <span className="text-green-500">FREE</span> : `₹${event.ticketPrice}`}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{event.category}</span>
                                        {event.popularityRatio !== undefined && (
                                            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                <FaFire /> {event.popularityRatio}% Booked
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{event.title}</h3>

                                    <div className="flex flex-col gap-2 mb-4 text-gray-500 dark:text-gray-400 text-sm">
                                        <div className="flex items-center gap-2">
                                            <FaCalendarAlt className="text-gray-400" />
                                            <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FaMapMarkerAlt className="text-gray-400" />
                                            <span className="line-clamp-1">{event.location}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4">
                                        <Link to={`/events/${event._id}`} className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition shadow-md">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* UPCOMING EVENTS LIST */}
            <div className="flex items-center justify-between mb-8 px-2 border-b border-gray-200 dark:border-dark-500 pb-4">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Upcoming Events</h2>
                <div className="text-gray-500 dark:text-gray-400 font-medium text-sm">{events.length} results found</div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="bg-white dark:bg-dark-600 h-80 rounded-2xl animate-pulse p-6 space-y-4">
                            <div className="bg-gray-200 dark:bg-dark-500 h-40 rounded-xl"></div>
                            <div className="bg-gray-200 dark:bg-dark-500 h-6 w-3/4 rounded"></div>
                            <div className="bg-gray-200 dark:bg-dark-500 h-4 w-1/2 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 text-xl text-gray-500 dark:text-gray-400">No published events found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {events.map((event, idx) => (
                        <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                            className="bg-white dark:bg-dark-600 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition border border-gray-100 dark:border-dark-400 flex flex-col">
                            <div className="h-48 bg-gray-200 dark:bg-dark-500 overflow-hidden relative">
                                {(event.thumbnail || event.banner || event.image) ? (
                                    <img src={event.thumbnail || event.banner || event.image} alt={event.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-2xl">{event.category}</div>
                                )}
                                <div className="absolute top-4 right-4 flex items-center gap-2">
                                    {event.availableSeats <= 0 && (
                                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-md">
                                            FULL
                                        </span>
                                    )}
                                    <span className="bg-white/90 dark:bg-dark-700/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm dark:text-white">
                                        {event.ticketPrice === 0 ? <span className="text-green-500">FREE</span> : `₹${event.ticketPrice}`}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="text-xs font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">{event.category}</div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-1">{event.title}</h2>
                                <div className="flex flex-col gap-2 mb-4 text-gray-500 dark:text-gray-400 text-sm">
                                    <div className="flex items-center gap-2">
                                        <FaCalendarAlt className="text-gray-400" />
                                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <FaMapMarkerAlt className="text-gray-400" />
                                        <span className="line-clamp-1">{event.location}</span>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4">
                                    <div className="w-full bg-gray-100 dark:bg-dark-500 rounded-full h-2 mb-2">
                                        <div className={`h-2 rounded-full transition-all duration-300 ${event.availableSeats <= 0 ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${Math.max(0, (event.availableSeats / event.totalSeats) * 100)}%` }}></div>
                                    </div>
                                    {event.availableSeats <= 0 ? (
                                        <p className="text-xs text-red-600 dark:text-red-400 font-bold mb-4">🚫 Booking Full (0 seats remaining)</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{event.availableSeats} of {event.totalSeats} seats remaining</p>
                                    )}
                                    <Link to={`/events/${event._id}`} className="block w-full text-center bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition shadow">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Footer */}
            <footer className="mt-auto pt-16 pb-8 border-t border-gray-200 dark:border-dark-500 text-center">
                <div className="flex justify-center items-center gap-2 mb-3">
                    <FaTicketAlt className="text-primary-600 text-2xl" />
                    <span className="text-xl font-black text-gray-900 dark:text-white">Evora</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 max-w-md mx-auto">
                    The ultimate event booking and management ecosystem for organizers and attendees.
                </p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">
                    Developed & Managed by Ashish Kumar
                </p>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    &copy; {new Date().getFullYear()} Evora Platform. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default Home;
