import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    FaCalendarAlt, FaMapMarkerAlt, FaChair, FaMoneyBillWave, FaQrcode,
    FaHeart, FaShareAlt, FaStar, FaGoogle, FaApple, FaUpload, FaCheckCircle, FaCalendarPlus,
    FaImages, FaExpand, FaTimes, FaRobot
} from 'react-icons/fa';

const EventDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { socket } = useContext(SocketContext);

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const [activeBooking, setActiveBooking] = useState(null);

    // Payment Screenshot Modal
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [uploadingScreen, setUploadingScreen] = useState(false);

    // QR Ticket Modal
    const [showTicketModal, setShowTicketModal] = useState(false);

    // Reviews & Wishlist
    const [reviews, setReviews] = useState([]);
    const [reviewSummary, setReviewSummary] = useState(null);
    const [avgRating, setAvgRating] = useState(0);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newReviewText, setNewReviewText] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const loadPageData = async () => {
            // Fetch event details, reviews, and AI review summary in parallel
            const fetches = [
                api.get(`/events/${id}`).then(({ data }) => setEvent(data)).catch(() => toast.error('Failed to load event details')),
                api.get(`/reviews/event/${id}`).then(({ data }) => { setReviews(data.reviews || []); setAvgRating(data.avgRating || 0); }).catch(() => {}),
                api.get(`/gemini/reviews/summary/${id}`).then(({ data }) => { if (data.hasReviews) setReviewSummary(data); }).catch(() => {}),
            ];
            if (user) {
                fetches.push(
                    api.get('/auth/wishlist').then(({ data }) => setIsWishlisted((data || []).some(item => item._id === id))).catch(() => {})
                );
            }
            await Promise.all(fetches);
            setLoading(false);
        };
        loadPageData();
    }, [id, user]);

    useEffect(() => {
        if (socket) {
            socket.emit('join_event', id);
            socket.on('seatUpdate', (data) => {
                if (data.eventId === id) {
                    setEvent(prev => prev ? { ...prev, availableSeats: data.availableSeats } : null);
                }
            });
            return () => {
                socket.emit('leave_event', id);
                socket.off('seatUpdate');
            };
        }
    }, [socket, id]);

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/reviews/event/${id}`);
            setReviews(data.reviews || []);
            setAvgRating(data.avgRating || 0);
        } catch (err) {}
    };

    const toggleWishlist = async () => {
        if (!user) { navigate('/login'); return; }
        try {
            await api.post(`/auth/wishlist/${id}`);
            setIsWishlisted(!isWishlisted);
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Saved to wishlist!');
        } catch (err) {
            toast.error('Wishlist action failed');
        }
    };

    const handleBooking = async () => {
        if (!user) { navigate('/login'); return; }
        setBookingLoading(true);

        try {
            if (!showOTP) {
                await api.post('/bookings/send-otp');
                setShowOTP(true);
                toast.success('OTP sent to your email address');
            } else {
                const { data } = await api.post('/bookings', { eventId: event._id, otp });
                setActiveBooking(data.booking);
                setShowOTP(false);
                toast.success('Booking request submitted!');
                if (event.ticketPrice > 0) {
                    setShowPaymentModal(true);
                }
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Booking failed');
        } finally {
            setBookingLoading(false);
        }
    };

    const handleScreenshotUpload = async (e) => {
        e.preventDefault();
        if (!screenshotFile || !activeBooking) return;
        setUploadingScreen(true);

        const formData = new FormData();
        formData.append('screenshot', screenshotFile);

        try {
            await api.post(`/bookings/${activeBooking._id}/screenshot`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Payment screenshot uploaded! Awaiting admin verification.');
            setShowPaymentModal(false);
        } catch (err) {
            toast.error('Upload failed');
        } finally {
            setUploadingScreen(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!user) { navigate('/login'); return; }
        setSubmittingReview(true);
        try {
            await api.post('/reviews', { eventId: id, rating: newRating, review: newReviewText });
            toast.success('Review submitted successfully!');
            setNewReviewText('');
            fetchReviews();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Calendar Link Generators
    const getGoogleCalendarUrl = () => {
        if (!event) return '#';
        const start = new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, '');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${start}/${start}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    };

    const generateICSFile = () => {
        if (!event) return;
        const icsData = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDESCRIPTION:${event.description}\nLOCATION:${event.location}\nDTSTART:${new Date(event.date).toISOString().replace(/-|:|\.\d\d\d/g, '')}\nEND:VEVENT\nEND:VCALENDAR`;
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `${event.title}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="text-center py-20 text-xl font-semibold dark:text-white">Loading event...</div>;
    if (!event) return <div className="text-center py-20 text-xl text-red-500">Event not found</div>;

    const isSoldOut = event.availableSeats <= 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Banner Section */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl h-80 sm:h-96 bg-gray-900">
                {(event.banner || event.image) ? (
                    <img src={event.banner || event.image} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50 text-6xl font-black uppercase tracking-widest">{event.category}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-between p-6 sm:p-10">
                    <div className="flex justify-between items-center">
                        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">
                            {event.category}
                        </span>
                        <button onClick={toggleWishlist} className={`p-3 rounded-full backdrop-blur-md transition ${isWishlisted ? 'bg-rose-500 text-white' : 'bg-black/40 text-white hover:bg-rose-500'}`}>
                            <FaHeart />
                        </button>
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">{event.title}</h1>
                        {event.subtitle && <p className="text-gray-300 text-lg font-light">{event.subtitle}</p>}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Event Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-dark-600 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-400">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About Event</h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-lg">{event.description}</p>

                        {event.highlights && event.highlights.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-dark-400">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Highlights</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {event.highlights.map((h, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 font-medium">
                                            <span className="text-green-500">✓</span> {h}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Event Photos & Gallery Showcase */}
                    {[event.thumbnail, ...(event.gallery || []), event.image, event.banner].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).length > 0 && (
                        <div className="bg-white dark:bg-dark-600 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-400 space-y-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <FaImages className="text-primary-600" /> Event Photos & Gallery Showcase
                            </h2>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {[event.thumbnail, ...(event.gallery || []), event.image, event.banner]
                                    .filter(Boolean)
                                    .filter((url, index, self) => self.indexOf(url) === index)
                                    .map((imgUrl, i) => (
                                        <motion.div key={i} whileHover={{ scale: 1.03 }} onClick={() => setLightboxImage(imgUrl)}
                                            className="h-40 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-gray-100 dark:border-dark-500 relative group bg-gray-100 dark:bg-dark-700">
                                            <img src={imgUrl} alt={`Gallery photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[2px]">
                                                <FaExpand /> View Photo
                                            </div>
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Calendar Export */}
                    <div className="bg-white dark:bg-dark-600 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-400 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <FaCalendarPlus className="text-primary-600 text-2xl" />
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Add to Calendar</h4>
                                <p className="text-xs text-gray-500">Never miss your booked event</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400 text-gray-800 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition">
                                <FaGoogle /> Google
                            </a>
                            <button onClick={generateICSFile} className="px-4 py-2 bg-gray-100 dark:bg-dark-500 hover:bg-gray-200 dark:hover:bg-dark-400 text-gray-800 dark:text-white text-xs font-bold rounded-xl flex items-center gap-2 transition">
                                <FaApple /> Apple (.ics)
                            </button>
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white dark:bg-dark-600 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-400">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reviews & Ratings</h2>
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 px-4 py-1.5 rounded-full font-bold">
                                <FaStar /> {avgRating} / 5 ({reviews.length} reviews)
                            </div>
                        </div>

                        {/* Add Review Form */}
                        {user && (
                            <form onSubmit={handleReviewSubmit} className="bg-gray-50 dark:bg-dark-700 p-5 rounded-2xl mb-8 space-y-4">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Leave a Review</h4>
                                <div className="flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star} type="button" onClick={() => setNewRating(star)} className={`text-xl ${star <= newRating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}>
                                            ★
                                        </button>
                                    ))}
                                </div>
                                <textarea required rows="3" value={newReviewText} onChange={e => setNewReviewText(e.target.value)} placeholder="Write your experience..."
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-dark-500 dark:bg-dark-800 dark:text-white text-sm outline-none" />
                                <button type="submit" disabled={submittingReview} className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition">
                                    {submittingReview ? 'Submitting...' : 'Post Review'}
                                </button>
                            </form>
                        )}

                        <div className="space-y-4">
                            {/* ✨ AI REVIEW SUMMARY CARD */}
                            {reviewSummary && reviewSummary.hasReviews && (
                                <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-transparent dark:from-indigo-950/40 dark:via-purple-950/40 border border-indigo-200 dark:border-indigo-800/50 p-5 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-extrabold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                                            <FaRobot className="text-primary-600 text-lg" /> ✨ AI Review Summary
                                        </h4>
                                        <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800/40">
                                            ★ {reviewSummary.avgRating}/5 ({reviewSummary.totalReviews} reviews)
                                        </span>
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <p className="text-green-700 dark:text-green-300 font-medium flex items-start gap-1.5">
                                            <span className="shrink-0 text-sm">🟢</span>
                                            <span>{reviewSummary.pros}</span>
                                        </p>
                                        <p className="text-amber-700 dark:text-amber-300 font-medium flex items-start gap-1.5">
                                            <span className="shrink-0 text-sm">🟡</span>
                                            <span>{reviewSummary.cons}</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {reviews.length === 0 ? <p className="text-gray-400 text-sm italic">No reviews yet for this event.</p> : (
                                reviews.map(r => (
                                    <div key={r._id} className="p-4 bg-gray-50 dark:bg-dark-700/50 rounded-2xl">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-bold text-gray-900 dark:text-white text-sm">{r.userId?.name || 'Anonymous'}</span>
                                            <span className="text-amber-400 text-xs font-bold">★ {r.rating}/5</span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">{r.review}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Booking Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-dark-600 p-6 rounded-3xl border border-gray-100 dark:border-dark-400 shadow-xl sticky top-24 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ticket Details</h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-500">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Price</span>
                                <span className="font-extrabold text-xl text-gray-900 dark:text-white">{event.ticketPrice === 0 ? <span className="text-green-500">FREE</span> : `₹${event.ticketPrice}`}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-500">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Available Seats</span>
                                <span className="font-bold text-gray-900 dark:text-white"><span className={event.availableSeats < 10 ? 'text-rose-500 font-black' : ''}>{event.availableSeats}</span> / {event.totalSeats}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-500">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Date</span>
                                <span className="font-bold text-gray-900 dark:text-white">{new Date(event.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-dark-500">
                                <span className="text-gray-500 dark:text-gray-400 font-semibold">Location</span>
                                <span className="font-bold text-gray-900 dark:text-white text-right">{event.location}</span>
                            </div>
                        </div>

                        {isSoldOut && (
                            <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 p-4 rounded-2xl text-center space-y-1">
                                <p className="text-red-600 dark:text-red-400 font-extrabold text-sm flex items-center justify-center gap-2">
                                    🚫 BOOKING FULL - HOUSEFULL
                                </p>
                                <p className="text-xs text-red-500/80">All seats for this event have been booked. You can still explore the event details!</p>
                            </div>
                        )}

                        {showOTP && !isSoldOut && (
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Enter OTP to Confirm</label>
                                <input type="text" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code"
                                    className="w-full text-center tracking-widest font-black text-lg py-3 rounded-xl border border-gray-300 dark:border-dark-400 dark:bg-dark-700 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                            </div>
                        )}

                        <button onClick={handleBooking} disabled={isSoldOut || bookingLoading || (showOTP && !otp)}
                            className={`w-full py-4 rounded-2xl font-extrabold text-lg transition shadow-lg ${isSoldOut ? 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30'}`}>
                            {bookingLoading ? 'Processing...' : showOTP ? 'Verify OTP & Book' : isSoldOut ? 'Booking Full (No Seats Left)' : 'Book Ticket Now'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Screenshot Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-dark-600 max-w-md w-full p-8 rounded-3xl shadow-2xl border border-gray-100 dark:border-dark-400 space-y-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center">UPI Payment</h3>
                            <div className="bg-gray-100 dark:bg-dark-700 p-6 rounded-2xl text-center space-y-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Scan to Pay ₹{event.ticketPrice} to Organizer</p>
                                <div className="w-48 h-48 bg-white mx-auto rounded-2xl flex items-center justify-center p-3 shadow-md border border-gray-200 dark:border-dark-500">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${encodeURIComponent(event.upiId || (event.organizer?.name ? `${event.organizer.name.toLowerCase().replace(/\s+/g, '')}@upi` : 'organizer@upi'))}%26pn=${encodeURIComponent(event.title)}%26am=${event.ticketPrice}`} alt="UPI QR" className="w-full h-full object-contain" />
                                </div>
                                <div className="pt-1">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Organizer UPI ID</p>
                                    <span className="font-mono text-sm font-extrabold text-primary-600 dark:text-primary-400 bg-white dark:bg-dark-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-500 inline-block shadow-sm select-all">
                                        {event.upiId || (event.organizer?.name ? `${event.organizer.name.toLowerCase().replace(/\s+/g, '')}@upi` : 'organizer@upi')}
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleScreenshotUpload} className="space-y-4">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Upload Payment Screenshot *</label>
                                <input type="file" accept="image/*" required onChange={e => setScreenshotFile(e.target.files[0])}
                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary-50 file:text-primary-700 file:font-semibold hover:file:bg-primary-100" />

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-dark-500 font-bold rounded-xl text-gray-700 dark:text-gray-300 text-sm">Skip</button>
                                    <button type="submit" disabled={uploadingScreen} className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition">
                                        {uploadingScreen ? 'Uploading...' : 'Submit Screenshot'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Fullscreen Photo Lightbox Modal */}
            <AnimatePresence>
                {lightboxImage && (
                    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setLightboxImage(null)} className="absolute -top-12 right-0 text-white text-2xl p-2 hover:opacity-80">
                                <FaTimes />
                            </button>
                            <img src={lightboxImage} alt="Fullscreen View" className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl object-contain border border-white/10" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EventDetail;

