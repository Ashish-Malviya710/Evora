import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FaCalendarAlt, FaUsers, FaChartLine, FaTicketAlt,
    FaPlus, FaEdit, FaBan, FaClock, FaTimes, FaSearch,
    FaCheckCircle, FaQrcode, FaMoneyBillWave, FaEye, FaCheck, FaTimesCircle,
    FaHistory
} from 'react-icons/fa';

const OrganizerDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);
    const [events, setEvents] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetchingBookings, setFetchingBookings] = useState(false);

    // Active Modal state: 'total_events' | 'active_events' | 'total_bookings' | 'pending_approvals' | 'revenue' | 'upcoming' | 'attendance' | null
    const [activeModal, setActiveModal] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProof, setSelectedProof] = useState(null);

    useEffect(() => {
        if (!user || user.role !== 'organizer') { navigate('/login'); return; }
        fetchData();
        fetchOrganizerBookings();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [analyticsRes, eventsRes] = await Promise.all([
                api.get('/analytics/organizer'),
                api.get('/events/dashboard/my')
            ]);
            setAnalytics(analyticsRes.data);
            setEvents(eventsRes.data || []);
        } catch (error) {
            console.error('Error fetching organizer data', error);
        } finally { setLoading(false); }
    };

    const fetchOrganizerBookings = async () => {
        setFetchingBookings(true);
        try {
            const { data } = await api.get('/bookings/organizer');
            setAllBookings(data || []);
        } catch (err) {
            toast.error('Failed to load bookings list');
        } finally {
            setFetchingBookings(false);
        }
    };

    const handleOpenModal = (modalType) => {
        setSearchQuery('');
        setActiveModal(modalType);
        if (['total_bookings', 'pending_approvals', 'revenue', 'attendance'].includes(modalType)) {
            fetchOrganizerBookings();
        }
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        setSearchQuery('');
    };

    const handleApproveBooking = async (bookingId) => {
        try {
            await api.put(`/bookings/${bookingId}/approve`);
            toast.success('Ticket approved! QR Code ticket generated & issued to attendee.');
            setSelectedProof(null);
            fetchOrganizerBookings();
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error approving ticket');
        }
    };

    const handleRejectBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to reject this payment proof?')) {
            try {
                await api.put(`/bookings/${bookingId}/reject`);
                toast.success('Booking payment proof rejected');
                setSelectedProof(null);
                fetchOrganizerBookings();
                fetchData();
            } catch (err) {
                toast.error(err.response?.data?.message || 'Error rejecting booking');
            }
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await api.delete(`/bookings/${bookingId}`);
                toast.success('Booking cancelled successfully');
                setAllBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b));
                fetchData();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Error cancelling booking');
            }
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await api.patch(`/events/${id}/status`, { status });
            toast.success(`Event status updated to ${status}`);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating status');
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-xl font-semibold text-gray-500 dark:text-gray-400">Loading dashboard...</div></div>;

    const pendingCount = allBookings.filter(b => b.status === 'pending').length;
    const approvedCount = allBookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length;

    const stats = [
        { key: 'total_events', label: 'Total Events', value: analytics?.totalEvents || 0, icon: <FaCalendarAlt />, color: 'bg-blue-500', subtitle: 'View all hosted events' },
        { key: 'active_events', label: 'Active Events', value: analytics?.activeEvents || 0, icon: <FaClock />, color: 'bg-green-500', subtitle: 'View published events' },
        { key: 'total_bookings', label: 'Total Bookings', value: `${allBookings.length || analytics?.totalBookings || 0}`, icon: <FaTicketAlt />, color: 'bg-purple-500', subtitle: `${approvedCount} Approved • ${pendingCount} Pending` },
        { key: 'pending_approvals', label: 'Pending Approval', value: pendingCount, icon: <FaClock />, color: 'bg-amber-500', subtitle: 'Review & approve tickets' },
        { key: 'revenue', label: 'Revenue', value: `₹${analytics?.revenue || 0}`, icon: <FaChartLine />, color: 'bg-emerald-500', subtitle: 'Revenue breakdown' },
        { key: 'attendance', label: 'Attendance', value: analytics?.attendance || 0, icon: <FaUsers />, color: 'bg-rose-500', subtitle: 'View checked-in users' },
    ];

    // Modal Content Filters
    const q = searchQuery.toLowerCase();

    const filteredEvents = events.filter(e => {
        const matchesQuery = (e.title || '').toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (activeModal === 'active_events') return e.status === 'published' && new Date(e.date) >= new Date();
        if (activeModal === 'upcoming') return new Date(e.date) >= new Date();
        return true;
    });

    const filteredBookings = allBookings.filter(b => {
        const matchesQuery = (
            (b.userId?.name || '').toLowerCase().includes(q) ||
            (b.userId?.email || '').toLowerCase().includes(q) ||
            (b.eventId?.title || '').toLowerCase().includes(q) ||
            (b.ticketId || '').toLowerCase().includes(q)
        );
        if (!matchesQuery) return false;
        if (activeModal === 'pending_approvals') return b.status === 'pending';
        if (activeModal === 'attendance') return b.checkedIn === true;
        return true;
    });

    const revenuePerEvent = events.map(e => {
        const eventBookings = allBookings.filter(b => (b.eventId?._id === e._id || b.eventId === e._id) && b.status !== 'cancelled');
        const totalSold = eventBookings.length;
        const eventRevenue = totalSold * (e.ticketPrice || 0);
        return { ...e, totalSold, eventRevenue };
    });

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header Banner */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gray-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black mb-2">Organizer Dashboard</h1>
                    <p className="text-gray-400 text-sm">Manage your events, verify payment proof, and track real-time bookings</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/qr-scanner" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold py-3 px-6 rounded-xl transition shadow flex items-center gap-2">
                        <FaQrcode /> Camera Check-In Scanner
                    </Link>
                    <Link to="/create-event" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition shadow flex items-center gap-2">
                        <FaPlus /> Host New Event
                    </Link>
                </div>
            </motion.div>

            {/* Interactive Stat Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {stats.map((stat) => (
                    <motion.div
                        key={stat.key}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOpenModal(stat.key)}
                        className="bg-white dark:bg-dark-600 p-4 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm cursor-pointer hover:shadow-md transition flex flex-col justify-between group">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className={`w-10 h-10 ${stat.color} text-white rounded-xl flex items-center justify-center text-lg shadow-sm`}>
                                    {stat.icon}
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition">View ➔</span>
                            </div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                        </div>
                        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-gray-50 dark:border-dark-500 truncate">
                            {stat.subtitle}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Upcoming Events Section */}
            {(() => {
                const now = new Date();
                const getEventEndTime = (event) => {
                    const eventDate = new Date(event.date);
                    if (event.endTime) {
                        const timeParts = event.endTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                        if (timeParts) {
                            let hours = parseInt(timeParts[1]);
                            const minutes = parseInt(timeParts[2]);
                            const ampm = timeParts[3];
                            if (ampm) {
                                if (ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                                if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                            }
                            const endDt = new Date(eventDate);
                            endDt.setHours(hours, minutes, 0, 0);
                            return endDt;
                        }
                    }
                    const endDt = new Date(eventDate);
                    endDt.setHours(23, 59, 59, 999);
                    return endDt;
                };
                const upcomingEvents = events.filter(e => getEventEndTime(e) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
                const pastEvents = events.filter(e => getEventEndTime(e) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

                return (
                    <>
                        {/* Upcoming Events */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaCalendarAlt className="text-green-500" /> Upcoming Events ({upcomingEvents.length})
                                </h2>
                                <Link to="/create-event" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
                                    + Add New Event
                                </Link>
                            </div>

                            {upcomingEvents.length === 0 ? (
                                <div className="bg-white dark:bg-dark-600 rounded-3xl p-12 text-center border border-gray-100 dark:border-dark-400 space-y-4">
                                    <FaCalendarAlt className="text-4xl text-gray-300 mx-auto" />
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming events scheduled.</p>
                                    <Link to="/create-event" className="inline-block bg-primary-600 text-white font-bold py-3 px-6 rounded-xl shadow hover:bg-primary-700 transition">
                                        Create Your First Event
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map((event) => (
                                        <motion.div key={event._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-dark-600 rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-400 shadow-sm flex flex-col justify-between">
                                            <div className="h-40 bg-gray-200 dark:bg-dark-500 relative">
                                                {(event.thumbnail || event.banner || event.image) ? (
                                                    <img src={event.thumbnail || event.banner || event.image} alt={event.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xl">{event.category}</div>
                                                )}
                                                <span className={`absolute top-3 right-3 px-3 py-1 text-[10px] font-black rounded-full uppercase shadow-md ${
                                                    event.status === 'published' ? 'bg-green-500 text-white' :
                                                    event.status === 'cancelled' ? 'bg-red-500 text-white' :
                                                    'bg-amber-500 text-white'
                                                }`}>
                                                    {event.status}
                                                </span>
                                            </div>

                                            <div className="p-5 flex-grow space-y-2">
                                                <span className="text-[10px] font-extrabold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{event.category}</span>
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                                                <div className="flex justify-between items-center pt-2 text-xs font-semibold">
                                                    <span className="text-gray-600 dark:text-gray-300">Seats: {event.availableSeats}/{event.totalSeats}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{event.ticketPrice === 0 ? 'FREE' : `₹${event.ticketPrice}`}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-gray-100 dark:border-dark-400 flex items-center gap-3 flex-wrap">
                                                <Link to={`/events/${event._id}`} className="text-xs font-bold text-primary-600 hover:underline">View</Link>
                                                <Link to={`/edit-event/${event._id}`} className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                                                    <FaEdit /> Edit
                                                </Link>
                                                {event.status === 'draft' && (
                                                    <button onClick={() => handleStatusChange(event._id, 'published')} className="text-xs font-bold text-green-600 hover:underline ml-auto">Publish</button>
                                                )}
                                                {event.status === 'published' && (
                                                    <>
                                                        <button onClick={() => handleStatusChange(event._id, 'postponed')} className="text-xs font-bold text-yellow-600 hover:underline ml-auto"><FaClock className="inline mr-1" />Postpone</button>
                                                        <button onClick={() => handleStatusChange(event._id, 'cancelled')} className="text-xs font-bold text-red-600 hover:underline"><FaBan className="inline mr-1" />Cancel</button>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past Events Section */}
                        {pastEvents.length > 0 && (
                            <div className="mt-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                        <FaHistory className="text-gray-400" /> Past Events ({pastEvents.length})
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastEvents.map((event) => (
                                        <motion.div key={event._id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-white dark:bg-dark-600 rounded-3xl overflow-hidden border border-gray-100 dark:border-dark-400 shadow-sm flex flex-col justify-between opacity-80 hover:opacity-100 transition">
                                            <div className="h-40 bg-gray-200 dark:bg-dark-500 relative">
                                                {(event.thumbnail || event.banner || event.image) ? (
                                                    <img src={event.thumbnail || event.banner || event.image} alt={event.title} className="w-full h-full object-cover grayscale-[30%]" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-xl">{event.category}</div>
                                                )}
                                                <span className="absolute top-3 right-3 px-3 py-1 text-[10px] font-black rounded-full uppercase shadow-md bg-gray-600 text-white">
                                                    Completed
                                                </span>
                                            </div>

                                            <div className="p-5 flex-grow space-y-2">
                                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{event.category}</span>
                                                <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">{event.title}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                                                <div className="flex justify-between items-center pt-2 text-xs font-semibold">
                                                    <span className="text-gray-600 dark:text-gray-300">Seats: {event.availableSeats}/{event.totalSeats}</span>
                                                    <span className="font-bold text-gray-900 dark:text-white">{event.ticketPrice === 0 ? 'FREE' : `₹${event.ticketPrice}`}</span>
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-gray-100 dark:border-dark-400 flex items-center gap-3 flex-wrap">
                                                <Link to={`/events/${event._id}`} className="text-xs font-bold text-primary-600 hover:underline">View</Link>
                                                <span className="text-xs font-semibold text-gray-400 ml-auto flex items-center gap-1">
                                                    <FaCheckCircle className="text-green-500" /> Event Ended
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                );
            })()}

            {/* Recent Bookings Table */}
            {allBookings.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Attendee Bookings</h2>
                        <button onClick={() => handleOpenModal('total_bookings')} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">
                            View All Bookings ➔
                        </button>
                    </div>
                    <div className="bg-white dark:bg-dark-600 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-400 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-dark-500">
                                    <tr>
                                        <th className="text-left p-4 font-bold text-gray-600 dark:text-gray-300">User</th>
                                        <th className="text-left p-4 font-bold text-gray-600 dark:text-gray-300">Event</th>
                                        <th className="text-left p-4 font-bold text-gray-600 dark:text-gray-300">Status</th>
                                        <th className="text-right p-4 font-bold text-gray-600 dark:text-gray-300">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-400">
                                    {allBookings.slice(0, 5).map((b) => (
                                        <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-dark-500">
                                            <td className="p-4 text-gray-900 dark:text-white font-medium">{b.userId?.name || 'User'}</td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400">{b.eventId?.title}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${
                                                    b.status === 'approved' || b.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                                                    b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
                                                }`}>
                                                    {b.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {b.paymentScreenshot && (
                                                    <button onClick={() => setSelectedProof(b)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold rounded-lg text-xs transition border border-indigo-200 inline-flex items-center gap-1">
                                                        <FaEye /> Proof
                                                    </button>
                                                )}
                                                {b.status === 'pending' && (
                                                    <button onClick={() => handleApproveBooking(b._id)} className="px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 shadow-sm inline-flex items-center gap-1">
                                                        <FaCheck /> Approve
                                                    </button>
                                                )}
                                                {b.status !== 'cancelled' ? (
                                                    <button onClick={() => handleCancelBooking(b._id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold rounded-lg text-xs transition border border-red-200">
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 font-semibold">Cancelled</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* DYNAMIC MODALS FOR ALL STAT CARDS */}
            <AnimatePresence>
                {activeModal && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-4xl w-full max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-dark-400">
                            
                            {/* Modal Header */}
                            <div className="p-6 bg-gradient-to-r from-primary-700 to-primary-900 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black flex items-center gap-2">
                                        {activeModal === 'total_events' && <><FaCalendarAlt /> Total Hosted Events ({filteredEvents.length})</>}
                                        {activeModal === 'active_events' && <><FaClock /> Active / Published Events ({filteredEvents.length})</>}
                                        {activeModal === 'total_bookings' && <><FaTicketAlt /> All Booked Attendees ({filteredBookings.length})</>}
                                        {activeModal === 'pending_approvals' && <><FaClock /> Pending Ticket Approvals ({filteredBookings.length})</>}
                                        {activeModal === 'revenue' && <><FaMoneyBillWave /> Revenue Breakdown (Total: ₹{analytics?.revenue || 0})</>}
                                        {activeModal === 'upcoming' && <><FaCalendarAlt /> Upcoming Scheduled Events ({filteredEvents.length})</>}
                                        {activeModal === 'attendance' && <><FaUsers /> Attendance Tracker ({filteredBookings.length} Checked In)</>}
                                    </h3>
                                    <p className="text-xs text-primary-200 mt-1">Detailed report and ticket verification tools</p>
                                </div>
                                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-full transition text-white text-lg">
                                    <FaTimes />
                                </button>
                            </div>

                            {/* Search Filter Bar */}
                            <div className="p-4 bg-gray-50 dark:bg-dark-700 border-b border-gray-100 dark:border-dark-500 shrink-0">
                                <div className="relative flex items-center">
                                    <FaSearch className="absolute left-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by title, category, attendee name, email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-dark-600 rounded-xl border border-gray-200 dark:border-dark-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Modal Content Body */}
                            <div className="p-6 overflow-y-auto flex-grow">
                                {fetchingBookings ? (
                                    <div className="text-center py-12 text-gray-500">Loading details...</div>
                                ) : (
                                    <>
                                        {/* 1. EVENTS LIST MODALS */}
                                        {['total_events', 'active_events', 'upcoming'].includes(activeModal) && (
                                            filteredEvents.length === 0 ? <p className="text-center py-12 text-gray-400">No events found matching query.</p> : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {filteredEvents.map(e => (
                                                        <div key={e._id} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-2xl border border-gray-100 dark:border-dark-500 flex justify-between items-center">
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase text-primary-600">{e.category}</span>
                                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{e.title}</h4>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(e.date).toLocaleDateString()} • {e.location}</p>
                                                            </div>
                                                            <div className="text-right space-y-1">
                                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${e.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                                                                <p className="text-xs font-bold text-gray-900 dark:text-white">{e.ticketPrice === 0 ? 'FREE' : `₹${e.ticketPrice}`}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}

                                        {/* 2. TOTAL BOOKINGS & PENDING APPROVALS */}
                                        {['total_bookings', 'pending_approvals', 'attendance'].includes(activeModal) && (
                                            filteredBookings.length === 0 ? <p className="text-center py-12 text-gray-400">No bookings found in this category.</p> : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-100 dark:bg-dark-500 text-gray-700 dark:text-gray-300">
                                                            <tr>
                                                                <th className="p-3 text-left font-bold rounded-l-xl">Attendee</th>
                                                                <th className="p-3 text-left font-bold">Event Title</th>
                                                                <th className="p-3 text-left font-bold">Ticket ID & Seat</th>
                                                                <th className="p-3 text-left font-bold">Amount</th>
                                                                <th className="p-3 text-left font-bold">Status</th>
                                                                <th className="p-3 text-right font-bold rounded-r-xl">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-dark-500">
                                                            {filteredBookings.map((b) => (
                                                                <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                                                                    <td className="p-3">
                                                                        <p className="font-bold text-gray-900 dark:text-white">{b.userId?.name || 'User'}</p>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{b.userId?.email}</p>
                                                                    </td>
                                                                    <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{b.eventId?.title}</td>
                                                                    <td className="p-3 text-xs">
                                                                        <p className="font-mono font-bold text-primary-600 dark:text-primary-400">{b.ticketId || 'EVT-PENDING'}</p>
                                                                        <p className="text-gray-400">Seat: {b.seatNumber || 'General'}</p>
                                                                    </td>
                                                                    <td className="p-3 font-bold text-gray-900 dark:text-white">{b.amount === 0 ? 'Free' : `₹${b.amount}`}</td>
                                                                    <td className="p-3">
                                                                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${
                                                                            b.status === 'approved' || b.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                                                                            b.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                                                                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
                                                                        }`}>
                                                                            {b.status}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-right space-x-2">
                                                                        {b.paymentScreenshot && (
                                                                            <button onClick={() => setSelectedProof(b)} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold rounded-lg text-xs transition border border-indigo-200 inline-flex items-center gap-1">
                                                                                <FaEye /> Proof
                                                                            </button>
                                                                        )}
                                                                        {b.status === 'pending' && (
                                                                            <button onClick={() => handleApproveBooking(b._id)} className="px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 shadow-sm inline-flex items-center gap-1">
                                                                                <FaCheck /> Approve
                                                                            </button>
                                                                        )}
                                                                        {b.status !== 'cancelled' ? (
                                                                            <button onClick={() => handleCancelBooking(b._id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded-xl text-xs transition border border-red-200">
                                                                                Cancel
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400 font-semibold italic">Cancelled</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )
                                        )}

                                        {/* 3. REVENUE BREAKDOWN */}
                                        {activeModal === 'revenue' && (
                                            revenuePerEvent.length === 0 ? <p className="text-center py-12 text-gray-400">No revenue data available.</p> : (
                                                <div className="overflow-x-auto space-y-4">
                                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex justify-between items-center">
                                                        <div>
                                                            <p className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider">Total Platform Revenue</p>
                                                            <p className="text-3xl font-black text-amber-900 dark:text-amber-200 mt-1">₹{analytics?.revenue || 0}</p>
                                                        </div>
                                                        <FaMoneyBillWave className="text-4xl text-amber-500 opacity-60" />
                                                    </div>

                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-100 dark:bg-dark-500 text-gray-700 dark:text-gray-300">
                                                            <tr>
                                                                <th className="p-3 text-left font-bold rounded-l-xl">Event Title</th>
                                                                <th className="p-3 text-left font-bold">Category</th>
                                                                <th className="p-3 text-left font-bold">Ticket Price</th>
                                                                <th className="p-3 text-left font-bold">Tickets Sold</th>
                                                                <th className="p-3 text-left font-bold">Event Revenue</th>
                                                                <th className="p-3 text-right font-bold rounded-r-xl">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100 dark:divide-dark-500">
                                                            {revenuePerEvent.map((e) => (
                                                                <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition">
                                                                    <td className="p-3 font-bold text-gray-900 dark:text-white">{e.title}</td>
                                                                    <td className="p-3 text-xs text-gray-500">{e.category}</td>
                                                                    <td className="p-3 font-semibold">{e.ticketPrice === 0 ? 'Free' : `₹${e.ticketPrice}`}</td>
                                                                    <td className="p-3 font-bold text-primary-600">{e.totalSold}</td>
                                                                    <td className="p-3 font-black text-emerald-600">₹{e.eventRevenue}</td>
                                                                    <td className="p-3 text-right">
                                                                        <Link to={`/events/${e._id}`} className="text-xs font-bold text-primary-600 hover:underline">View Event</Link>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )
                                        )}
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PAYMENT SCREENSHOT PROOF VERIFICATION MODAL */}
            <AnimatePresence>
                {selectedProof && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-md w-full p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 space-y-4">
                            <div className="flex justify-between items-center border-b border-gray-100 dark:border-dark-500 pb-3">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <FaEye className="text-primary-600" /> Payment Screenshot Proof
                                </h3>
                                <button onClick={() => setSelectedProof(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-dark-500 rounded-full text-gray-500">
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="bg-gray-50 dark:bg-dark-700 p-3.5 rounded-2xl space-y-2 text-xs">
                                <p><span className="font-bold text-gray-700 dark:text-gray-300">Attendee:</span> {selectedProof.userId?.name} ({selectedProof.userId?.email})</p>
                                <p><span className="font-bold text-gray-700 dark:text-gray-300">Event:</span> {selectedProof.eventId?.title}</p>
                                <p><span className="font-bold text-gray-700 dark:text-gray-300">Ticket ID & Seat:</span> {selectedProof.ticketId || 'EVT-PENDING'} ({selectedProof.seatNumber || 'General'})</p>
                                <p><span className="font-bold text-gray-700 dark:text-gray-300">Amount Paid:</span> ₹{selectedProof.amount}</p>
                                <p><span className="font-bold text-gray-700 dark:text-gray-300">Status:</span> <span className="uppercase font-bold text-amber-600">{selectedProof.status}</span></p>
                            </div>

                            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-dark-500 bg-black/5 flex items-center justify-center min-h-[220px] max-h-[350px]">
                                <img src={selectedProof.paymentScreenshot} alt="Payment Receipt" className="w-full h-full object-contain max-h-[340px]" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                {selectedProof.status === 'pending' && (
                                    <>
                                        <button onClick={() => handleApproveBooking(selectedProof._id)} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-1">
                                            <FaCheck /> Approve Ticket & Issue QR
                                        </button>
                                        <button onClick={() => handleRejectBooking(selectedProof._id)} className="py-3 px-4 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded-xl text-xs transition border border-red-200">
                                            Reject
                                        </button>
                                    </>
                                )}
                                <button onClick={() => setSelectedProof(null)} className="py-3 px-4 bg-gray-100 dark:bg-dark-500 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs transition">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrganizerDashboard;
