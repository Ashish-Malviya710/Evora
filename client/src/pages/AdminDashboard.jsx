import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import {
    FaUsers, FaUserCheck, FaCalendarAlt, FaTicketAlt, FaMoneyBillWave,
    FaClock, FaCheck, FaTimes, FaEye, FaStar, FaTrash, FaEdit, FaPlus, FaTag, FaMapMarkerAlt
} from 'react-icons/fa';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [analytics, setAnalytics] = useState(null);
    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview'); // overview, events, bookings, organizers, reviews
    const [selectedScreenshot, setSelectedScreenshot] = useState(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: ''
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchData();
    }, [user, navigate]);

    const fetchData = async () => {
        try {
            const [analyticsRes, eventsRes, bookingsRes, usersRes, reviewsRes] = await Promise.all([
                api.get('/analytics/admin'),
                api.get('/events/admin/all'),
                api.get('/bookings/my'),
                api.get('/auth/users'),
                api.get('/reviews/admin/all')
            ]);
            setAnalytics(analyticsRes.data);
            setEvents(eventsRes.data || []);
            setBookings(bookingsRes.data || []);
            setOrganizers((usersRes.data || []).filter(u => u.role === 'organizer'));
            setReviews(reviewsRes.data || []);
        } catch (error) {
            toast.error('Error fetching admin data');
        } finally {
            setLoading(false);
        }
    };

    const handleApproveOrganizer = async (id, status) => {
        try {
            await api.put(`/users/${id}/organizer-status`, { status });
            toast.success(`Organizer application ${status}`);
            fetchData();
        } catch (err) {
            toast.error('Failed to update organizer status');
        }
    };

    const handleApproveBookingWithQR = async (id) => {
        try {
            await api.put(`/bookings/${id}/approve`);
            toast.success('Booking approved! QR Code ticket generated & sent to user.');
            setSelectedScreenshot(null);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error approving booking');
        }
    };

    const handleCancelBooking = async (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await api.delete(`/bookings/${id}`);
                toast.success('Booking cancelled');
                fetchData();
            } catch (err) {
                toast.error('Error cancelling booking');
            }
        }
    };

    const handleModerateReview = async (id) => {
        try {
            const { data } = await api.put(`/reviews/${id}/moderate`);
            toast.success(data.message);
            fetchData();
        } catch (err) {
            toast.error('Failed to moderate review');
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/events', formData);
            toast.success('Event created successfully');
            setShowEventForm(false);
            setFormData({ title: '', description: '', date: '', location: '', category: '', totalSeats: '', ticketPrice: '', image: '' });
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error creating event');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await api.delete(`/events/${id}`);
                toast.success('Event deleted successfully');
                fetchData();
            } catch (error) {
                toast.error('Error deleting event');
            }
        }
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold dark:text-white">Loading admin control center...</div>;

    // High-Contrast Dark Mode Chart Configuration
    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                labels: {
                    color: '#f8fafc',
                    font: { weight: 'bold', size: 12 }
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12,
                displayColors: true
            }
        },
        scales: {
            x: {
                ticks: { color: '#cbd5e1', font: { weight: 'bold' } },
                grid: { color: 'rgba(255, 255, 255, 0.08)' }
            },
            y: {
                ticks: { color: '#cbd5e1', font: { weight: 'bold' } },
                grid: { color: 'rgba(255, 255, 255, 0.08)' }
            }
        }
    };

    const doughnutOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#f8fafc',
                    font: { weight: 'bold', size: 12 },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: '#0f172a',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                borderColor: '#334155',
                borderWidth: 1,
                padding: 12
            }
        }
    };

    // Chart Data Configs
    const monthlyRevenueChart = {
        labels: (analytics?.monthlyRevenue || []).map(m => m._id || 'Month'),
        datasets: [{
            label: 'Monthly Revenue (₹)',
            data: (analytics?.monthlyRevenue || []).map(m => m.total),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: '#818cf8',
            pointRadius: 5
        }]
    };

    const categoryChart = {
        labels: (analytics?.categoryDistribution || []).map(c => c._id || 'Category'),
        datasets: [{
            data: (analytics?.categoryDistribution || []).map(c => c.count),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#14b8a6', '#ec4899']
        }]
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800">
                <div>
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        Platform Admin Control Center
                    </h1>
                    <p className="text-slate-300 text-sm">Full platform oversight: Events, Organizers, Revenue, and Proof Verifications</p>
                </div>
                <div className="flex gap-3">
                    <Link to="/create-event" className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl transition shadow flex items-center gap-2 text-sm">
                        <FaPlus /> Create New Event
                    </Link>
                </div>
            </motion.div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-dark-500">
                {['overview', 'events', 'bookings', 'organizers', 'reviews'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2.5 rounded-xl font-bold text-sm capitalize transition flex items-center gap-2 ${activeTab === tab ? 'bg-primary-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-600'}`}>
                        {tab === 'events' ? `Events (${events.length})` : tab}
                        {tab === 'organizers' && organizers.filter(o => o.organizerStatus === 'pending').length > 0 && (
                            <span className="ml-1 px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full font-extrabold">
                                {organizers.filter(o => o.organizerStatus === 'pending').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* 1. OVERVIEW TAB */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                            { title: 'Total Revenue', value: `₹${analytics?.revenue || 0}`, icon: <FaMoneyBillWave />, color: 'bg-emerald-500' },
                            { title: 'Total Users', value: analytics?.totalUsers || 0, icon: <FaUsers />, color: 'bg-blue-500' },
                            { title: 'Organizers', value: analytics?.totalOrganizers || 0, icon: <FaUserCheck />, color: 'bg-indigo-500' },
                            { title: 'Total Events', value: events.length || analytics?.totalEvents || 0, icon: <FaCalendarAlt />, color: 'bg-purple-500' },
                            { title: 'Active Events', value: analytics?.activeEvents || 0, icon: <FaClock />, color: 'bg-cyan-500' },
                            { title: 'Total Bookings', value: analytics?.totalBookings || 0, icon: <FaTicketAlt />, color: 'bg-amber-500' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white dark:bg-dark-600 p-4 rounded-2xl border border-gray-100 dark:border-dark-400 shadow-sm">
                                <div className={`w-10 h-10 ${stat.color} text-white rounded-xl flex items-center justify-center text-lg mb-2 shadow-md`}>{stat.icon}</div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.title}</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* High-Contrast Dark Mode Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white dark:bg-dark-600 p-6 rounded-3xl border border-gray-100 dark:border-dark-400 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                    <FaMoneyBillWave className="text-emerald-500" /> Monthly Revenue Analytics (₹)
                                </h3>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-300">Live Trend</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-dark-700/80 p-4 rounded-2xl border border-gray-100 dark:border-dark-500">
                                <Line data={monthlyRevenueChart} options={chartOptions} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-dark-600 p-6 rounded-3xl border border-gray-100 dark:border-dark-400 shadow-sm">
                            <h3 className="font-extrabold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                                <FaTag className="text-indigo-500" /> Category Breakdown
                            </h3>
                            <div className="bg-gray-50 dark:bg-dark-700/80 p-4 rounded-2xl border border-gray-100 dark:border-dark-500">
                                <Doughnut data={categoryChart} options={doughnutOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. EVENTS TAB (ALL EVENTS MANAGEMENT) */}
            {activeTab === 'events' && (
                <div className="bg-white dark:bg-dark-600 rounded-3xl border border-gray-100 dark:border-dark-400 overflow-hidden shadow-sm space-y-4">
                    <div className="p-6 border-b border-gray-100 dark:border-dark-500 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-xl text-gray-900 dark:text-white flex items-center gap-2">
                                <FaCalendarAlt className="text-primary-600" /> All Platform Events ({events.length})
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View, edit, or delete any event across the entire system</p>
                        </div>
                        <Link to="/create-event" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow">
                            <FaPlus /> Add Event
                        </Link>
                    </div>

                    {events.length === 0 ? (
                        <div className="p-12 text-center text-gray-400 font-medium">No events found in the database.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 dark:bg-dark-500 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <th className="p-4 text-left font-bold">Event Details</th>
                                        <th className="p-4 text-left font-bold">Category</th>
                                        <th className="p-4 text-left font-bold">Date & Location</th>
                                        <th className="p-4 text-left font-bold">Seats (Available/Total)</th>
                                        <th className="p-4 text-left font-bold">Price</th>
                                        <th className="p-4 text-left font-bold">Status</th>
                                        <th className="p-4 text-right font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-dark-500">
                                    {events.map((e) => (
                                        <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-dark-500/60 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-dark-700 overflow-hidden shrink-0">
                                                        {(e.thumbnail || e.banner || e.image) ? (
                                                            <img src={e.thumbnail || e.banner || e.image} alt={e.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-400">{e.category}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{e.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">By: {e.createdBy?.name || e.organizer?.name || 'Organizer'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4"><span className="px-2.5 py-1 bg-gray-100 dark:bg-dark-700 text-xs font-semibold rounded-full">{e.category}</span></td>
                                            <td className="p-4 text-xs text-gray-600 dark:text-gray-300">
                                                <p className="font-semibold">{new Date(e.date).toLocaleDateString()}</p>
                                                <p className="text-gray-400">{e.location}</p>
                                            </td>
                                            <td className="p-4 font-medium">
                                                <span className={e.availableSeats <= 0 ? 'text-red-500 font-bold' : 'text-gray-900 dark:text-white'}>
                                                    {e.availableSeats} / {e.totalSeats}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold">{e.ticketPrice === 0 ? <span className="text-green-500">FREE</span> : `₹${e.ticketPrice}`}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${e.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {e.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link to={`/events/${e._id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-50 hover:bg-primary-600 hover:text-white text-primary-600 dark:bg-primary-950/40 dark:text-primary-300 font-bold rounded-xl text-xs transition border border-primary-200 dark:border-primary-800/50 shadow-sm shrink-0">
                                                        <FaEye /> View
                                                    </Link>
                                                    <Link to={`/edit-event/${e._id}`} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-600 dark:bg-amber-950/40 dark:text-amber-300 font-bold rounded-xl text-xs transition border border-amber-200 dark:border-amber-800/50 shadow-sm shrink-0">
                                                        <FaEdit /> Edit
                                                    </Link>
                                                    <button onClick={() => handleDeleteEvent(e._id)} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 dark:bg-red-950/40 dark:text-red-300 font-bold rounded-xl text-xs transition border border-red-200 dark:border-red-800/50 shadow-sm shrink-0">
                                                        <FaTrash /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* 3. ORGANIZERS TAB */}
            {activeTab === 'organizers' && (
                <div className="bg-white dark:bg-dark-600 rounded-3xl border border-gray-100 dark:border-dark-400 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-dark-500">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Organizer Verification Applications</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-dark-500 text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="p-4 text-left font-bold">Name</th>
                                    <th className="p-4 text-left font-bold">Email</th>
                                    <th className="p-4 text-left font-bold">Status</th>
                                    <th className="p-4 text-right font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-dark-500">
                                {organizers.length === 0 ? <tr><td colSpan="4" className="p-6 text-center text-gray-400">No organizer applications</td></tr> : (
                                    organizers.map(o => (
                                        <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-dark-500">
                                            <td className="p-4 font-bold text-gray-900 dark:text-white">{o.name}</td>
                                            <td className="p-4 text-gray-500">{o.email}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${o.organizerStatus === 'approved' ? 'bg-green-100 text-green-700' : o.organizerStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    {o.organizerStatus}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                {o.organizerStatus === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApproveOrganizer(o._id, 'approved')} className="px-3 py-1.5 bg-green-500 text-white font-bold rounded-lg text-xs hover:bg-green-600 transition">Approve</button>
                                                        <button onClick={() => handleApproveOrganizer(o._id, 'rejected')} className="px-3 py-1.5 bg-red-500 text-white font-bold rounded-lg text-xs hover:bg-red-600 transition">Reject</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 4. BOOKINGS TAB */}
            {activeTab === 'bookings' && (
                <div className="bg-white dark:bg-dark-600 rounded-3xl border border-gray-100 dark:border-dark-400 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-100 dark:border-dark-500">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Booking Requests & Payment Screenshots</h3>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-dark-500">
                        {bookings.map(b => (
                            <div key={b._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg">{b.eventId?.title || 'Event'}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">User: {b.userId?.name} ({b.userId?.email}) • Amount: ₹{b.amount}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${b.status === 'approved' || b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${b.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{b.paymentStatus}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {b.paymentScreenshot && (
                                        <button onClick={() => setSelectedScreenshot(b)} className="px-3 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold rounded-xl text-xs flex items-center gap-1">
                                            <FaEye /> View Proof
                                        </button>
                                    )}
                                    {b.status !== 'cancelled' ? (
                                        <button onClick={() => handleCancelBooking(b._id)} className="px-3 py-2 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 font-bold rounded-xl text-xs transition border border-red-200">
                                            Cancel Booking
                                        </button>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-semibold italic">Cancelled</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. REVIEWS TAB */}
            {activeTab === 'reviews' && (
                <div className="bg-white dark:bg-dark-600 rounded-3xl border border-gray-100 dark:border-dark-400 p-6 space-y-4 shadow-sm">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Moderate Customer Reviews</h3>
                    {reviews.map(r => (
                        <div key={r._id} className="p-4 bg-gray-50 dark:bg-dark-700 rounded-2xl flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">{r.userId?.name}</span>
                                    <span className="text-amber-400 text-xs font-bold">★ {r.rating}/5</span>
                                    <span className="text-xs text-gray-400">on {r.eventId?.title}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{r.review}</p>
                            </div>
                            <button onClick={() => handleModerateReview(r._id)} className={`px-4 py-2 text-xs font-bold rounded-xl transition ${r.isModerated ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                                {r.isModerated ? 'Hide Review' : 'Approve Review'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Payment Screenshot Viewer Modal */}
            <AnimatePresence>
                {selectedScreenshot && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-dark-600 max-w-lg w-full p-6 rounded-3xl shadow-2xl space-y-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Payment Screenshot Proof</h3>
                            <img src={selectedScreenshot.paymentScreenshot} alt="Proof" className="w-full max-h-80 object-contain rounded-2xl bg-gray-100 dark:bg-dark-700" />
                            <div className="flex gap-3">
                                <button onClick={() => setSelectedScreenshot(null)} className="flex-1 py-3 bg-gray-100 dark:bg-dark-500 font-bold rounded-xl text-gray-700 dark:text-gray-300 text-sm">Close</button>
                                <button onClick={() => handleApproveBookingWithQR(selectedScreenshot._id)} className="flex-1 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700">Approve & Generate QR</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
