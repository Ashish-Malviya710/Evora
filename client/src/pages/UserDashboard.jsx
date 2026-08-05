import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FaTicketAlt, FaTimesCircle, FaQrcode, FaUpload, FaCalendarAlt, FaMapMarkerAlt, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

const UserDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');

    // Selected ticket for modal
    const [selectedTicket, setSelectedTicket] = useState(null);

    // Upload modal state
    const [uploadBooking, setUploadBooking] = useState(null);
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Cancel confirmation state
    const [cancellingBooking, setCancellingBooking] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchBookings();
    }, [user, navigate]);

    const fetchBookings = async () => {
        try {
            const { data } = await api.get('/bookings/my');
            setBookings(data || []);
        } catch (error) {
            toast.error('Error fetching bookings');
        } finally {
            setLoading(false);
        }
    };

    const confirmCancelBooking = async () => {
        if (!cancellingBooking) return;
        try {
            await api.delete(`/bookings/${cancellingBooking._id}`);
            toast.success('Ticket cancelled successfully');
            setCancellingBooking(null);
            fetchBookings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error cancelling ticket');
        }
    };

    const handleScreenshotSubmit = async (e) => {
        e.preventDefault();
        if (!screenshotFile || !uploadBooking) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('screenshot', screenshotFile);

        try {
            await api.post(`/bookings/${uploadBooking._id}/screenshot`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Payment screenshot uploaded successfully!');
            setUploadBooking(null);
            setScreenshotFile(null);
            fetchBookings();
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-pulse text-xl font-semibold text-gray-500 dark:text-gray-400">Loading your tickets...</div>
            </div>
        );
    }

    const filteredBookings = bookings.filter(b => {
        if (filterStatus === 'approved') return b.status === 'approved' || b.status === 'confirmed';
        if (filterStatus === 'pending') return b.status === 'pending';
        if (filterStatus === 'cancelled') return b.status === 'cancelled';
        return true;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary-700 to-primary-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold mb-2">Welcome back, {user?.name}!</h1>
                    <p className="text-primary-200 text-sm flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Customer Account Dashboard
                    </p>
                </div>
            </motion.div>

            {/* Header & Filter Tabs */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                    <FaTicketAlt className="text-primary-600" /> Booking History ({bookings.length})
                </h2>
                <div className="flex bg-gray-100 dark:bg-dark-600 p-1.5 rounded-2xl gap-1 border border-gray-200 dark:border-dark-400 flex-wrap">
                    <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${filterStatus === 'all' ? 'bg-primary-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
                        All ({bookings.length})
                    </button>
                    <button onClick={() => setFilterStatus('approved')} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${filterStatus === 'approved' ? 'bg-green-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
                        Active ({bookings.filter(b => b.status === 'approved' || b.status === 'confirmed').length})
                    </button>
                    <button onClick={() => setFilterStatus('pending')} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${filterStatus === 'pending' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
                        Pending ({bookings.filter(b => b.status === 'pending').length})
                    </button>
                    <button onClick={() => setFilterStatus('cancelled')} className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${filterStatus === 'cancelled' ? 'bg-red-600 text-white shadow' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
                        Cancelled ({bookings.filter(b => b.status === 'cancelled').length})
                    </button>
                </div>
            </div>

            {filteredBookings.length === 0 ? (
                <div className="bg-white dark:bg-dark-600 rounded-3xl shadow-sm p-12 text-center border border-gray-100 dark:border-dark-400">
                    <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/40 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                        <FaTicketAlt />
                    </div>
                    <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 font-medium">No bookings found in this view.</p>
                    <Link to="/" className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 px-8 rounded-xl transition shadow-lg">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBookings.map((booking) => (
                        <motion.div key={booking._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white dark:bg-dark-600 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition border border-gray-100 dark:border-dark-400 flex flex-col">
                            <div className="p-6 border-b border-gray-50 dark:border-dark-500 flex-grow">
                                {booking.eventId ? (
                                    <>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{booking.eventId.title}</h3>
                                            <div className="flex flex-col gap-1 items-end">
                                                <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                                                    booking.status === 'approved' || booking.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400' :
                                                    booking.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' :
                                                    booking.status === 'rejected' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400'
                                                }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4 space-y-1.5">
                                            <p><strong className="text-gray-700 dark:text-gray-300">Date:</strong> {new Date(booking.eventId.date).toLocaleDateString()}</p>
                                            <p><strong className="text-gray-700 dark:text-gray-300">Amount:</strong> {booking.amount === 0 ? 'Free' : `₹${booking.amount}`}</p>
                                            {booking.ticketId && <p><strong className="text-gray-700 dark:text-gray-300">Ticket ID:</strong> {booking.ticketId}</p>}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-red-500 italic text-sm">Event details unavailable</p>
                                )}
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-dark-500/50 flex flex-wrap gap-2 justify-between items-center shrink-0">
                                {(booking.status === 'approved' || booking.status === 'confirmed') && booking.qrCode && (
                                    <button onClick={() => setSelectedTicket(booking)} className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition shadow">
                                        <FaQrcode /> View QR Ticket
                                    </button>
                                )}
                                {booking.status === 'cancelled' && (
                                    <button onClick={() => setSelectedTicket(booking)} className="bg-gray-200 dark:bg-dark-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 transition">
                                        <FaTicketAlt /> View Cancelled Record
                                    </button>
                                )}
                                {booking.eventId && booking.status === 'pending' && booking.amount > 0 && !booking.paymentScreenshot && (
                                    <button onClick={() => setUploadBooking(booking)} className="text-primary-600 dark:text-primary-400 font-bold text-xs hover:underline flex items-center gap-1">
                                        <FaUpload /> Upload Screenshot
                                    </button>
                                )}
                                {booking.status !== 'cancelled' && (
                                    <button onClick={() => setCancellingBooking(booking)} className="text-red-500 font-bold text-xs hover:text-red-700 ml-auto flex items-center gap-1">
                                        <FaTimesCircle /> Cancel
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Selected QR Ticket Modal with All 11 Required Fields */}
            <AnimatePresence>
                {selectedTicket && (
                    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-dark-400 flex flex-col">
                            
                            {/* 2. Event Banner Header */}
                            <div className="relative h-44 bg-gray-900 overflow-hidden">
                                {(selectedTicket.eventId?.banner || selectedTicket.eventId?.thumbnail || selectedTicket.eventId?.image) ? (
                                    <img src={selectedTicket.eventId?.banner || selectedTicket.eventId?.thumbnail || selectedTicket.eventId?.image} alt={selectedTicket.eventId?.title} className="w-full h-full object-cover opacity-80" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-700 to-indigo-900 text-white text-2xl font-black">{selectedTicket.eventId?.category || 'EVORA TICKET'}</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent"></div>
                                
                                <button onClick={() => setSelectedTicket(null)} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition">
                                    <FaTimes />
                                </button>

                                <div className="absolute bottom-3 left-5 right-5 text-white">
                                    {/* 1. Event Name */}
                                    <h3 className="text-xl font-black line-clamp-1">{selectedTicket.eventId?.title}</h3>
                                    {/* 10. Organizer Name */}
                                    <p className="text-xs text-primary-300 font-semibold mt-0.5">
                                        Hosted by: {selectedTicket.eventId?.createdBy?.name || selectedTicket.eventId?.organizer?.name || 'Evora Official Host'}
                                    </p>
                                </div>
                            </div>

                            {/* Ticket Body Content */}
                            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                                
                                {/* 11. QR Code */}
                                <div className="bg-gray-50 dark:bg-dark-700 p-4 rounded-2xl border border-gray-100 dark:border-dark-500 text-center space-y-2">
                                    {selectedTicket.qrCode ? (
                                        <img src={selectedTicket.qrCode} alt="Ticket QR Code" className="w-48 h-48 mx-auto object-contain bg-white p-2 rounded-xl border border-gray-200 shadow-sm" />
                                    ) : (
                                        <div className="py-8 text-amber-500 font-bold text-xs">QR Code pending approval verification</div>
                                    )}
                                    <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">Scan code at venue gate for camera check-in</p>
                                </div>

                                {/* All Key Ticket Details Grid */}
                                <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 dark:bg-dark-700 p-4 rounded-2xl border border-gray-100 dark:border-dark-500">
                                    {/* 3. Ticket ID */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Ticket ID</span>
                                        <span className="font-mono font-black text-primary-600 dark:text-primary-400 text-sm">{selectedTicket.ticketId || 'EVT-PENDING'}</span>
                                    </div>

                                    {/* 4. Booking ID */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Booking ID</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white truncate block">{selectedTicket._id}</span>
                                    </div>

                                    {/* 5. User Name */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Attendee Name</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{user?.name || selectedTicket.userId?.name || 'Attendee'}</span>
                                    </div>

                                    {/* 9. Booking Status */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Status</span>
                                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase mt-0.5 ${
                                            selectedTicket.status === 'approved' || selectedTicket.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300' :
                                            selectedTicket.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                                            'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                        }`}>
                                            {selectedTicket.status}
                                        </span>
                                    </div>

                                    {/* 6. Event Date & Time */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date & Time</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{new Date(selectedTicket.eventId?.date).toLocaleDateString()} • {selectedTicket.eventId?.time || '10:00 AM'}</span>
                                    </div>

                                    {/* 8. Seat Number */}
                                    <div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Seat Number</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedTicket.seatNumber || 'General Admission'}</span>
                                    </div>

                                    {/* 7. Venue */}
                                    <div className="col-span-2 border-t border-gray-200 dark:border-dark-500 pt-2 mt-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Venue</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{selectedTicket.eventId?.location}</span>
                                    </div>
                                </div>

                                <button onClick={() => window.print()} className="w-full py-3.5 bg-gray-900 dark:bg-primary-600 text-white font-extrabold rounded-2xl hover:bg-black transition text-sm shadow-lg">
                                    Print / Download Digital Ticket
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Screenshot Upload Modal */}
            <AnimatePresence>
                {uploadBooking && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-md w-full p-6 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 space-y-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Payment Screenshot</h3>
                            
                            <div className="bg-gray-100 dark:bg-dark-700 p-5 rounded-2xl text-center space-y-3">
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Scan to Pay ₹{uploadBooking.amount} to Organizer</p>
                                <div className="w-44 h-44 bg-white mx-auto rounded-2xl flex items-center justify-center p-3 shadow-md border border-gray-200 dark:border-dark-500">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(uploadBooking.eventId?.upiId || (uploadBooking.eventId?.organizer?.name ? `${uploadBooking.eventId.organizer.name.toLowerCase().replace(/\s+/g, '')}@upi` : 'organizer@upi'))}%26pn=${encodeURIComponent(uploadBooking.eventId?.title || 'Event')}%26am=${uploadBooking.amount}`} alt="UPI QR" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Organizer UPI ID</p>
                                    <span className="font-mono text-sm font-extrabold text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-800 px-4 py-1.5 rounded-xl border border-gray-200 dark:border-dark-500 inline-block shadow-sm select-all">
                                        {uploadBooking.eventId?.upiId || (uploadBooking.eventId?.organizer?.name ? `${uploadBooking.eventId.organizer.name.toLowerCase().replace(/\s+/g, '')}@upi` : 'organizer@upi')}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleScreenshotSubmit} className="space-y-4">
                                <input type="file" accept="image/*" required onChange={e => setScreenshotFile(e.target.files[0])}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-semibold" />
                                <div className="flex gap-2 justify-end">
                                    <button type="button" onClick={() => setUploadBooking(null)} className="px-4 py-2 bg-gray-100 dark:bg-dark-500 font-bold rounded-xl text-gray-600 dark:text-gray-300 text-xs">Cancel</button>
                                    <button type="submit" disabled={uploading} className="px-5 py-2 bg-primary-600 text-white font-bold rounded-xl text-xs hover:bg-primary-700 transition">
                                        {uploading ? 'Uploading...' : 'Submit'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cancel Ticket Confirmation Modal */}
            <AnimatePresence>
                {cancellingBooking && (
                    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-md w-full p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 space-y-6 text-center">
                            
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                                <FaExclamationTriangle />
                            </div>

                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">Cancel Ticket Confirmation</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Are you sure you want to cancel your ticket for <strong className="text-gray-900 dark:text-white">"{cancellingBooking.eventId?.title || 'this event'}"</strong>?
                                </p>
                                <p className="text-xs text-red-500 mt-2 font-medium">This action cannot be undone and your allocated seat will be released.</p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setCancellingBooking(null)} className="flex-1 py-3 bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400 font-bold rounded-xl text-gray-700 dark:text-gray-300 text-sm transition">
                                    No, Keep Ticket
                                </button>
                                <button onClick={confirmCancelBooking} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-red-600/30">
                                    Yes, Cancel Ticket
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDashboard;
